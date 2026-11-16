from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.booking import Booking
from app.models.feedback import Review
from app.models.provider import ServiceProvider
from app.models.user import User
from app.schemas.domain import (
    ReviewCreateRequest,
    ReviewModerateRequest,
    ReviewRespondRequest,
)
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_review

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _recalculate_provider_rating(db: Session, provider_id: int):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        return
    approved_reviews = (
        db.query(Review)
        .filter(
            Review.provider_id == provider_id,
            Review.moderation_status == "approved",
        )
        .all()
    )
    if approved_reviews:
        provider.avg_rating = round(
            sum(r.rating for r in approved_reviews) / len(approved_reviews), 2
        )
        provider.total_reviews = len(approved_reviews)


@router.get("")
def list_reviews(
    provider_id: Optional[int] = Query(default=None),
    service_id: Optional[int] = Query(default=None),
    moderation_status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Review)
    if provider_id is not None:
        query = query.filter(Review.provider_id == provider_id)
    if service_id is not None:
        query = query.filter(Review.service_id == service_id)
    if moderation_status:
        query = query.filter(Review.moderation_status == moderation_status)

    reviews = query.order_by(Review.created_at.desc()).all()
    return [serialize_review(r) for r in reviews]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviews can only be submitted for Completed bookings",
        )

    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review has already been submitted for this booking",
        )

    review = Review(
        booking_id=booking.id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        service_id=booking.service_id,
        rating=payload.rating,
        comment=payload.comment or "Great service experience!",
        moderation_status="approved",
    )
    db.add(review)
    db.flush()

    _recalculate_provider_rating(db, booking.provider_id)

    if booking.provider and booking.provider.user_id:
        create_notification(
            db,
            user_id=booking.provider.user_id,
            title=f"New {payload.rating}-Star Review!",
            message=f"Customer left a {payload.rating}-star review for {booking.booking_reference}.",
            notification_type="review",
            reference_id=review.id,
        )

    db.commit()
    db.refresh(review)
    return serialize_review(review)


@router.patch("/{review_id}/respond")
def respond_to_review(
    review_id: int,
    payload: ReviewRespondRequest,
    current_user: User = Depends(require_roles("provider", "admin")),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    resp_text = (payload.provider_response or payload.response or "").strip()
    if not resp_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Response text is required")

    review.provider_response = resp_text
    review.provider_responded_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    return serialize_review(review)


@router.patch("/{review_id}/moderate")
def moderate_review(
    review_id: int,
    payload: ReviewModerateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    review.moderation_status = payload.moderation_status
    db.flush()
    _recalculate_provider_rating(db, review.provider_id)
    db.commit()
    db.refresh(review)
    return serialize_review(review)
