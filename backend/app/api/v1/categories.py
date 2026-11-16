import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.catalog import ServiceCategory
from app.models.user import User
from app.schemas.domain import CategoryCreateRequest
from app.utils.serializers import serialize_category

router = APIRouter(prefix="/categories", tags=["Service Categories"])


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.get("")
def list_categories(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(ServiceCategory)
    if not include_inactive:
        query = query.filter(ServiceCategory.is_active == True)
    categories = query.order_by(ServiceCategory.display_order.asc(), ServiceCategory.id.asc()).all()
    return [serialize_category(c) for c in categories]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    slug = payload.slug or _slugify(payload.name)
    existing = (
        db.query(ServiceCategory)
        .filter((ServiceCategory.name == payload.name) | (ServiceCategory.slug == slug))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name or slug already exists",
        )
    cat = ServiceCategory(
        parent_id=payload.parent_id,
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        icon_name=payload.icon_name or "Wrench",
        image_url=payload.image_url or "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
        is_active=payload.is_active,
        display_order=payload.display_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return serialize_category(cat)


@router.put("/{category_id}")
def update_category(
    category_id: int,
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    cat.name = payload.name.strip()
    cat.slug = payload.slug or _slugify(payload.name)
    if payload.description is not None:
        cat.description = payload.description
    if payload.icon_name is not None:
        cat.icon_name = payload.icon_name
    if payload.image_url is not None:
        cat.image_url = payload.image_url
    cat.is_active = payload.is_active
    cat.display_order = payload.display_order
    db.commit()
    db.refresh(cat)
    return serialize_category(cat)


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}
