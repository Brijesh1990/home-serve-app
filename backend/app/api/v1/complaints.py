import secrets
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.booking import Booking
from app.models.feedback import Complaint
from app.models.user import User
from app.schemas.domain import ComplaintCreateRequest, ComplaintResolveRequest
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_complaint

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.get("")
def list_complaints(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    if current_user.role == "customer":
        query = query.filter(Complaint.raised_by_user_id == current_user.id)
    elif current_user.role == "provider" and current_user.provider_profile:
        query = query.filter(
            (Complaint.against_provider_id == current_user.provider_profile.id)
            | (Complaint.raised_by_user_id == current_user.id)
        )
    if status_filter:
        query = query.filter(Complaint.status == status_filter)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [serialize_complaint(c) for c in complaints]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    against_provider_id = payload.against_provider_id
    if payload.booking_id and not against_provider_id:
        booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
        if booking:
            against_provider_id = booking.provider_id

    ticket_num = f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(2).upper()}"
    comp = Complaint(
        ticket_number=ticket_num,
        booking_id=payload.booking_id,
        raised_by_user_id=current_user.id,
        against_provider_id=against_provider_id,
        category=payload.category,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        status="Open",
        priority=payload.priority or "Medium",
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return serialize_complaint(comp)


@router.patch("/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: int,
    payload: ComplaintResolveRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint ticket not found")

    comp.status = payload.status or "Resolved"
    comp.admin_resolution = payload.admin_resolution.strip()
    comp.resolved_by_user_id = current_user.id
    comp.resolved_at = datetime.utcnow()

    create_notification(
        db,
        user_id=comp.raised_by_user_id,
        title=f"Support Ticket {comp.ticket_number} {comp.status}",
        message=f"Resolution: {comp.admin_resolution}",
        notification_type="support",
        reference_id=comp.id,
    )
    db.commit()
    db.refresh(comp)
    return serialize_complaint(comp)
