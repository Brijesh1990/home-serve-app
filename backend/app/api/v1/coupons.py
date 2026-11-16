from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.payment import Coupon
from app.models.user import User
from app.schemas.domain import CouponCreateRequest, CouponValidateRequest
from app.services.pricing_service import (
    calculate_booking_pricing,
    validate_and_calculate_coupon,
)
from app.utils.serializers import serialize_coupon

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("")
def list_coupons(db: Session = Depends(get_db)):
    coupons = db.query(Coupon).order_by(Coupon.id.asc()).all()
    return [serialize_coupon(c) for c in coupons]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_coupon(
    payload: CouponCreateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    code = payload.code.strip().upper()
    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code already exists")

    coupon = Coupon(
        code=code,
        title=payload.title,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_order_amount=payload.min_order_amount,
        max_discount_amount=payload.max_discount_amount,
        usage_limit=payload.usage_limit,
        used_count=0,
        valid_from=payload.valid_from or datetime.utcnow(),
        valid_until=payload.valid_until or (datetime.utcnow() + timedelta(days=90)),
        is_active=payload.is_active,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return serialize_coupon(coupon)


@router.put("/{coupon_id}")
def update_coupon(
    coupon_id: int,
    payload: CouponCreateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    coupon.code = payload.code.strip().upper()
    coupon.title = payload.title
    coupon.description = payload.description
    coupon.discount_type = payload.discount_type
    coupon.discount_value = payload.discount_value
    coupon.min_order_amount = payload.min_order_amount
    coupon.max_discount_amount = payload.max_discount_amount
    coupon.usage_limit = payload.usage_limit
    coupon.is_active = payload.is_active
    db.commit()
    db.refresh(coupon)
    return serialize_coupon(coupon)


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted successfully"}


@router.post("/validate")
def validate_coupon_endpoint(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
):
    discount_amount, coupon_obj, error_msg = validate_and_calculate_coupon(
        db, payload.code, payload.order_amount
    )
    if error_msg or not coupon_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid coupon code",
        )
    pricing = calculate_booking_pricing(
        base_amount=payload.order_amount,
        discount_amount=discount_amount,
    )
    return {
        "valid": True,
        "code": coupon_obj.code,
        "discount_amount": discount_amount,
        "tax_amount": pricing["tax_amount"],
        "final_amount": pricing["total_amount"],
        "coupon": serialize_coupon(coupon_obj),
    }
