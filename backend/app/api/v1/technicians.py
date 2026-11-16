from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.security import hash_password
from app.database.session import get_db
from app.models.booking import Booking, BookingAssignment
from app.models.provider import ServiceProvider, Technician
from app.models.user import User
from app.schemas.domain import TechnicianCreateRequest, TechnicianUpdateRequest
from app.utils.serializers import serialize_booking, serialize_technician

router = APIRouter(prefix="/technicians", tags=["Technicians"])


@router.get("")
def list_technicians(
    provider_id: Optional[int] = Query(default=None),
    availability_status: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Technician)
    if provider_id is not None:
        query = query.filter(Technician.provider_id == provider_id)
    elif current_user.role == "provider" and current_user.provider_profile:
        query = query.filter(Technician.provider_id == current_user.provider_profile.id)

    if availability_status:
        query = query.filter(Technician.availability_status == availability_status)

    techs = query.order_by(Technician.id.asc()).all()
    return [serialize_technician(t) for t in techs]


@router.get("/my-jobs")
def get_my_technician_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(BookingAssignment)
    if current_user.role == "technician" and current_user.technician_profile:
        query = query.filter(BookingAssignment.technician_id == current_user.technician_profile.id)
    elif current_user.role == "provider" and current_user.provider_profile:
        tech_ids = [t.id for t in (current_user.provider_profile.technicians or [])]
        query = query.filter(BookingAssignment.technician_id.in_(tech_ids)) if tech_ids else query.filter(BookingAssignment.id == -1)

    assignments = query.order_by(BookingAssignment.created_at.desc()).all()
    results = []
    for a in assignments:
        if a.booking:
            b_data = serialize_booking(a.booking)
            b_data["assignment_id"] = a.id
            b_data["assignment_status"] = a.assignment_status
            results.append(b_data)
    return results


@router.post("", status_code=status.HTTP_201_CREATED)
def create_technician(
    payload: TechnicianCreateRequest,
    current_user: User = Depends(require_roles("admin", "provider")),
    db: Session = Depends(get_db),
):
    email_lower = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_lower).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    provider_id = payload.provider_id
    if not provider_id and current_user.provider_profile:
        provider_id = current_user.provider_profile.id
    if not provider_id:
        first_prov = db.query(ServiceProvider).first()
        provider_id = first_prov.id if first_prov else None
    if not provider_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provider ID is required")

    user = User(
        full_name=payload.full_name.strip(),
        email=email_lower,
        phone=payload.phone,
        password_hash=hash_password(payload.password or "Password@123"),
        role="technician",
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={payload.full_name.strip().replace(' ', '+')}",
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()

    tech = Technician(
        user_id=user.id,
        provider_id=provider_id,
        specialization=payload.specialization,
        experience_years=payload.experience_years,
        id_proof_url=payload.id_proof_url or "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        availability_status=payload.availability_status or "available",
        avg_rating=4.9,
        total_jobs_completed=0,
        is_active=True,
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return serialize_technician(tech)


@router.put("/{tech_id}")
def update_technician(
    tech_id: int,
    payload: TechnicianUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")

    if payload.full_name and tech.user:
        tech.user.full_name = payload.full_name.strip()
    if payload.phone and tech.user:
        tech.user.phone = payload.phone.strip()
    if payload.specialization is not None:
        tech.specialization = payload.specialization
    if payload.experience_years is not None:
        tech.experience_years = payload.experience_years
    if payload.availability_status is not None:
        tech.availability_status = payload.availability_status
    if payload.is_active is not None:
        tech.is_active = payload.is_active

    db.commit()
    db.refresh(tech)
    return serialize_technician(tech)


@router.delete("/{tech_id}")
def delete_technician(
    tech_id: int,
    current_user: User = Depends(require_roles("admin", "provider")),
    db: Session = Depends(get_db),
):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    db.delete(tech)
    db.commit()
    return {"message": "Technician deleted successfully"}
