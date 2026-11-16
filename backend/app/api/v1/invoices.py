from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.payment import Invoice
from app.models.user import User
from app.utils.serializers import serialize_invoice

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("")
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)
    if current_user.role == "customer" and current_user.customer_profile:
        query = query.filter(Invoice.customer_id == current_user.customer_profile.id)
    elif current_user.role == "provider" and current_user.provider_profile:
        query = query.filter(Invoice.provider_id == current_user.provider_profile.id)

    invoices = query.order_by(Invoice.created_at.desc()).all()
    return [serialize_invoice(inv) for inv in invoices]


@router.get("/booking/{booking_id}")
def get_invoice_by_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found for this booking")
    return serialize_invoice(invoice)


@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return serialize_invoice(invoice)
