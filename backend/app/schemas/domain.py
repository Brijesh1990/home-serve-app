from datetime import date, datetime
from typing import Any, List, Optional, Union
from pydantic import BaseModel, EmailStr, Field, model_validator


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None
    emergency_contact: Optional[str] = None
    city: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    status: Optional[str] = None

    @model_validator(mode="after")
    def resolve_active(self):
        if self.is_active is None:
            if self.status is not None:
                self.is_active = self.status.lower() == "active"
            else:
                self.is_active = True
        return self


class AddressCreateRequest(BaseModel):
    label: str = "Home"
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line: Optional[str] = None
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str = "Mumbai"
    state: str = "Maharashtra"
    postal_code: str = "400001"
    country: str = "India"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    is_default: bool = False

    @model_validator(mode="after")
    def resolve_lines(self):
        if not self.address_line1 and self.address_line:
            self.address_line1 = self.address_line
        if not self.address_line1:
            self.address_line1 = "101, Residency Towers"
        if not self.address_line2 and self.landmark:
            self.address_line2 = self.landmark
        return self


class CategoryCreateRequest(BaseModel):
    parent_id: Optional[int] = None
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = "Wrench"
    icon: Optional[str] = None
    image_url: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    display_order: int = 1

    @model_validator(mode="after")
    def resolve_icon_image(self):
        if self.icon and (not self.icon_name or self.icon_name == "Wrench"):
            self.icon_name = self.icon
        if not self.image_url and self.image:
            self.image_url = self.image
        return self


class ServiceCreateRequest(BaseModel):
    category_id: int = 1
    name: str
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    base_price: float = Field(..., gt=0)
    discount_price: Optional[float] = None
    duration_minutes: int = 60
    image_url: Optional[str] = None
    image: Optional[str] = None
    city: Optional[str] = None
    inclusions: Optional[Union[List[str], str]] = None
    exclusions: Optional[Union[List[str], str]] = None
    is_featured: bool = False
    is_active: bool = True

    @model_validator(mode="after")
    def resolve_image(self):
        if not self.image_url and self.image:
            self.image_url = self.image
        return self


class ProviderUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    category_specialization: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    id_document_url: Optional[str] = None
    is_available: Optional[bool] = None


class ProviderRejectRequest(BaseModel):
    rejection_reason: Optional[str] = None
    reason: Optional[str] = None

    @model_validator(mode="after")
    def resolve_reason(self):
        if not self.rejection_reason:
            self.rejection_reason = self.reason or "Documentation incomplete or unverified license"
        return self


class ProviderServiceAddRequest(BaseModel):
    service_id: int
    custom_price: Optional[float] = None
    custom_duration_minutes: Optional[int] = None


class ServiceAreaCreateRequest(BaseModel):
    city: str = "Mumbai"
    area_name: Optional[str] = None
    state: str = "Maharashtra"
    postal_code: str = "400001"
    service_radius_km: float = 15.0


class WorkingHourItem(BaseModel):
    day_of_week: Optional[str] = None
    day: Optional[str] = None
    start_time: str = "08:00"
    end_time: str = "20:00"
    is_closed: Optional[bool] = None
    is_open: Optional[bool] = None

    @model_validator(mode="after")
    def resolve_day_and_closed(self):
        if not self.day_of_week:
            self.day_of_week = self.day or "Monday"
        if self.is_closed is None:
            self.is_closed = (not self.is_open) if self.is_open is not None else False
        return self


class WorkingHoursUpdateRequest(BaseModel):
    working_hours: List[WorkingHourItem]


class BookingCreateRequest(BaseModel):
    service_id: int
    provider_id: Optional[int] = None
    address_id: Optional[int] = None
    appointment_date: Optional[date] = None
    scheduled_date: Optional[date] = None
    appointment_time: Optional[str] = None
    time_slot: Optional[str] = None
    problem_description: Optional[str] = None
    reference_image_url: Optional[str] = None
    coupon_code: Optional[str] = None
    address_line1: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None

    @model_validator(mode="after")
    def resolve_schedule_and_address(self):
        if not self.appointment_date and self.scheduled_date:
            self.appointment_date = self.scheduled_date
        if not self.appointment_date:
            self.appointment_date = date.today()
        if not self.appointment_time and self.time_slot:
            self.appointment_time = self.time_slot
        if not self.appointment_time:
            self.appointment_time = "10:30 AM"
        if not self.address_line1 and self.address_line:
            self.address_line1 = self.address_line
        return self


class BookingStatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingRescheduleRequest(BaseModel):
    appointment_date: Optional[date] = None
    scheduled_date: Optional[date] = None
    appointment_time: Optional[str] = None
    time_slot: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def resolve_reschedule_fields(self):
        if not self.appointment_date and self.scheduled_date:
            self.appointment_date = self.scheduled_date
        if not self.appointment_date:
            self.appointment_date = date.today()
        if not self.appointment_time and self.time_slot:
            self.appointment_time = self.time_slot
        if not self.appointment_time:
            self.appointment_time = "10:30 AM"
        return self


class AvailabilityCheckRequest(BaseModel):
    provider_id: int
    appointment_date: Optional[date] = None
    scheduled_date: Optional[date] = None
    appointment_time: Optional[str] = None
    time_slot: Optional[str] = None

    @model_validator(mode="after")
    def resolve_avail_fields(self):
        if not self.appointment_date and self.scheduled_date:
            self.appointment_date = self.scheduled_date
        if not self.appointment_date:
            self.appointment_date = date.today()
        if not self.appointment_time and self.time_slot:
            self.appointment_time = self.time_slot
        if not self.appointment_time:
            self.appointment_time = "10:30 AM"
        return self


class TechnicianCreateRequest(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = "+91 9876500000"
    password: Optional[str] = "Password@123"
    provider_id: Optional[int] = None
    specialization: str = "General Maintenance"
    experience_years: int = 3
    id_proof_url: Optional[str] = None
    availability_status: str = "available"
    city: Optional[str] = None


class TechnicianUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    availability_status: Optional[str] = None
    is_active: Optional[bool] = None


class AssignmentCreateRequest(BaseModel):
    booking_id: int
    technician_id: int
    notes: Optional[str] = None


class AssignmentStatusUpdateRequest(BaseModel):
    assignment_status: Optional[str] = None
    status: Optional[str] = None
    completion_remarks: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None


class PaymentCreateOrderRequest(BaseModel):
    booking_id: Optional[int] = None
    amount: Optional[float] = None
    payment_type: str = "full"
    payment_method: str = "Razorpay"


class PaymentVerifyRequest(BaseModel):
    booking_id: Optional[int] = None
    payment_id: Optional[int] = None
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None
    payment_method: Optional[str] = "Razorpay"


class PaymentRefundRequest(BaseModel):
    reason: str = "Customer requested cancellation/refund"


class CouponCreateRequest(BaseModel):
    code: str
    title: Optional[str] = None
    description: Optional[str] = None
    discount_type: str = "percentage"  # percentage, fixed
    discount_value: float
    min_order_amount: float = 0.0
    max_discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: int = 100
    valid_from: Optional[datetime] = None
    valid_until: Optional[Union[datetime, str]] = None
    is_active: bool = True

    @model_validator(mode="after")
    def resolve_coupon_fields(self):
        if not self.title:
            self.title = f"{self.code.upper()} Promotional Offer"
        if self.max_discount_amount is None and self.max_discount is not None:
            self.max_discount_amount = self.max_discount
        return self


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: float


class ReviewCreateRequest(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewRespondRequest(BaseModel):
    provider_response: Optional[str] = None
    response: Optional[str] = None


class ReviewModerateRequest(BaseModel):
    moderation_status: str  # approved, flagged, hidden


class ComplaintCreateRequest(BaseModel):
    booking_id: Optional[int] = None
    booking_reference: Optional[str] = None
    against_provider_id: Optional[int] = None
    category: str = "Service Quality"
    subject: str
    description: str
    priority: str = "Medium"


class ComplaintResolveRequest(BaseModel):
    status: str = "Resolved"
    admin_resolution: str


class AnnouncementRequest(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None  # None = all users


class SubscriptionCreateRequest(BaseModel):
    plan_tier: str = "Professional"  # Starter, Professional, Enterprise
    billing_cycle: str = "monthly"  # monthly, annual
    provider_id: Optional[int] = None
