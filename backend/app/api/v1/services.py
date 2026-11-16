import json
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.catalog import Service, ServiceCategory
from app.models.user import User
from app.schemas.domain import ServiceCreateRequest
from app.utils.serializers import serialize_service

router = APIRouter(prefix="/services", tags=["Services"])


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _to_json_str(val) -> Optional[str]:
    if val is None:
        return json.dumps(["Inspection & diagnosis", "Certified technician visit", "30-day service warranty"])
    if isinstance(val, list):
        return json.dumps(val)
    if isinstance(val, str):
        try:
            json.loads(val)
            return val
        except Exception:
            return json.dumps([s.strip() for s in val.split(",") if s.strip()])
    return json.dumps([str(val)])


@router.get("")
def list_services(
    category_id: Optional[int] = Query(default=None),
    category_slug: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    city: Optional[str] = Query(default=None),
    is_featured: Optional[bool] = Query(default=None),
    include_inactive: bool = Query(default=False),
    sort_by: Optional[str] = Query(default="featured"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Service)
    if not include_inactive:
        query = query.filter(Service.is_active == True)
    if category_id is not None:
        query = query.filter(Service.category_id == category_id)
    if category_slug:
        cat = db.query(ServiceCategory).filter(ServiceCategory.slug == category_slug).first()
        if cat:
            query = query.filter(Service.category_id == cat.id)
    if is_featured is not None:
        query = query.filter(Service.is_featured == is_featured)
    if min_price is not None:
        query = query.filter(Service.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Service.base_price <= max_price)
    if search:
        like_q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Service.name.ilike(like_q),
                Service.short_description.ilike(like_q),
                Service.description.ilike(like_q),
            )
        )

    if sort_by == "price_asc":
        query = query.order_by(Service.base_price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Service.base_price.desc())
    elif sort_by == "duration":
        query = query.order_by(Service.duration_minutes.asc())
    else:
        query = query.order_by(Service.is_featured.desc(), Service.id.asc())

    services = query.offset((page - 1) * limit).limit(limit).all()
    serialized = [serialize_service(s) for s in services]

    if min_rating is not None:
        serialized = [s for s in serialized if s.get("avg_rating", 4.8) >= min_rating]
    if city:
        city_lower = city.strip().lower()
        city_filtered = [
            s
            for s in serialized
            if any(city_lower in (p.get("city") or "").lower() for p in s.get("providers", []))
            or not s.get("providers")
        ]
        if city_filtered:
            serialized = city_filtered

    return serialized


@router.get("/{service_id}")
def get_service(service_id: int, db: Session = Depends(get_db)):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return serialize_service(svc)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreateRequest,
    current_user: User = Depends(require_roles("admin", "provider")),
    db: Session = Depends(get_db),
):
    slug = payload.slug or _slugify(payload.name)
    if db.query(Service).filter(Service.slug == slug).first():
        slug = f"{slug}-{uuid.uuid4().hex[:5]}"

    svc = Service(
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=slug,
        short_description=payload.short_description or payload.name.strip(),
        description=payload.description or payload.short_description or payload.name.strip(),
        base_price=payload.base_price,
        duration_minutes=payload.duration_minutes,
        image_url=payload.image_url or "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
        inclusions_json=_to_json_str(payload.inclusions),
        exclusions_json=_to_json_str(payload.exclusions),
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return serialize_service(svc)


@router.put("/{service_id}")
def update_service(
    service_id: int,
    payload: ServiceCreateRequest,
    current_user: User = Depends(require_roles("admin", "provider")),
    db: Session = Depends(get_db),
):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    svc.category_id = payload.category_id
    svc.name = payload.name.strip()
    if payload.short_description is not None:
        svc.short_description = payload.short_description
    if payload.description is not None:
        svc.description = payload.description
    svc.base_price = payload.base_price
    svc.duration_minutes = payload.duration_minutes
    if payload.image_url is not None:
        svc.image_url = payload.image_url
    if payload.inclusions is not None:
        svc.inclusions_json = _to_json_str(payload.inclusions)
    if payload.exclusions is not None:
        svc.exclusions_json = _to_json_str(payload.exclusions)
    svc.is_featured = payload.is_featured
    svc.is_active = payload.is_active
    db.commit()
    db.refresh(svc)
    return serialize_service(svc)


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(svc)
    db.commit()
    return {"message": "Service deleted successfully"}
