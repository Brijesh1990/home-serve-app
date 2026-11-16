import secrets
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.booking import (
    Booking,
    BookingAssignment,
    BookingImage,
    BookingStatusHistory,
)
from app.models.catalog import Service
from app.models.payment import CouponUsage
from app.models.provider import (
    AvailabilitySlot,
    ProviderEarning,
    ProviderService,
    ServiceProvider,
)
from app.models.user import Address, Customer, User
from app.schemas.domain import (
    AvailabilityCheckRequest,
    BookingCancelRequest,
    BookingCreateRequest,
    BookingRescheduleRequest,
    BookingStatusUpdateRequest,
)
from app.services.notification_service import create_notification
from app.services.pricing_service import (
    calculate_booking_pricing,
    validate_and_calculate_coupon,
)
from app.utils.serializers import serialize_booking

router = APIRouter(prefix="/bookings", tags=["Bookings"])
availability_router = APIRouter(prefix="/availability", tags=["Availability"])

STANDARD_TIME_SLOTS = [
    "09:00 AM",
    "10:30 AM",
    "12:00 PM",
    "02:00 PM",
    "04:00 PM",
    "06:00 PM",
]


def _check_provider_slot_conflict(
    db: Session,
    provider_id: int,
    appointment_date: date,
    appointment_time: str,
    exclude_booking_id: Optional[int] = None,
) -> Optional[Booking]:
    query = db.query(Booking).filter(
        Booking.provider_id == provider_id,
        Booking.appointment_date == appointment_date,
        Booking.appointment_time == appointment_time.strip(),
        Booking.status.notin_(["Cancelled", "Rejected"]),
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)
    return query.first()


def _ensure_provider_earning(db: Session, booking: Booking):
    existing = db.query(ProviderEarning).filter(ProviderEarning.booking_id == booking.id).first()
    if not existing:
        gross = round(booking.base_amount - booking.discount_amount, 2)
        comm_pct = booking.provider.commission_rate if booking.provider else 15.0
        earning = ProviderEarning(
            provider_id=booking.provider_id,
            booking_id=booking.id,
            gross_amount=gross,
            commission_percentage=comm_pct,
            commission_amount=booking.commission_amount,
            net_earning=booking.provider_earning_amount,
            payout_status="processed",
            payout_date=datetime.utcnow(),
        )
        db.add(earning)


