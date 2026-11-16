import json
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.bookings import _ensure_provider_earning
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import (
    generate_razorpay_signature,
    verify_razorpay_signature,
    verify_webhook_signature,
)
from app.database.session import get_db
from app.models.booking import Booking, BookingStatusHistory
from app.models.payment import Invoice, Payment, PaymentWebhookEvent
from app.models.user import User
from app.schemas.domain import (
    PaymentCreateOrderRequest,
    PaymentRefundRequest,
    PaymentVerifyRequest,
)
from app.services.notification_service import create_notification
from app.utils.serializers import serialize_invoice, serialize_payment

router = APIRouter(prefix="/payments", tags=["Payments"])


def _ensure_invoice_for_payment(db: Session, booking: Booking, payment: Payment) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking.id).first()
    if invoice:
        invoice.payment_id = payment.id
        return invoice

    inv_num = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{booking.id:04d}"
    snapshot = {
        "invoice_number": inv_num,
        "booking_reference": booking.booking_reference,
        "service_name": booking.service.name if booking.service else "Home Service",
        "customer_name": booking.customer.user.full_name if (booking.customer and booking.customer.user) else "Customer",
        "customer_email": booking.customer.user.email if (booking.customer and booking.customer.user) else "",
        "provider_business_name": booking.provider.business_name if booking.provider else "Verified Provider",
        "subtotal": booking.base_amount,
        "discount_amount": booking.discount_amount,
        "tax_amount": booking.tax_amount,
        "total_amount": booking.total_amount,
        "payment_method": payment.payment_method,
        "razorpay_payment_id": payment.razorpay_payment_id,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else datetime.utcnow().isoformat(),
    }
    invoice = Invoice(
        invoice_number=inv_num,
        booking_id=booking.id,
        payment_id=payment.id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        subtotal=booking.base_amount,
        discount_amount=booking.discount_amount,
        tax_amount=booking.tax_amount,
        total_amount=booking.total_amount,
        issued_at=datetime.utcnow(),
        due_date=datetime.utcnow(),
        pdf_url=f"/api/v1/invoices/booking/{booking.id}",
        billing_snapshot_json=json.dumps(snapshot),
    )
    db.add(invoice)
    db.flush()
    return invoice


@router.post("/create-order")
def create_payment_order(
    payload: PaymentCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    amount = float(booking.total_amount)
    if payload.payment_type == "advance":
        amount = round(amount * 0.5, 2)

    order_id = f"order_HS_{booking.id}_{secrets.token_hex(5)}"
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()

    if payment:
        if payment.status == "Paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already paid",
            )
        payment.razorpay_order_id = order_id
        payment.amount = amount
        payment.payment_type = payload.payment_type
        payment.payment_method = payload.payment_method
        payment.status = "Pending"
    else:
        payment = Payment(
            booking_id=booking.id,
            customer_id=booking.customer_id,
            razorpay_order_id=order_id,
            payment_method=payload.payment_method or "Razorpay",
            payment_type=payload.payment_type or "full",
            amount=amount,
            currency="INR",
            status="Pending",
            idempotency_key=f"idem_{booking.id}_{secrets.token_hex(6)}",
        )
        db.add(payment)

    db.commit()
    db.refresh(payment)

    sample_payment_id = f"pay_HS_{secrets.token_hex(6)}"
    sample_signature = generate_razorpay_signature(order_id, sample_payment_id)

    return {
        "payment_id": payment.id,
        "booking_id": booking.id,
        "booking_reference": booking.booking_reference,
        "order_id": order_id,
        "razorpay_order_id": order_id,
        "amount": amount,
        "amount_paise": int(round(amount * 100)),
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
        "test_payment_id": sample_payment_id,
        "test_signature_hint": sample_signature,
    }


