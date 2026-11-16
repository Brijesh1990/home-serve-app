import json
from typing import Any, Dict, List, Optional
from app.models import (
    Address,
    Booking,
    BookingAssignment,
    BookingImage,
    BookingStatusHistory,
    Complaint,
    Coupon,
    Customer,
    Invoice,
    Notification,
    Payment,
    ProviderEarning,
    ProviderService,
    ProviderWorkingHour,
    Review,
    Service,
    ServiceArea,
    ServiceCategory,
    ServiceProvider,
    Subscription,
    Technician,
    User,
)


def parse_json_list(val: Optional[str]) -> List[str]:
    if not val:
        return []
    try:
        parsed = json.loads(val)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except Exception:
        return [s.strip() for s in val.split(",") if s.strip()]


def serialize_user(user: User) -> Dict[str, Any]:
    if not user:
        return {}
    city = "Mumbai"
    if user.provider_profile and user.provider_profile.city:
        city = user.provider_profile.city
    elif user.addresses:
        city = user.addresses[0].city
    bookings_count = len(user.customer_profile.bookings) if (user.customer_profile and user.customer_profile.bookings) else 0
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "is_active": user.is_active,
        "status": "active" if user.is_active else "inactive",
        "is_email_verified": user.is_email_verified,
        "city": city,
        "bookings_count": bookings_count,
        "customer_id": user.customer_profile.id if user.customer_profile else None,
        "provider_id": user.provider_profile.id if user.provider_profile else None,
        "technician_id": user.technician_profile.id if user.technician_profile else None,
        "business_name": user.provider_profile.business_name if user.provider_profile else None,
        "verification_status": user.provider_profile.verification_status if user.provider_profile else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def serialize_address(addr: Address) -> Dict[str, Any]:
    if not addr:
        return {}
    return {
        "id": addr.id,
        "user_id": addr.user_id,
        "label": addr.label,
        "recipient_name": addr.user.full_name if addr.user else "Customer",
        "phone": addr.user.phone if addr.user else "+91 98765 43210",
        "address_line": addr.address_line1,
        "address_line1": addr.address_line1,
        "address_line2": addr.address_line2,
        "landmark": addr.address_line2 or "",
        "city": addr.city,
        "state": addr.state,
        "postal_code": addr.postal_code,
        "country": addr.country,
        "latitude": addr.latitude,
        "longitude": addr.longitude,
        "is_default": addr.is_default,
        "created_at": addr.created_at.isoformat() if addr.created_at else None,
    }


def serialize_category(cat: ServiceCategory) -> Dict[str, Any]:
    if not cat:
        return {}
    services = cat.services or []
    starting_price = min((s.base_price for s in services), default=299.0)
    return {
        "id": cat.id,
        "parent_id": cat.parent_id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "icon_name": cat.icon_name,
        "icon": cat.icon_name or "Wrench",
        "image_url": cat.image_url,
        "image": cat.image_url,
        "is_active": cat.is_active,
        "display_order": cat.display_order,
        "service_count": len(services),
        "starting_price": starting_price,
        "color": "from-blue-600 to-indigo-600",
        "created_at": cat.created_at.isoformat() if cat.created_at else None,
    }


def serialize_service(svc: Service) -> Dict[str, Any]:
    if not svc:
        return {}
    inclusions = parse_json_list(svc.inclusions_json)
    exclusions = parse_json_list(svc.exclusions_json)
    reviews = svc.reviews or []
    avg_rating = (
        round(sum(r.rating for r in reviews) / len(reviews), 1)
        if reviews
        else 4.8
    )
    providers_list = []
    for ps in svc.provider_services or []:
        if ps.is_active and ps.provider:
            providers_list.append(
                {
                    "provider_id": ps.provider.id,
                    "business_name": ps.provider.business_name,
                    "city": ps.provider.city,
                    "avg_rating": ps.provider.avg_rating,
                    "total_reviews": ps.provider.total_reviews,
                    "verification_status": ps.provider.verification_status,
                    "custom_price": ps.custom_price or svc.base_price,
                    "custom_duration_minutes": ps.custom_duration_minutes or svc.duration_minutes,
                }
            )
    city = providers_list[0]["city"] if providers_list else "Mumbai"
    return {
        "id": svc.id,
        "category_id": svc.category_id,
        "category_name": svc.category.name if svc.category else "Home Service",
        "category_slug": svc.category.slug if svc.category else None,
        "name": svc.name,
        "slug": svc.slug,
        "short_description": svc.short_description,
        "description": svc.description,
        "base_price": svc.base_price,
        "discount_price": svc.base_price,
        "duration_minutes": svc.duration_minutes,
        "image_url": svc.image_url,
        "image": svc.image_url,
        "city": city,
        "inclusions": inclusions,
        "exclusions": exclusions,
        "inclusions_json": svc.inclusions_json,
        "exclusions_json": svc.exclusions_json,
        "is_featured": svc.is_featured,
        "is_active": svc.is_active,
        "avg_rating": avg_rating,
        "rating": avg_rating,
        "review_count": max(len(reviews), 12),
        "reviews_count": max(len(reviews), 12),
        "providers": providers_list,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
    }