@availability_router.get("")
def get_provider_availability(
    provider_id: int = Query(...),
    slot_date: Optional[date] = Query(default=None, alias="date"),
    appointment_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    target_date = slot_date or appointment_date or date.today()
    booked_rows = (
        db.query(Booking.appointment_time)
        .filter(
            Booking.provider_id == provider_id,
            Booking.appointment_date == target_date,
            Booking.status.notin_(["Cancelled", "Rejected"]),
        )
        .all()
    )
    booked_times = {r[0] for r in booked_rows}
    slots = [
        {
            "time": t,
            "available": t not in booked_times,
            "is_booked": t in booked_times,
        }
        for t in STANDARD_TIME_SLOTS
    ]
    return {
        "provider_id": provider_id,
        "date": target_date.isoformat(),
        "slots": slots,
    }


@availability_router.get("/check")
def check_availability_get_endpoint(
    provider_id: int = Query(...),
    scheduled_date: Optional[date] = Query(default=None),
    appointment_date: Optional[date] = Query(default=None),
    time_slot: Optional[str] = Query(default=None),
    appointment_time: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    target_date = scheduled_date or appointment_date or date.today()
    target_time = (time_slot or appointment_time or "10:30 AM").strip()
    conflict = _check_provider_slot_conflict(
        db,
        provider_id=provider_id,
        appointment_date=target_date,
        appointment_time=target_time,
    )
    return {
        "available": conflict is None,
        "provider_id": provider_id,
        "appointment_date": target_date.isoformat(),
        "scheduled_date": target_date.isoformat(),
        "appointment_time": target_time,
        "time_slot": target_time,
        "message": "Slot is available for instant confirmation!" if conflict is None else "This slot is already reserved for the selected provider. Please pick another time slot.",
    }


@availability_router.post("/check")
def check_availability_endpoint(
    payload: AvailabilityCheckRequest,
    db: Session = Depends(get_db),
):
    conflict = _check_provider_slot_conflict(
        db,
        provider_id=payload.provider_id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
    )
    return {
        "available": conflict is None,
        "provider_id": payload.provider_id,
        "appointment_date": payload.appointment_date.isoformat(),
        "scheduled_date": payload.appointment_date.isoformat(),
        "appointment_time": payload.appointment_time,
        "time_slot": payload.appointment_time,
        "message": "Slot is available" if conflict is None else "Slot is already booked",
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or inactive")

    # Resolve Customer profile
    customer = current_user.customer_profile
    if not customer:
        customer = Customer(
            user_id=current_user.id,
            loyalty_points=50,
            preferred_language="English",
            emergency_contact=current_user.phone,
        )
        db.add(customer)
        db.flush()

    # Resolve Provider
    provider: Optional[ServiceProvider] = None
    if payload.provider_id:
        provider = db.query(ServiceProvider).filter(ServiceProvider.id == payload.provider_id).first()
    else:
        ps = (
            db.query(ProviderService)
            .join(ServiceProvider, ProviderService.provider_id == ServiceProvider.id)
            .filter(
                ProviderService.service_id == service.id,
                ProviderService.is_active == True,
                ServiceProvider.verification_status == "verified",
            )
            .first()
        )
        if ps:
            provider = ps.provider
        else:
            provider = (
                db.query(ServiceProvider)
                .filter(ServiceProvider.verification_status == "verified")
                .first()
            )
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verified service provider available for this service",
        )

    # Double-booking prevention check!
    conflict = _check_provider_slot_conflict(
        db,
        provider_id=provider.id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Double booking prevented: {provider.business_name} is already booked on {payload.appointment_date} at {payload.appointment_time}.",
        )

    # Resolve Address
    address_id = payload.address_id
    if address_id:
        addr = db.query(Address).filter(Address.id == address_id).first()
        if not addr:
            address_id = None
    if not address_id:
        default_addr = (
            db.query(Address)
            .filter(Address.user_id == current_user.id)
            .order_by(Address.is_default.desc(), Address.id.asc())
            .first()
        )
        if default_addr:
            address_id = default_addr.id
        else:
            new_addr = Address(
                user_id=current_user.id,
                label="Home",
                address_line1=payload.address_line1 or "101, Residency Towers, Main Road",
                city=payload.city or provider.city or "Mumbai",
                state=payload.state or "Maharashtra",
                postal_code=payload.postal_code or "400001",
                country="India",
                is_default=True,
            )
            db.add(new_addr)
            db.flush()
            address_id = new_addr.id

    # Determine base price (provider custom price or service base price)
    ps_row = (
        db.query(ProviderService)
        .filter(
            ProviderService.provider_id == provider.id,
            ProviderService.service_id == service.id,
            ProviderService.is_active == True,
        )
        .first()
    )
    base_amount = float(ps_row.custom_price) if (ps_row and ps_row.custom_price) else float(service.base_price)

    # Validate coupon if provided
    discount_amount, coupon_obj, coupon_err = validate_and_calculate_coupon(
        db, payload.coupon_code, base_amount
    )
    if payload.coupon_code and coupon_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=coupon_err)

    pricing = calculate_booking_pricing(
        base_amount=base_amount,
        discount_amount=discount_amount,
        commission_rate=provider.commission_rate,
    )

    booking_ref = f"HS-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
    booking = Booking(
        booking_reference=booking_ref,
        customer_id=customer.id,
        provider_id=provider.id,
        service_id=service.id,
        address_id=address_id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time.strip(),
        status="Pending",
        problem_description=payload.problem_description or f"Requested {service.name}",
        reference_image_url=payload.reference_image_url,
        base_amount=pricing["base_amount"],
        discount_amount=pricing["discount_amount"],
        tax_amount=pricing["tax_amount"],
        total_amount=pricing["total_amount"],
        commission_amount=pricing["commission_amount"],
        provider_earning_amount=pricing["provider_earning_amount"],
        coupon_code=coupon_obj.code if coupon_obj else None,
    )
    db.add(booking)
    db.flush()

    if payload.reference_image_url:
        db.add(
            BookingImage(
                booking_id=booking.id,
                uploaded_by_user_id=current_user.id,
                image_type="reference",
                image_url=payload.reference_image_url,
                caption="Customer problem reference photo",
            )
        )

    if coupon_obj:
        coupon_obj.used_count = (coupon_obj.used_count or 0) + 1
        db.add(
            CouponUsage(
                coupon_id=coupon_obj.id,
                user_id=current_user.id,
                booking_id=booking.id,
                discount_applied=discount_amount,
            )
        )

    # Record availability slot
    db.add(
        AvailabilitySlot(
            provider_id=provider.id,
            slot_date=payload.appointment_date,
            start_time=payload.appointment_time.strip(),
            end_time=payload.appointment_time.strip(),
            is_booked=True,
        )
    )

    # Record booking status history
    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            old_status=None,
            new_status="Pending",
            changed_by_user_id=current_user.id,
            notes="Booking created by customer",
        )
    )

    # Notify Customer and Provider
    create_notification(
        db,
        user_id=current_user.id,
        title=f"Booking Created ({booking_ref})",
        message=f"Your booking for {service.name} on {payload.appointment_date} at {payload.appointment_time} has been received.",
        notification_type="booking",
        reference_id=booking.id,
    )
    create_notification(
        db,
        user_id=provider.user_id,
        title=f"New Service Request ({booking_ref})",
        message=f"New booking request for {service.name} on {payload.appointment_date} at {payload.appointment_time}.",
        notification_type="booking",
        reference_id=booking.id,
    )

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.get("")
def list_bookings(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if current_user.role == "customer":
        if current_user.customer_profile:
            query = query.filter(Booking.customer_id == current_user.customer_profile.id)
        else:
            return []
    elif current_user.role == "provider":
        if current_user.provider_profile:
            query = query.filter(Booking.provider_id == current_user.provider_profile.id)
        else:
            return []
    elif current_user.role == "technician":
        if current_user.technician_profile:
            assigned_ids = [
                a.booking_id
                for a in db.query(BookingAssignment)
                .filter(BookingAssignment.technician_id == current_user.technician_profile.id)
                .all()
            ]
            query = query.filter(Booking.id.in_(assigned_ids)) if assigned_ids else query.filter(Booking.id == -1)
        else:
            return []

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Booking.status == status_filter)

    bookings = query.order_by(Booking.created_at.desc()).all()
    results = [serialize_booking(b) for b in bookings]

    if search:
        q = search.strip().lower()
        results = [
            b
            for b in results
            if q in (b.get("booking_reference") or "").lower()
            or q in ((b.get("service") or {}).get("name") or "").lower()
            or q in ((b.get("customer") or {}).get("full_name") or "").lower()
            or q in ((b.get("provider") or {}).get("business_name") or "").lower()
        ]
    return results


