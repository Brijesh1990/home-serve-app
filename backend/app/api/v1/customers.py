from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.booking import Booking
from app.models.provider import ServiceProvider
from app.models.user import Address, Customer, FavoriteProvider, User
from app.schemas.domain import AddressCreateRequest, ProfileUpdateRequest
from app.utils.serializers import (
    serialize_address,
    serialize_booking,
    serialize_provider,
    serialize_user,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


def _ensure_customer_profile(db: Session, user: User) -> Customer:
    if user.customer_profile:
        return user.customer_profile
    cust = Customer(user_id=user.id, loyalty_points=50, preferred_language="English", emergency_contact=user.phone)
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


@router.get("")
def list_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    results = []
    for c in customers:
        u_data = serialize_user(c.user) if c.user else {}
        u_data.update(
            {
                "customer_id": c.id,
                "loyalty_points": c.loyalty_points,
                "preferred_language": c.preferred_language,
                "emergency_contact": c.emergency_contact,
                "total_bookings": len(c.bookings or []),
            }
        )
        results.append(u_data)
    return results


@router.get("/me/addresses")
def list_my_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addrs = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return [serialize_address(a) for a in addrs]


@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
def create_my_address(
    payload: AddressCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    addr = Address(
        user_id=current_user.id,
        label=payload.label,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_default=payload.is_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return serialize_address(addr)


@router.put("/me/addresses/{addr_id}")
def update_my_address(
    addr_id: int,
    payload: AddressCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addr = db.query(Address).filter(Address.id == addr_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    addr.label = payload.label
    addr.address_line1 = payload.address_line1
    addr.address_line2 = payload.address_line2
    addr.city = payload.city
    addr.state = payload.state
    addr.postal_code = payload.postal_code
    addr.country = payload.country
    addr.is_default = payload.is_default
    db.commit()
    db.refresh(addr)
    return serialize_address(addr)


@router.delete("/me/addresses/{addr_id}")
def delete_my_address(
    addr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addr = db.query(Address).filter(Address.id == addr_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.get("/me/favorites")
def list_my_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = _ensure_customer_profile(db, current_user)
    favs = db.query(FavoriteProvider).filter(FavoriteProvider.customer_id == customer.id).all()
    return [serialize_provider(f.provider) for f in favs if f.provider]


@router.post("/me/favorites/{provider_id}", status_code=status.HTTP_201_CREATED)
def add_favorite_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = _ensure_customer_profile(db, current_user)
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    existing = (
        db.query(FavoriteProvider)
        .filter(
            FavoriteProvider.customer_id == customer.id,
            FavoriteProvider.provider_id == provider_id,
        )
        .first()
    )
    if not existing:
        fav = FavoriteProvider(customer_id=customer.id, provider_id=provider_id)
        db.add(fav)
        db.commit()
    return {"message": "Added to favorites", "provider_id": provider_id}


@router.delete("/me/favorites/{provider_id}")
def remove_favorite_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = _ensure_customer_profile(db, current_user)
    existing = (
        db.query(FavoriteProvider)
        .filter(
            FavoriteProvider.customer_id == customer.id,
            FavoriteProvider.provider_id == provider_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
    return {"message": "Removed from favorites", "provider_id": provider_id}


@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        customer = db.query(Customer).filter(Customer.user_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    data = serialize_user(customer.user)
    data.update(
        {
            "customer_id": customer.id,
            "loyalty_points": customer.loyalty_points,
            "preferred_language": customer.preferred_language,
            "emergency_contact": customer.emergency_contact,
            "addresses": [serialize_address(a) for a in (customer.user.addresses or [])],
        }
    )
    return data


@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        customer = db.query(Customer).filter(Customer.user_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if payload.full_name and customer.user:
        customer.user.full_name = payload.full_name
    if payload.phone and customer.user:
        customer.user.phone = payload.phone
    if payload.preferred_language:
        customer.preferred_language = payload.preferred_language
    if payload.emergency_contact:
        customer.emergency_contact = payload.emergency_contact
    db.commit()
    db.refresh(customer)
    return get_customer(customer.id, current_user, db)


@router.get("/{customer_id}/bookings")
def get_customer_bookings(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        customer = db.query(Customer).filter(Customer.user_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    bookings = (
        db.query(Booking)
        .filter(Booking.customer_id == customer.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [serialize_booking(b) for b in bookings]
