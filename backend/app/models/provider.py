from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    business_name = Column(String(200), nullable=False, index=True)
    business_description = Column(Text, nullable=True)
    category_specialization = Column(String(180), nullable=True, index=True)
    city = Column(String(100), nullable=False, default="Mumbai", index=True)
    experience_years = Column(Integer, default=3, nullable=False)
    verification_status = Column(String(30), default="pending", nullable=False, index=True)  # pending, verified, rejected
    id_document_url = Column(String(500), nullable=True)
    license_number = Column(String(100), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    avg_rating = Column(Float, default=4.8, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_completed_jobs = Column(Integer, default=0, nullable=False)
    commission_rate = Column(Float, default=15.0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="provider_profile")
    technicians = relationship("Technician", back_populates="provider", cascade="all, delete-orphan")
    provider_services = relationship("ProviderService", back_populates="provider", cascade="all, delete-orphan")
    service_areas = relationship("ServiceArea", back_populates="provider", cascade="all, delete-orphan")
    availability_slots = relationship("AvailabilitySlot", back_populates="provider", cascade="all, delete-orphan")
    working_hours = relationship("ProviderWorkingHour", back_populates="provider", cascade="all, delete-orphan")
    earnings = relationship("ProviderEarning", back_populates="provider", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="provider", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="provider")
    reviews = relationship("Review", back_populates="provider")


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    specialization = Column(String(180), nullable=False)
    experience_years = Column(Integer, default=2, nullable=False)
    id_proof_url = Column(String(500), nullable=True)
    availability_status = Column(String(30), default="available", nullable=False, index=True)  # available, busy, offline
    avg_rating = Column(Float, default=4.8, nullable=False)
    total_jobs_completed = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="technician_profile")
    provider = relationship("ServiceProvider", back_populates="technicians")
    assignments = relationship("BookingAssignment", back_populates="technician")


class ProviderService(Base):
    __tablename__ = "provider_services"
    __table_args__ = (UniqueConstraint("provider_id", "service_id", name="uq_provider_service"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    custom_price = Column(Float, nullable=True)
    custom_duration_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="provider_services")
    service = relationship("Service", back_populates="provider_services")


class ServiceArea(Base):
    __tablename__ = "service_areas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, default="Maharashtra")
    postal_code = Column(String(20), nullable=False, index=True)
    service_radius_km = Column(Float, default=15.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="service_areas")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    is_booked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="availability_slots")


class ProviderWorkingHour(Base):
    __tablename__ = "provider_working_hours"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False)  # Monday .. Sunday
    start_time = Column(String(20), nullable=False, default="08:00")
    end_time = Column(String(20), nullable=False, default="20:00")
    is_closed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="working_hours")


class ProviderEarning(Base):
    __tablename__ = "provider_earnings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    gross_amount = Column(Float, nullable=False)
    commission_percentage = Column(Float, nullable=False, default=15.0)
    commission_amount = Column(Float, nullable=False)
    net_earning = Column(Float, nullable=False)
    payout_status = Column(String(30), default="pending", nullable=False, index=True)  # pending, processed, paid
    payout_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="earnings")
    booking = relationship("Booking", back_populates="earning")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_name = Column(String(100), nullable=False)
    plan_tier = Column(String(40), nullable=False, default="Professional")  # Starter, Professional, Enterprise
    price = Column(Float, nullable=False)
    billing_cycle = Column(String(30), nullable=False, default="monthly")  # monthly, annual
    commission_rate = Column(Float, nullable=False, default=12.0)
    max_services = Column(Integer, nullable=False, default=25)
    max_technicians = Column(Integer, nullable=False, default=15)
    status = Column(String(30), nullable=False, default="active", index=True)  # active, expired, cancelled
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=False)
    razorpay_subscription_id = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("ServiceProvider", back_populates="subscriptions")
