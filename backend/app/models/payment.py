from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    razorpay_order_id = Column(String(120), unique=True, nullable=True, index=True)
    razorpay_payment_id = Column(String(120), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="Razorpay", nullable=False)
    payment_type = Column(String(30), default="full", nullable=False)  # full, advance, remaining
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(30), default="Pending", nullable=False, index=True)  # Pending, Paid, Failed, Refunded
    idempotency_key = Column(String(120), unique=True, nullable=True, index=True)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="payment")
    customer = relationship("Customer")
    invoice = relationship("Invoice", back_populates="payment", uselist=False)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(60), unique=True, nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    tax_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    billing_snapshot_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="invoice")
    payment = relationship("Payment", back_populates="invoice")
    customer = relationship("Customer")
    provider = relationship("ServiceProvider")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(30), default="percentage", nullable=False)  # percentage, fixed
    discount_value = Column(Float, nullable=False)
    min_order_amount = Column(Float, default=0.0, nullable=False)
    max_discount_amount = Column(Float, nullable=True)
    usage_limit = Column(Integer, default=100, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    valid_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    usages = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    discount_applied = Column(Float, nullable=False)
    used_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")
    booking = relationship("Booking")


class PaymentWebhookEvent(Base):
    __tablename__ = "payment_webhook_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(String(120), unique=True, nullable=False, index=True)
    event_type = Column(String(80), nullable=False)
    payload_json = Column(Text, nullable=False)
    processed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