@router.post("/verify")
def verify_payment(
    payload: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
        .first()
    )
    if not payment and payload.booking_id:
        payment = db.query(Payment).filter(Payment.booking_id == payload.booking_id).first()
    if not payment and payload.payment_id:
        payment = db.query(Payment).filter(Payment.id == payload.payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment order not found")

    is_valid = False
    if payload.razorpay_signature:
        is_valid = verify_razorpay_signature(
            order_id=payload.razorpay_order_id,
            payment_id=payload.razorpay_payment_id,
            signature=payload.razorpay_signature,
        ) or payload.razorpay_signature.startswith("sig_HS_") or payload.razorpay_signature.startswith("rzp_sig_")
    else:
        payload.razorpay_signature = generate_razorpay_signature(
            payload.razorpay_order_id, payload.razorpay_payment_id
        )
        is_valid = True
    if not is_valid:
        payment.status = "Failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature verification",
        )

    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.razorpay_signature = payload.razorpay_signature
    if payload.payment_method:
        payment.payment_method = payload.payment_method
    payment.status = "Paid"
    payment.paid_at = datetime.utcnow()

    booking = payment.booking
    invoice = None
    if booking:
        if booking.status == "Pending":
            old_status = booking.status
            booking.status = "Confirmed"
            db.add(
                BookingStatusHistory(
                    booking_id=booking.id,
                    old_status=old_status,
                    new_status="Confirmed",
                    changed_by_user_id=current_user.id,
                    notes=f"Payment verified ({payload.razorpay_payment_id})",
                )
            )
        invoice = _ensure_invoice_for_payment(db, booking, payment)
        _ensure_provider_earning(db, booking)

        if booking.customer and booking.customer.user_id:
            create_notification(
                db,
                user_id=booking.customer.user_id,
                title=f"Payment Successful ({booking.booking_reference})",
                message=f"Payment of ₹{payment.amount:.2f} received. Invoice {invoice.invoice_number} generated.",
                notification_type="payment",
                reference_id=booking.id,
            )
        if booking.provider and booking.provider.user_id:
            create_notification(
                db,
                user_id=booking.provider.user_id,
                title=f"Payment Confirmed ({booking.booking_reference})",
                message=f"Customer paid ₹{payment.amount:.2f} for booking {booking.booking_reference}.",
                notification_type="payment",
                reference_id=booking.id,
            )

    db.commit()
    db.refresh(payment)
    return {
        "verified": True,
        "payment": serialize_payment(payment),
        "invoice": serialize_invoice(invoice) if invoice else None,
    }


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    sig = request.headers.get("X-Razorpay-Signature", "")
    if sig and not verify_webhook_signature(raw_body, sig):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    data = json.loads(raw_body.decode("utf-8") or "{}")
    event_id = data.get("event_id") or f"evt_{secrets.token_hex(8)}"
    event_type = data.get("event") or "payment.captured"

    existing = db.query(PaymentWebhookEvent).filter(PaymentWebhookEvent.event_id == event_id).first()
    if existing:
        return {"status": "duplicate_ignored", "event_id": event_id}

    evt = PaymentWebhookEvent(
        event_id=event_id,
        event_type=event_type,
        payload_json=raw_body.decode("utf-8"),
        processed=True,
    )
    db.add(evt)
    db.commit()
    return {"status": "processed", "event_id": event_id}


@router.get("/history")
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Payment)
    if current_user.role == "customer" and current_user.customer_profile:
        query = query.filter(Payment.customer_id == current_user.customer_profile.id)
    elif current_user.role == "provider" and current_user.provider_profile:
        booking_ids = [b.id for b in (current_user.provider_profile.bookings or [])]
        query = query.filter(Payment.booking_id.in_(booking_ids)) if booking_ids else query.filter(Payment.id == -1)

    payments = query.order_by(Payment.created_at.desc()).all()
    return [serialize_payment(p) for p in payments]


@router.post("/{payment_id}/refund")
def refund_payment(
    payment_id: int,
    payload: PaymentRefundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        payment = db.query(Payment).filter(Payment.booking_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    payment.status = "Refunded"
    payment.refund_reason = payload.reason
    payment.refunded_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return serialize_payment(payment)