def serialize_provider(provider: ServiceProvider, include_details: bool = True) -> Dict[str, Any]:
    if not provider:
        return {}
    service_ids = [ps.service_id for ps in (provider.provider_services or []) if ps.is_active]
    active_sub = next((s for s in (provider.subscriptions or []) if s.status == "active"), None)
    data: Dict[str, Any] = {
        "id": provider.id,
        "user_id": provider.user_id,
        "full_name": provider.user.full_name if provider.user else None,
        "owner_name": provider.user.full_name if provider.user else "Provider Owner",
        "email": provider.user.email if provider.user else None,
        "phone": provider.user.phone if provider.user else None,
        "avatar_url": provider.user.avatar_url if provider.user else None,
        "business_name": provider.business_name,
        "business_description": provider.business_description,
        "category_specialization": provider.category_specialization,
        "category": provider.category_specialization,
        "specialization": provider.category_specialization,
        "city": provider.city,
        "experience_years": provider.experience_years,
        "verification_status": provider.verification_status,
        "is_verified": provider.verification_status == "verified",
        "id_document_url": provider.id_document_url,
        "license_number": provider.license_number,
        "rejection_reason": provider.rejection_reason,
        "avg_rating": round(provider.avg_rating or 0.0, 2),
        "rating": round(provider.avg_rating or 4.8, 2),
        "total_reviews": provider.total_reviews,
        "reviews_count": provider.total_reviews,
        "total_completed_jobs": provider.total_completed_jobs,
        "completed_jobs": provider.total_completed_jobs,
        "commission_rate": provider.commission_rate,
        "subscription_plan": active_sub.plan_tier if active_sub else "Professional",
        "service_ids": service_ids,
        "is_available": provider.is_available,
        "created_at": provider.created_at.isoformat() if provider.created_at else None,
    }
    if include_details:
        data["services"] = [
            {
                "id": ps.id,
                "service_id": ps.service_id,
                "service_name": ps.service.name if ps.service else None,
                "category_name": ps.service.category.name if (ps.service and ps.service.category) else None,
                "base_price": ps.service.base_price if ps.service else 0.0,
                "custom_price": ps.custom_price or (ps.service.base_price if ps.service else 0.0),
                "custom_duration_minutes": ps.custom_duration_minutes or (ps.service.duration_minutes if ps.service else 60),
                "image_url": ps.service.image_url if ps.service else None,
                "is_active": ps.is_active,
            }
            for ps in (provider.provider_services or [])
        ]
        data["service_areas"] = [
            {
                "id": area.id,
                "city": area.city,
                "area_name": f"{area.city} ({area.postal_code})",
                "state": area.state,
                "postal_code": area.postal_code,
                "service_radius_km": area.service_radius_km,
                "is_active": area.is_active,
            }
            for area in (provider.service_areas or [])
        ]
        data["working_hours"] = [
            {
                "id": wh.id,
                "day": wh.day_of_week,
                "day_of_week": wh.day_of_week,
                "start_time": wh.start_time,
                "end_time": wh.end_time,
                "is_open": not wh.is_closed,
                "is_closed": wh.is_closed,
            }
            for wh in (provider.working_hours or [])
        ]
        data["technicians_count"] = len(provider.technicians or [])
    return data


def serialize_technician(tech: Technician) -> Dict[str, Any]:
    if not tech:
        return {}
    return {
        "id": tech.id,
        "user_id": tech.user_id,
        "provider_id": tech.provider_id,
        "provider_name": tech.provider.business_name if tech.provider else "Apex Home Solutions",
        "city": tech.provider.city if tech.provider else "Mumbai",
        "full_name": tech.user.full_name if tech.user else None,
        "email": tech.user.email if tech.user else None,
        "phone": tech.user.phone if tech.user else None,
        "avatar_url": tech.user.avatar_url if tech.user else None,
        "specialization": tech.specialization,
        "experience_years": tech.experience_years,
        "id_proof_url": tech.id_proof_url,
        "availability_status": (tech.availability_status or "available").capitalize(),
        "avg_rating": tech.avg_rating,
        "rating": tech.avg_rating,
        "total_jobs_completed": tech.total_jobs_completed,
        "jobs_completed": tech.total_jobs_completed,
        "is_active": tech.is_active,
        "status": "active" if tech.is_active else "inactive",
        "created_at": tech.created_at.isoformat() if tech.created_at else None,
    }


