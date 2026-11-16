from datetime import datetime
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.payment import Coupon


def validate_and_calculate_coupon(
    db: Session,
    code: Optional[str],
    base_amount: float,
) -> Tuple[float, Optional[Coupon], Optional[str]]:
    """Return (discount_amount, coupon_obj, error_message)."""
    if not code or not code.strip():
        return 0.0, None, None

    normalized = code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == normalized, Coupon.is_active == True).first()
    if not coupon:
        return 0.0, None, f"Invalid or inactive coupon code '{normalized}'"

    now = datetime.utcnow()
    if coupon.valid_until and coupon.valid_until < now:
        return 0.0, None, f"Coupon '{normalized}' has expired"

    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        return 0.0, None, f"Coupon '{normalized}' usage limit reached"

    if base_amount < (coupon.min_order_amount or 0.0):
        return (
            0.0,
            None,
            f"Minimum order amount of ₹{coupon.min_order_amount:.0f} required for coupon '{normalized}'",
        )

    if coupon.discount_type == "percentage":
        discount = round((base_amount * coupon.discount_value) / 100.0, 2)
        if coupon.max_discount_amount:
            discount = min(discount, float(coupon.max_discount_amount))
    else:
        discount = float(coupon.discount_value)

    discount = min(discount, base_amount)
    return round(discount, 2), coupon, None


def calculate_booking_pricing(
    base_amount: float,
    discount_amount: float = 0.0,
    commission_rate: Optional[float] = None,
) -> Dict[str, float]:
    """Calculate tax (18% GST), total_amount, platform commission (15%), and provider net earning."""
    taxable_amount = max(0.0, round(base_amount - discount_amount, 2))
    tax_amount = round(taxable_amount * (settings.TAX_PERCENT / 100.0), 2)
    total_amount = round(taxable_amount + tax_amount, 2)

    comm_pct = commission_rate if commission_rate is not None else settings.PLATFORM_COMMISSION_PERCENT
    commission_amount = round(taxable_amount * (comm_pct / 100.0), 2)
    provider_earning_amount = round(taxable_amount - commission_amount, 2)

    return {
        "base_amount": round(base_amount, 2),
        "discount_amount": round(discount_amount, 2),
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "commission_amount": commission_amount,
        "provider_earning_amount": provider_earning_amount,
    }
