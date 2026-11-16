from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.bookings import _ensure_provider_earning
from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.booking import (
    Booking,
    BookingAssignment,
    BookingImage,
    BookingStatusHistory,
)
from app.models.provider import Technician
from app.models.user import User
from app.schemas.domain import AssignmentCreateRequest, AssignmentStatusUpdateRequest
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_assignment, serialize_booking

router = APIRouter(prefix="/assignments", tags=["Booking Assignments"])


@router.get("")
def list_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(BookingAssignment)
    if current_user.role == "technician" and current_user.technician_profile:
        query = query.filter(BookingAssignment.technician_id == current_user.technician_profile.id)
    elif current_user.role == "provider" and current_user.provider_profile:
        tech_ids = [t.id for t in (current_user.provider_profile.technicians or [])]
        query = query.filter(BookingAssignment.technician_id.in_(tech_ids)) if tech_ids else query.filter(BookingAssignment.id == -1)

    rows = query.order_by(BookingAssignment.created_at.desc()).all()
    return [serialize_assignment(a) for a in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def assign_technician(
    payload: AssignmentCreateRequest,
    current_user: User = Depends(require_roles("admin", "provider")),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    tech = db.query(Technician).filter(Technician.id == payload.technician_id).first()
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")

    # Check if technician has an overlapping active job on the same date & time
    overlapping = (
        db.query(BookingAssignment)
        .join(Booking, BookingAssignment.booking_id == Booking.id)
        .filter(
            BookingAssignment.technician_id == tech.id,
            Booking.id != booking.id,
            Booking.appointment_date == booking.appointment_date,
            Booking.appointment_time == booking.appointment_time,
            Booking.status.notin_(["Completed", "Cancelled", "Rejected"]),
            BookingAssignment.assignment_status.notin_(["Rejected", "Completed"]),
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Technician {tech.user.full_name if tech.user else tech.id} already has an active assignment on {booking.appointment_date} at {booking.appointment_time}",
        )

    existing_assign = db.query(BookingAssignment).filter(BookingAssignment.booking_id == booking.id).first()
    if existing_assign:
        existing_assign.technician_id = tech.id
        existing_assign.assigned_by_user_id = current_user.id
        existing_assign.assignment_status = "Assigned"
        assignment = existing_assign
    else:
        assignment = BookingAssignment(
            booking_id=booking.id,
            technician_id=tech.id,
            assigned_by_user_id=current_user.id,
            assignment_status="Assigned",
        )
        db.add(assignment)

    old_status = booking.status
    booking.status = "Provider Assigned"
    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            old_status=old_status,
            new_status="Provider Assigned",
            changed_by_user_id=current_user.id,
            notes=payload.notes or f"Assigned technician {tech.user.full_name if tech.user else tech.id}",
        )
    )

    if tech.user_id:
        create_notification(
            db,
            user_id=tech.user_id,
            title=f"New Job Assigned ({booking.booking_reference})",
            message=f"You have been assigned to {booking.service.name if booking.service else 'a service'} on {booking.appointment_date} at {booking.appointment_time}.",
            notification_type="assignment",
            reference_id=booking.id,
        )
    if booking.customer and booking.customer.user_id:
        create_notification(
            db,
            user_id=booking.customer.user_id,
            title=f"Technician Assigned ({booking.booking_reference})",
            message=f"{tech.user.full_name if tech.user else 'A certified technician'} has been assigned to your booking.",
            notification_type="assignment",
            reference_id=booking.id,
        )

    db.commit()
    db.refresh(assignment)
    db.refresh(booking)
    return {
        "assignment": serialize_assignment(assignment),
        "booking": serialize_booking(booking),
    }


@router.patch("/{assignment_id}/status")
def update_assignment_status(
    assignment_id: int,
    payload: AssignmentStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(BookingAssignment).filter(BookingAssignment.id == assignment_id).first()
    if not assignment:
        assignment = db.query(BookingAssignment).filter(BookingAssignment.booking_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    new_status = (payload.assignment_status or payload.status or "").strip()
    valid_statuses = {"Assigned", "Accepted", "Rejected", "Arrived", "In Progress", "Completed"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid assignment status '{new_status}'",
        )

    assignment.assignment_status = new_status
    now = datetime.utcnow()
    booking = assignment.booking

    if new_status == "Arrived":
        assignment.arrival_time = now
    elif new_status == "In Progress":
        if not assignment.arrival_time:
            assignment.arrival_time = now
        assignment.start_time = now
        if booking:
            old_b_status = booking.status
            booking.status = "In Progress"
            db.add(
                BookingStatusHistory(
                    booking_id=booking.id,
                    old_status=old_b_status,
                    new_status="In Progress",
                    changed_by_user_id=current_user.id,
                    notes="Technician started service execution",
                )
            )
    elif new_status == "Completed":
        assignment.completion_time = now
        if payload.completion_remarks:
            assignment.completion_remarks = payload.completion_remarks
        if assignment.technician:
            assignment.technician.total_jobs_completed = (assignment.technician.total_jobs_completed or 0) + 1
            assignment.technician.availability_status = "available"
        if booking:
            old_b_status = booking.status
            booking.status = "Completed"
            if booking.provider:
                booking.provider.total_completed_jobs = (booking.provider.total_completed_jobs or 0) + 1
            db.add(
                BookingStatusHistory(
                    booking_id=booking.id,
                    old_status=old_b_status,
                    new_status="Completed",
                    changed_by_user_id=current_user.id,
                    notes=payload.completion_remarks or "Service completed by technician",
                )
            )
            _ensure_provider_earning(db, booking)
    elif new_status == "Accepted":
        if booking and booking.status == "Pending":
            booking.status = "Provider Assigned"

    if booking and payload.before_image_url:
        db.add(
            BookingImage(
                booking_id=booking.id,
                uploaded_by_user_id=current_user.id,
                image_type="before",
                image_url=payload.before_image_url,
                caption="Before service photo",
            )
        )
    if booking and payload.after_image_url:
        db.add(
            BookingImage(
                booking_id=booking.id,
                uploaded_by_user_id=current_user.id,
                image_type="after",
                image_url=payload.after_image_url,
                caption="After service completion photo",
            )
        )

    if booking and booking.customer and booking.customer.user_id:
        create_notification(
            db,
            user_id=booking.customer.user_id,
            title=f"Job Update ({booking.booking_reference}): {new_status}",
            message=f"Technician updated job status to '{new_status}'.",
            notification_type="assignment",
            reference_id=booking.id,
        )

    db.commit()
    db.refresh(assignment)
    serialized_b = serialize_booking(assignment.booking) if assignment.booking else None
    return {
        "data": serialized_b,
        "assignment": serialize_assignment(assignment),
        "booking": serialized_b,
    }
