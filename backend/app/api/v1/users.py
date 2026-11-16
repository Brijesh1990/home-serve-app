from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.domain import ProfileUpdateRequest, UserStatusUpdate
from app.utils.serializers import serialize_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def list_users(
    role: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        like_q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(like_q),
                User.email.ilike(like_q),
                User.phone.ilike(like_q),
            )
        )
    users = query.order_by(User.created_at.desc()).all()
    return [serialize_user(u) for u in users]


@router.put("/profile")
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip()

    if current_user.customer_profile:
        if payload.preferred_language is not None:
            current_user.customer_profile.preferred_language = payload.preferred_language
        if payload.emergency_contact is not None:
            current_user.customer_profile.emergency_contact = payload.emergency_contact

    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return serialize_user(user)
