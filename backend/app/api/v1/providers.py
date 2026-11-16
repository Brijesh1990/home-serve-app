from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import register as auth_register
from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.feedback import Review
from app.models.provider import (
    ProviderEarning,
    ProviderService,
    ProviderWorkingHour,
    ServiceArea,
    ServiceProvider,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.schemas.domain import (
    ProviderRejectRequest,
    ProviderServiceAddRequest,
    ProviderUpdateRequest,
    ServiceAreaCreateRequest,
    WorkingHoursUpdateRequest,
)
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_provider, serialize_review

router = APIRouter(prefix="/providers", tags=["Service Providers"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_provider(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    payload.role = "provider"
    return auth_register(payload, request, db)


@router.get("")
def list_providers(
    category_id: Optional[int] = Query(default=None),
    service_id: Optional[int] = Query(default=None),
    city: Optional[str] = Query(default=None),
    verification_status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(ServiceProvider)
    if verification_status:
        query = query.filter(ServiceProvider.verification_status == verification_status)
    if city:
        query = query.filter(ServiceProvider.city.ilike(f"%{city.strip()}%"))
    if min_rating is not None:
        query = query.filter(ServiceProvider.avg_rating >= min_rating)
    if search:
        like_q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ServiceProvider.business_name.ilike(like_q),
                ServiceProvider.category_specialization.ilike(like_q),
                ServiceProvider.city.ilike(like_q),
            )
        )
    providers = query.order_by(ServiceProvider.avg_rating.desc()).all()

    if service_id is not None:
        filtered = []
        for p in providers:
            if any(ps.service_id == service_id and ps.is_active for ps in (p.provider_services or [])):
                filtered.append(p)
        # If no specific mapping found, return verified providers so booking UI always has choices
        providers = filtered if filtered else [p for p in providers if p.verification_status == "verified"]

    if category_id is not None:
        filtered_cat = []
        for p in providers:
            if any(
                ps.service and ps.service.category_id == category_id
                for ps in (p.provider_services or [])
            ):
                filtered_cat.append(p)
        if filtered_cat:
            providers = filtered_cat

    return [serialize_provider(p) for p in providers]


@router.get("/{provider_id}")
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        provider = db.query(ServiceProvider).filter(ServiceProvider.user_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider not found")
    return serialize_provider(provider)


@router.put("/{provider_id}")
def update_provider(
    provider_id: int,
    payload: ProviderUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        provider = db.query(ServiceProvider).filter(ServiceProvider.user_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider not found")

    if current_user.role != "admin" and provider.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify another provider")

    for field in [
        "business_name",
        "business_description",
        "category_specialization",
        "city",
        "experience_years",
        "license_number",
        "id_document_url",
        "is_available",
    ]:
        val = getattr(payload, field)
        if val is not None:
            setattr(provider, field, val)

    db.commit()
    db.refresh(provider)
    return serialize_provider(provider)


@router.patch("/{provider_id}/verify")
def verify_provider(
    provider_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider not found")

    provider.verification_status = "verified"
    provider.rejection_reason = None
    create_notification(
        db,
        user_id=provider.user_id,
        title="Provider Account Verified!",
        message=f"Congratulations! {provider.business_name} has been verified and is now live for customer bookings.",
        notification_type="verification",
        reference_id=provider.id,
    )
    db.commit()
    db.refresh(provider)
    return serialize_provider(provider)


@router.patch("/{provider_id}/reject")
def reject_provider(
    provider_id: int,
    payload: ProviderRejectRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider not found")

    provider.verification_status = "rejected"
    provider.rejection_reason = payload.rejection_reason
    create_notification(
        db,
        user_id=provider.user_id,
        title="Provider Verification Update",
        message=f"Your verification was declined. Reason: {payload.rejection_reason}",
        notification_type="verification",
        reference_id=provider.id,
    )
    db.commit()
    db.refresh(provider)
    return serialize_provider(provider)


@router.get("/{provider_id}/reviews")
def list_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.provider_id == provider_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [serialize_review(r) for r in reviews]


@router.get("/{provider_id}/services")
def list_provider_services(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    return serialize_provider(provider).get("services", [])


@router.post("/{provider_id}/services", status_code=status.HTTP_201_CREATED)
def add_provider_service(
    provider_id: int,
    payload: ProviderServiceAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(ProviderService)
        .filter(
            ProviderService.provider_id == provider_id,
            ProviderService.service_id == payload.service_id,
        )
        .first()
    )
    if existing:
        existing.custom_price = payload.custom_price
        existing.custom_duration_minutes = payload.custom_duration_minutes
        existing.is_active = True
        db.commit()
        db.refresh(existing)
    else:
        ps = ProviderService(
            provider_id=provider_id,
            service_id=payload.service_id,
            custom_price=payload.custom_price,
            custom_duration_minutes=payload.custom_duration_minutes,
            is_active=True,
        )
        db.add(ps)
        db.commit()
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    return serialize_provider(provider).get("services", [])


@router.delete("/{provider_id}/services/{service_id}")
def remove_provider_service(
    provider_id: int,
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ps = (
        db.query(ProviderService)
        .filter(
            ProviderService.provider_id == provider_id,
            or_(ProviderService.service_id == service_id, ProviderService.id == service_id),
        )
        .first()
    )
    if ps:
        db.delete(ps)
        db.commit()
    return {"message": "Service removed from provider catalog"}


@router.get("/{provider_id}/areas")
def list_provider_areas(provider_id: int, db: Session = Depends(get_db)):
    areas = db.query(ServiceArea).filter(ServiceArea.provider_id == provider_id).all()
    return [
        {
            "id": a.id,
            "provider_id": a.provider_id,
            "city": a.city,
            "state": a.state,
            "postal_code": a.postal_code,
            "service_radius_km": a.service_radius_km,
            "is_active": a.is_active,
        }
        for a in areas
    ]


@router.post("/{provider_id}/areas", status_code=status.HTTP_201_CREATED)
def add_provider_area(
    provider_id: int,
    payload: ServiceAreaCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    area = ServiceArea(
        provider_id=provider_id,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        service_radius_km=payload.service_radius_km,
        is_active=True,
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return {
        "id": area.id,
        "provider_id": area.provider_id,
        "city": area.city,
        "state": area.state,
        "postal_code": area.postal_code,
        "service_radius_km": area.service_radius_km,
        "is_active": area.is_active,
    }


@router.delete("/{provider_id}/areas/{area_id}")
def delete_provider_area(
    provider_id: int,
    area_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    area = (
        db.query(ServiceArea)
        .filter(ServiceArea.id == area_id, ServiceArea.provider_id == provider_id)
        .first()
    )
    if area:
        db.delete(area)
        db.commit()
    return {"message": "Service area removed"}


@router.get("/{provider_id}/working-hours")
def get_working_hours(provider_id: int, db: Session = Depends(get_db)):
    hours = db.query(ProviderWorkingHour).filter(ProviderWorkingHour.provider_id == provider_id).all()
    return [
        {
            "id": h.id,
            "day_of_week": h.day_of_week,
            "start_time": h.start_time,
            "end_time": h.end_time,
            "is_closed": h.is_closed,
        }
        for h in hours
    ]


@router.put("/{provider_id}/working-hours")
def update_working_hours(
    provider_id: int,
    payload: WorkingHoursUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(ProviderWorkingHour).filter(ProviderWorkingHour.provider_id == provider_id).delete()
    for item in payload.working_hours:
        db.add(
            ProviderWorkingHour(
                provider_id=provider_id,
                day_of_week=item.day_of_week,
                start_time=item.start_time,
                end_time=item.end_time,
                is_closed=item.is_closed,
            )
        )
    db.commit()
    return get_working_hours(provider_id, db)


@router.get("/{provider_id}/earnings")
def get_provider_earnings(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    earnings = (
        db.query(ProviderEarning)
        .filter(ProviderEarning.provider_id == provider_id)
        .order_by(ProviderEarning.created_at.desc())
        .all()
    )
    items = [
        {
            "id": e.id,
            "provider_id": e.provider_id,
            "booking_id": e.booking_id,
            "booking_reference": e.booking.booking_reference if e.booking else f"HS-BK-{e.booking_id}",
            "service_name": e.booking.service.name if (e.booking and e.booking.service) else "Home Service",
            "gross_amount": e.gross_amount,
            "commission_percentage": e.commission_percentage,
            "commission_amount": e.commission_amount,
            "net_earning": e.net_earning,
            "payout_status": e.payout_status,
            "payout_date": e.payout_date.isoformat() if e.payout_date else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in earnings
    ]
    total_gross = round(sum(x["gross_amount"] for x in items), 2)
    total_comm = round(sum(x["commission_amount"] for x in items), 2)
    total_net = round(sum(x["net_earning"] for x in items), 2)
    return {
        "summary": {
            "total_gross": total_gross,
            "gross_earnings": total_gross,
            "total_commission": total_comm,
            "commission_deducted": total_comm,
            "total_net_earning": total_net,
            "net_payout": total_net,
            "commission_rate": 15,
            "transactions_count": len(items),
        },
        "earnings": items,
        "ledger": items,
    }