def serialize_assignment(assign: Optional[BookingAssignment]) -> Optional[Dict[str, Any]]:
    if not assign:
        return None
    return {
        "id": assign.id,
        "booking_id": assign.booking_id,
        "technician_id": assign.technician_id,
        "technician_name": assign.technician.user.full_name if (assign.technician and assign.technician.user) else None,
        "technician_phone": assign.technician.user.phone if (assign.technician and assign.technician.user) else None,
        "technician_specialization": assign.technician.specialization if assign.technician else None,
        "assigned_by_user_id": assign.assigned_by_user_id,
        "assignment_status": assign.assignment_status,
        "arrival_time": assign.arrival_time.isoformat() if assign.arrival_time else None,
        "start_time": assign.start_time.isoformat() if assign.start_time else None,
        "completion_time": assign.completion_time.isoformat() if assign.completion_time else None,
        "completion_remarks": assign.completion_remarks,
        "created_at": assign.created_at.isoformat() if assign.created_at else None,
        "updated_at": assign.updated_at.isoformat() if assign.updated_at else None,
    }


def serialize_payment(payment: Optional[Payment]) -> Optional[Dict[str, Any]]:
    if not payment:
        return None
    return {
        "id": payment.id,
        "booking_id": payment.booking_id,
        "booking_reference": payment.booking.booking_reference if payment.booking else None,
        "service_name": payment.booking.service.name if (payment.booking and payment.booking.service) else None,
        "customer_id": payment.customer_id,
        "customer_name": payment.customer.user.full_name if (payment.customer and payment.customer.user) else None,
        "order_id": payment.razorpay_order_id,
        "razorpay_order_id": payment.razorpay_order_id,
        "razorpay_payment_id": payment.razorpay_payment_id,
        "razorpay_signature": payment.razorpay_signature,
        "payment_method": payment.payment_method,
        "payment_type": payment.payment_type,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "refund_reason": payment.refund_reason,
        "refunded_at": payment.refunded_at.isoformat() if payment.refunded_at else None,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
    }


def serialize_invoice(invoice: Optional[Invoice]) -> Optional[Dict[str, Any]]:
    if not invoice:
        return None
    snapshot = None
    if invoice.billing_snapshot_json:
        try:
            snapshot = json.loads(invoice.billing_snapshot_json)
        except Exception:
            snapshot = None
    booking = invoice.booking
    addr_str = "101, Residency Towers, Mumbai - 400001"
    if booking and booking.address:
        addr_str = f"{booking.address.address_line1}, {booking.address.city} - {booking.address.postal_code}"
    tax = float(invoice.tax_amount or 0.0)
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "booking_id": invoice.booking_id,
        "booking_reference": booking.booking_reference if booking else None,
        "payment_id": invoice.payment_id,
        "customer_id": invoice.customer_id,
        "customer_name": invoice.customer.user.full_name if (invoice.customer and invoice.customer.user) else "Customer",
        "customer_email": invoice.customer.user.email if (invoice.customer and invoice.customer.user) else "",
        "customer_phone": invoice.customer.user.phone if (invoice.customer and invoice.customer.user) else "",
        "customer_address": addr_str,
        "provider_id": invoice.provider_id,
        "provider_name": invoice.provider.business_name if invoice.provider else "Verified Provider",
        "provider_business_name": invoice.provider.business_name if invoice.provider else "Verified Provider",
        "provider_city": invoice.provider.city if invoice.provider else "Mumbai",
        "service_name": booking.service.name if (booking and booking.service) else "Home Service",
        "category_name": booking.service.category.name if (booking and booking.service and booking.service.category) else "Home Service",
        "appointment_date": booking.appointment_date.isoformat() if (booking and booking.appointment_date) else None,
        "appointment_time": booking.appointment_time if booking else None,
        "issued_date": invoice.issued_at.strftime("%Y-%m-%d") if invoice.issued_at else None,
        "base_amount": invoice.subtotal,
        "subtotal": invoice.subtotal,
        "discount_amount": invoice.discount_amount,
        "coupon_code": booking.coupon_code if booking else "",
        "cgst_amount": round(tax / 2.0, 2),
        "sgst_amount": round(tax / 2.0, 2),
        "tax_amount": tax,
        "total_amount": invoice.total_amount,
        "payment_status": invoice.payment.status if invoice.payment else "Paid",
        "payment_method": invoice.payment.payment_method if invoice.payment else "Razorpay",
        "razorpay_order_id": invoice.payment.razorpay_order_id if invoice.payment else "N/A",
        "razorpay_payment_id": invoice.payment.razorpay_payment_id if invoice.payment else "N/A",
        "issued_at": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "pdf_url": invoice.pdf_url,
        "billing_snapshot": snapshot,
        "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
    }


