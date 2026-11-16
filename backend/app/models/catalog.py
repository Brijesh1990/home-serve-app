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


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    slug = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon_name = Column(String(80), nullable=True, default="Wrench")
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(180), nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    short_description = Column(String(300), nullable=True)
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False, index=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    image_url = Column(String(500), nullable=True)
    inclusions_json = Column(Text, nullable=True)  # JSON array stored as text
    exclusions_json = Column(Text, nullable=True)  # JSON array stored as text
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("ServiceCategory", back_populates="services")
    provider_services = relationship("ProviderService", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")
    reviews = relationship("Review", back_populates="service")