@router.get("/{booking_id}")
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return serialize_booking(booking)


@router.patch("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    valid_statuses = {
        "Pending",
        "Confirmed",
        "Provider Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
        "Rejected",
    }
    new_status = payload.status.strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid booking status '{new_status}'",
        )

    old_status = booking.status
    booking.status = new_status
    if new_status in ("Cancelled", "Rejected") and payload.cancellation_reason:
        booking.cancellation_reason = payload.cancellation_reason
        booking.cancelled_by_role = current_user.role

    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            old_status=old_status,
            new_status=new_status,
            changed_by_user_id=current_user.id,
            notes=payload.notes or f"Status updated from {old_status} to {new_status} by {current_user.role}",
        )
    )

    if new_status == "Completed":
        if booking.provider:
            booking.provider.total_completed_jobs = (booking.provider.total_completed_jobs or 0) + 1
        if booking.assignment and booking.assignment.technician:
            booking.assignment.assignment_status = "Completed"
            booking.assignment.completion_time = datetime.utcnow()
            booking.assignment.technician.total_jobs_completed = (
                booking.assignment.technician.total_jobs_completed or 0
            ) + 1
        _ensure_provider_earning(db, booking)

    # Notify customer
    if booking.customer and booking.customer.user_id:
        create_notification(
            db,
            user_id=booking.customer.user_id,
            title=f"Booking {booking.booking_reference}: {new_status}",
            message=f"Your booking for {booking.service.name if booking.service else 'service'} is now '{new_status}'.",
            notification_type="booking",
            reference_id=booking.id,
        )

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    payload: Optional[BookingCancelRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed bookings cannot be cancelled",
        )

    reason = (
        (payload.cancellation_reason or payload.reason)
        if payload
        else "Cancelled by user"
    ) or "Cancelled by user"
    old_status = booking.status
    booking.status = "Cancelled"
    booking.cancellation_reason = reason
    booking.cancelled_by_role = current_user.role

    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            old_status=old_status,
            new_status="Cancelled",
            changed_by_user_id=current_user.id,
            notes=f"Booking cancelled: {reason}",
        )
    )

    if booking.customer and booking.customer.user_id:
        create_notification(
            db,
            user_id=booking.customer.user_id,
            title=f"Booking Cancelled ({booking.booking_reference})",
            message=f"Booking has been cancelled. Reason: {reason}",
            notification_type="booking",
            reference_id=booking.id,
        )
    if booking.provider and booking.provider.user_id:
        create_notification(
            db,
            user_id=booking.provider.user_id,
            title=f"Booking Cancelled ({booking.booking_reference})",
            message=f"Booking was cancelled by {current_user.role}. Reason: {reason}",
            notification_type="booking",
            reference_id=booking.id,
        )

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.post("/{booking_id}/reschedule")
def reschedule_booking(
    booking_id: int,
    payload: BookingRescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status in ("Completed", "Cancelled", "Rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reschedule a booking with status '{booking.status}'",
        )

    conflict = _check_provider_slot_conflict(
        db,
        provider_id=booking.provider_id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        exclude_booking_id=booking.id,
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected reschedule slot is already booked for this provider",
        )

    old_slot = f"{booking.appointment_date} {booking.appointment_time}"
    booking.appointment_date = payload.appointment_date
    booking.appointment_time = payload.appointment_time.strip()

    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            old_status=booking.status,
            new_status=booking.status,
            changed_by_user_id=current_user.id,
            notes=payload.notes or f"Rescheduled from {old_slot} to {booking.appointment_date} {booking.appointment_time}",
        )
    )
    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.get("/{booking_id}/history")
