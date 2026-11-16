import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.database.session import get_db
from app.models.provider import ProviderWorkingHour, ServiceArea, ServiceProvider
from app.models.user import Address, Customer, PasswordResetToken, RefreshToken, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _issue_tokens(db: Session, user: User, request: Optional[Request] = None):
    access_token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    refresh_token, token_hash, expires_at = create_refresh_token({"sub": str(user.id), "role": user.role})

    db_refresh = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_revoked=False,
        user_agent=request.headers.get("user-agent", "HomeServe-Client")[:250] if request else "HomeServe-Client",
        ip_address=request.client.host if (request and request.client) else "127.0.0.1",
    )
    db.add(db_refresh)
    db.commit()
    db.refresh(user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    email_lower = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email_lower).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    role = payload.role.lower().strip() if payload.role else "customer"
    if role not in ("customer", "provider", "technician", "admin"):
        role = "customer"

    user = User(
        full_name=payload.full_name.strip(),
        email=email_lower,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=role,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={payload.full_name.strip().replace(' ', '+')}",
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()

    if role == "provider":
        bname = payload.business_name or f"{payload.full_name}'s Home Services"
        provider = ServiceProvider(
            user_id=user.id,
            business_name=bname,
            business_description=payload.business_description or f"Professional {payload.category_specialization or 'Home Maintenance'} services by {bname}.",
            category_specialization=payload.category_specialization or "Electrical Services",
            city=payload.city or "Mumbai",
            experience_years=payload.experience_years or 3,
            verification_status="pending",
            id_document_url=payload.id_document_url or "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
            license_number=payload.license_number or f"HS-LIC-{10000 + user.id}",
            avg_rating=4.8,
            total_reviews=0,
            total_completed_jobs=0,
            commission_rate=15.0,
            is_available=True,
        )
        db.add(provider)
        db.flush()

        # Default service area & working hours
        db.add(
            ServiceArea(
                provider_id=provider.id,
                city=provider.city,
                state="Maharashtra",
                postal_code="400001",
                service_radius_km=20.0,
                is_active=True,
            )
        )
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            db.add(
                ProviderWorkingHour(
                    provider_id=provider.id,
                    day_of_week=day,
                    start_time="08:00",
                    end_time="20:00",
                    is_closed=(day == "Sunday"),
                )
            )
        create_notification(
            db,
            user_id=user.id,
            title="Welcome to HomeServe Partner Network",
            message="Your provider profile has been submitted for verification.",
            notification_type="system",
            reference_id=provider.id,
        )
    else:
        customer = Customer(
            user_id=user.id,
            loyalty_points=100,
            preferred_language="English",
            emergency_contact=payload.phone,
        )
        db.add(customer)
        db.flush()
        db.add(
            Address(
                user_id=user.id,
                label="Home",
                address_line1="101, Palm Grove Residency, Linking Road",
                address_line2="Bandra West",
                city=payload.city or "Mumbai",
                state="Maharashtra",
                postal_code="400050",
                country="India",
                latitude=19.0596,
                longitude=72.8295,
                is_default=True,
            )
        )
        create_notification(
            db,
            user_id=user.id,
            title="Welcome to HomeServe!",
            message="Enjoy 100 bonus loyalty points and use code WELCOME20 for 20% off your first booking.",
            notification_type="promotion",
        )

    return _issue_tokens(db, user, request)


@router.post("/register/provider", status_code=status.HTTP_201_CREATED)
def register_provider_alias(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    payload.role = "provider"
    return register(payload, request, db)


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    email_lower = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )
    return _issue_tokens(db, user, request)


@router.post("/refresh")
def refresh_token_endpoint(
    payload: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token type")
        user_id = int(decoded.get("sub"))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    t_hash = hash_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == t_hash).first()
    if stored:
        if stored.is_revoked or stored.expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or expired")
        stored.is_revoked = True

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return _issue_tokens(db, user, request)


@router.post("/logout")
def logout(
    payload: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload and payload.refresh_token:
        t_hash = hash_token(payload.refresh_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == t_hash).first()
        if stored:
            stored.is_revoked = True
    else:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.is_revoked == False,
        ).update({"is_revoked": True})
    db.commit()
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_lower = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    raw_token = f"rst_{secrets.token_urlsafe(24)}"
    if user:
        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(hours=1),
            is_used=False,
        )
        db.add(reset_record)
        db.commit()
    return {
        "message": "If an account exists with this email, a password reset link has been generated.",
        "reset_token": raw_token,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    t_hash = hash_token(payload.token)
    record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == t_hash,
            PasswordResetToken.is_used == False,
        )
        .first()
    )
    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    record.is_used = True
    db.commit()
    return {"message": "Password has been reset successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)