def serialize_booking(booking: Booking) -> Dict[str, Any]:
    if not booking:
        return {}
    assign = booking.assignment
    tech_user = assign.technician.user if (assign and assign.technician) else None
    before_img = next((img.image_url for img in (booking.images or []) if img.image_type == "before"), None)
    after_img = next((img.image_url for img in (booking.images or []) if img.image_type == "after"), None)
    appt_date_str = booking.appointment_date.isoformat() if booking.appointment_date else None

    return {
        "id": booking.id,
        "booking_reference": booking.booking_reference,
        "customer_id": booking.customer_id,
        "customer_name": booking.customer.user.full_name if (booking.customer and booking.customer.user) else "Customer",
        "customer_email": booking.customer.user.email if (booking.customer and booking.customer.user) else "",
        "customer_phone": booking.customer.user.phone if (booking.customer and booking.customer.user) else "",
        "provider_id": booking.provider_id,
        "provider_name": booking.provider.business_name if booking.provider else "Verified Provider",
        "service_id": booking.service_id,
        "service_name": booking.service.name if booking.service else "Home Service",
        "category_name": booking.service.category.name if (booking.service and booking.service.category) else "Home Service",
        "technician_id": assign.technician_id if assign else None,
        "technician_name": tech_user.full_name if tech_user else None,
        "technician_phone": tech_user.phone if tech_user else None,
        "assignment_id": assign.id if assign else None,
        "assignment_status": assign.assignment_status if assign else "Unassigned",
        "arrival_time": assign.arrival_time.strftime("%Y-%m-%d %H:%M") if (assign and assign.arrival_time) else None,
        "start_time": assign.start_time.strftime("%Y-%m-%d %H:%M") if (assign and assign.start_time) else None,
        "completion_time": assign.completion_time.strftime("%Y-%m-%d %H:%M") if (assign and assign.completion_time) else None,
        "completion_remarks": assign.completion_remarks if assign else None,
        "before_image_url": before_img,
        "after_image_url": after_img,
        "address_id": booking.address_id,
        "address_line": booking.address.address_line1 if booking.address else "101, Residency Towers",
        "city": booking.address.city if booking.address else (booking.provider.city if booking.provider else "Mumbai"),
        "postal_code": booking.address.postal_code if booking.address else "400001",
        "appointment_date": appt_date_str,
        "scheduled_date": appt_date_str,
        "appointment_time": booking.appointment_time,
        "time_slot": booking.appointment_time,
        "status": booking.status,
        "payment_status": booking.payment.status if booking.payment else "Pending",
        "payment_method": booking.payment.payment_method if booking.payment else "Razorpay",
        "razorpay_order_id": booking.payment.razorpay_order_id if booking.payment else None,
        "razorpay_payment_id": booking.payment.razorpay_payment_id if booking.payment else None,
        "problem_description": booking.problem_description,
        "reference_image_url": booking.reference_image_url,
        "base_amount": booking.base_amount,
        "discount_amount": booking.discount_amount,
        "tax_amount": booking.tax_amount,
        "total_amount": booking.total_amount,
        "commission_amount": booking.commission_amount,
        "provider_earning_amount": booking.provider_earning_amount,
        "provider_payout": booking.provider_earning_amount,
        "coupon_code": booking.coupon_code,
        "cancellation_reason": booking.cancellation_reason,
        "cancelled_by_role": booking.cancelled_by_role,
        "is_reviewed": booking.review is not None,
        "has_review": booking.review is not None,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "updated_at": booking.updated_at.isoformat() if booking.updated_at else None,
        "service": {
            "id": booking.service.id,
            "name": booking.service.name,
            "slug": booking.service.slug,
            "category_name": booking.service.category.name if booking.service.category else None,
            "base_price": booking.service.base_price,
            "duration_minutes": booking.service.duration_minutes,
            "image_url": booking.service.image_url,
        }
        if booking.service
        else None,
        "provider": {
            "id": booking.provider.id,
            "business_name": booking.provider.business_name,
            "city": booking.provider.city,
            "avg_rating": booking.provider.avg_rating,
            "phone": booking.provider.user.phone if booking.provider.user else None,
            "email": booking.provider.user.email if booking.provider.user else None,
        }
        if booking.provider
        else None,
        "customer": {
            "id": booking.customer.id,
            "user_id": booking.customer.user_id,
            "full_name": booking.customer.user.full_name if booking.customer.user else None,
            "email": booking.customer.user.email if booking.customer.user else None,
            "phone": booking.customer.user.phone if booking.customer.user else None,
        }
        if booking.customer
        else None,
        "address": serialize_address(booking.address) if booking.address else None,
        "assignment": serialize_assignment(booking.assignment),
        "payment": serialize_payment(booking.payment),
        "invoice": serialize_invoice(booking.invoice),
        "images": [
            {
                "id": img.id,
                "booking_id": img.booking_id,
                "uploaded_by_user_id": img.uploaded_by_user_id,
                "image_type": img.image_type,
                "image_url": img.image_url,
                "caption": img.caption,
                "created_at": img.created_at.isoformat() if img.created_at else None,
            }
            for img in (booking.images or [])
        ],
        "review": serialize_review(booking.review) if booking.review else None,
    }


