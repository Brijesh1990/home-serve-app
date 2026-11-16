import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.provider import ServiceProvider, Subscription
from app.models.user import User
from app.schemas.domain import SubscriptionCreateRequest

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

SUBSCRIPTION_PLANS = [
    {
        "tier": "Starter",
        "name": "HomeServe Starter Partner",
        "monthly_price": 999.0,
        "annual_price": 9990.0,
        "commission_rate": 15.0,
        "max_services": 10,
        "max_technicians": 5,
        "features": [
            "Up to 10 listed services",
            "Up to 5 field technicians",
            "Standard search placement",
            "15% platform commission",
        ],
    },
    {
        "tier": "Professional",
        "name": "HomeServe Pro Growth",
        "monthly_price": 2499.0,
        "annual_price": 24990.0,
        "commission_rate": 12.0,
        "max_services": 30,
        "max_technicians": 20,
        "features": [
            "Up to 30 listed services",
            "Up to 20 field technicians",
            "Priority Verified Partner badge",
            "Reduced 12% platform commission",
            "Real-time revenue & SLA analytics",
        ],
    },
    {
        "tier": "Enterprise",
        "name": "HomeServe Enterprise Fleet",
        "monthly_price": 5999.0,
        "annual_price": 59990.0,
        "commission_rate": 8.0,
        "max_services": 100,
        "max_technicians": 100,
        "features": [
            "Unlimited city service areas",
            "Up to 100 field technicians",
            "Lowest 8% platform commission",
            "Dedicated account manager & API webhooks",
        ],
    },
]


def _serialize_sub(s: Subscription):
    return {
        "id": s.id,
        "provider_id": s.provider_id,
        "provider_name": s.provider.business_name if s.provider else None,
        "plan_name": s.plan_name,
        "plan_tier": s.plan_tier,
        "price": s.price,
        "billing_cycle": s.billing_cycle,
        "commission_rate": s.commission_rate,
        "max_services": s.max_services,
        "max_technicians": s.max_technicians,
        "status": s.status,
        "start_date": s.start_date.isoformat() if s.start_date else None,
        "end_date": s.end_date.isoformat() if s.end_date else None,
        "razorpay_subscription_id": s.razorpay_subscription_id,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("/plans")
def get_subscription_plans():
    return SUBSCRIPTION_PLANS


@router.get("/current")
def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = current_user.provider_profile
    if not provider:
        provider = db.query(ServiceProvider).first()
    if not provider:
        return None
    sub = (
        db.query(Subscription)
        .filter(Subscription.provider_id == provider.id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc())
        .first()
    )
    return _serialize_sub(sub) if sub else None


@router.get("")
def list_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Subscription)
    if current_user.role == "provider" and current_user.provider_profile:
        query = query.filter(Subscription.provider_id == current_user.provider_profile.id)
    subs = query.order_by(Subscription.created_at.desc()).all()
    return [_serialize_sub(s) for s in subs]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider_id = payload.provider_id
    if not provider_id and current_user.provider_profile:
        provider_id = current_user.provider_profile.id
    if not provider_id:
        first_p = db.query(ServiceProvider).first()
        provider_id = first_p.id if first_p else None
    if not provider_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provider not found")

    plan = next((p for p in SUBSCRIPTION_PLANS if p["tier"].lower() == payload.plan_tier.lower()), SUBSCRIPTION_PLANS[1])
    price = plan["annual_price"] if payload.billing_cycle == "annual" else plan["monthly_price"]
    days = 365 if payload.billing_cycle == "annual" else 30

    db.query(Subscription).filter(
        Subscription.provider_id == provider_id,
        Subscription.status == "active",
    ).update({"status": "expired"})

    sub = Subscription(
        provider_id=provider_id,
        plan_name=plan["name"],
        plan_tier=plan["tier"],
        price=price,
        billing_cycle=payload.billing_cycle,
        commission_rate=plan["commission_rate"],
        max_services=plan["max_services"],
        max_technicians=plan["max_technicians"],
        status="active",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=days),
        razorpay_subscription_id=f"sub_HS_{secrets.token_hex(6)}",
    )
    db.add(sub)

    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if provider:
        provider.commission_rate = plan["commission_rate"]

    db.commit()
    db.refresh(sub)
    return _serialize_sub(sub)