def get_booking_history(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(BookingStatusHistory)
        .filter(BookingStatusHistory.booking_id == booking_id)
        .order_by(BookingStatusHistory.created_at.asc())
        .all()
    )
    return [
        {
            "id": h.id,
            "booking_id": h.booking_id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "changed_by_user_id": h.changed_by_user_id,
            "changed_by_name": h.changed_by.full_name if h.changed_by else "System",
            "notes": h.notes,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in history
    ]


@router.post("/{booking_id}/images", status_code=status.HTTP_201_CREATED)
async def add_booking_image(
    booking_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    content_type = request.headers.get("content-type", "")
    image_url = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"
    image_type = "reference"
    caption = "Uploaded service image"

    if "application/json" in content_type:
        body = await request.json()
        if body.get("before_image_url") or body.get("after_image_url") or body.get("completion_remarks"):
            if body.get("before_image_url"):
                db.add(
                    BookingImage(
                        booking_id=booking.id,
                        uploaded_by_user_id=current_user.id,
                        image_type="before",
                        image_url=body["before_image_url"],
                        caption="Before service photo",
                    )
                )
            if body.get("after_image_url"):
                db.add(
                    BookingImage(
                        booking_id=booking.id,
                        uploaded_by_user_id=current_user.id,
                        image_type="after",
                        image_url=body["after_image_url"],
                        caption="After service completion photo",
                    )
                )
            if body.get("completion_remarks") and booking.assignment:
                booking.assignment.completion_remarks = body["completion_remarks"]
            db.commit()
            db.refresh(booking)
            return serialize_booking(booking)
        image_url = body.get("image_url") or image_url
        image_type = body.get("image_type") or "reference"
        caption = body.get("caption") or caption
    else:
        form = await request.form()
        image_type = str(form.get("image_type") or "reference")
        caption = str(form.get("caption") or caption)
        if form.get("image_url"):
            image_url = str(form.get("image_url"))

    img = BookingImage(
        booking_id=booking.id,
        uploaded_by_user_id=current_user.id,
        image_type=image_type,
        image_url=image_url,
        caption=caption,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {
        "id": img.id,
        "booking_id": img.booking_id,
        "uploaded_by_user_id": img.uploaded_by_user_id,
        "image_type": img.image_type,
        "image_url": img.image_url,
        "caption": img.caption,
        "created_at": img.created_at.isoformat() if img.created_at else None,
    }