def serialize_review(review: Optional[Review]) -> Optional[Dict[str, Any]]:
    if not review:
        return None
    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "booking_reference": review.booking.booking_reference if review.booking else None,
        "customer_id": review.customer_id,
        "customer_name": review.customer.user.full_name if (review.customer and review.customer.user) else "Customer",
        "customer_avatar": review.customer.user.avatar_url if (review.customer and review.customer.user) else None,
        "provider_id": review.provider_id,
        "provider_name": review.provider.business_name if review.provider else None,
        "service_id": review.service_id,
        "service_name": review.service.name if review.service else None,
        "rating": review.rating,
        "comment": review.comment,
        "provider_response": review.provider_response,
        "provider_responded_at": review.provider_responded_at.isoformat() if review.provider_responded_at else None,
        "moderation_status": review.moderation_status,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


def serialize_complaint(comp: Complaint) -> Dict[str, Any]:
    if not comp:
        return {}
    return {
        "id": comp.id,
        "ticket_number": comp.ticket_number,
        "booking_id": comp.booking_id,
        "booking_reference": comp.booking.booking_reference if comp.booking else "HS-BK-2026-1001",
        "raised_by_user_id": comp.raised_by_user_id,
        "user_id": comp.raised_by_user_id,
        "raised_by_name": comp.raised_by.full_name if comp.raised_by else "Customer",
        "user_name": comp.raised_by.full_name if comp.raised_by else "Customer",
        "user_role": comp.raised_by.role if comp.raised_by else "customer",
        "raised_by_email": comp.raised_by.email if comp.raised_by else None,
        "against_provider_id": comp.against_provider_id,
        "provider_name": comp.against_provider.business_name if comp.against_provider else None,
        "category": comp.category,
        "subject": comp.subject,
        "description": comp.description,
        "status": comp.status,
        "priority": comp.priority,
        "admin_resolution": comp.admin_resolution,
        "resolved_by_user_id": comp.resolved_by_user_id,
        "resolved_at": comp.resolved_at.isoformat() if comp.resolved_at else None,
        "created_at": comp.created_at.isoformat() if comp.created_at else None,
        "updated_at": comp.updated_at.isoformat() if comp.updated_at else None,
    }


def serialize_coupon(coupon: Coupon) -> Dict[str, Any]:
    if not coupon:
        return {}
    return {
        "id": coupon.id,
        "code": coupon.code,
        "title": coupon.title,
        "description": coupon.description,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_order_amount": coupon.min_order_amount,
        "max_discount_amount": coupon.max_discount_amount,
        "max_discount": coupon.max_discount_amount,
        "usage_limit": coupon.usage_limit,
        "used_count": coupon.used_count,
        "usage_count": coupon.used_count,
        "valid_from": coupon.valid_from.isoformat() if coupon.valid_from else None,
        "valid_until": coupon.valid_until.strftime("%Y-%m-%d") if coupon.valid_until else "2027-12-31",
        "is_active": coupon.is_active,
        "status": "active" if coupon.is_active else "expired",
        "created_at": coupon.created_at.isoformat() if coupon.created_at else None,
    }
