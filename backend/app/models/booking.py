from datetime import datetime
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_reference = Column(String(40), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    address_id = Column(Integer, ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(String(30), nullable=False, index=True)
    status = Column(
        String(40),
        default="Pending",
        nullable=False,
        index=True,
    )  # Pending, Confirmed, Provider Assigned, In Progress, Completed, Cancelled, Rejected
    problem_description = Column(Text, nullable=True)
    reference_image_url = Column(String(500), nullable=True)
    base_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    commission_amount = Column(Float, nullable=False, default=0.0)
    provider_earning_amount = Column(Float, nullable=False, default=0.0)
    coupon_code = Column(String(50), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by_role = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="bookings")
    provider = relationship("ServiceProvider", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    address = relationship("Address")
    assignment = relationship("BookingAssignment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    images = relationship("BookingImage", back_populates="booking", cascade="all, delete-orphan")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    earning = relationship("ProviderEarning", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class BookingAssignment(Base):
    __tablename__ = "booking_assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assignment_status = Column(
        String(40),
        default="Assigned",
        nullable=False,
        index=True,
    )  # Assigned, Accepted, Rejected, Arrived, In Progress, Completed
    arrival_time = Column(DateTime, nullable=True)
    start_time = Column(DateTime, nullable=True)
    completion_time = Column(DateTime, nullable=True)
    completion_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="assignment")
    technician = relationship("Technician", back_populates="assignments")
    assigned_by = relationship("User")


class BookingImage(Base):
    __tablename__ = "booking_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    image_type = Column(String(30), default="reference", nullable=False)  # reference, before, after, issue
    image_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="images")
    uploaded_by = relationship("User")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(40), nullable=True)
    new_status = Column(String(40), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="status_history")
    changed_by = relationship("User")
