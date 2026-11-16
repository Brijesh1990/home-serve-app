from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    assignments,
    auth,
    bookings,
    categories,
    complaints,
    coupons,
    customers,
    invoices,
    notifications,
    payments,
    providers,
    reviews,
    services,
    subscriptions,
    technicians,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(customers.router)
api_router.include_router(providers.router)
api_router.include_router(categories.router)
api_router.include_router(services.router)
api_router.include_router(bookings.router)
api_router.include_router(bookings.availability_router)
api_router.include_router(technicians.router)
api_router.include_router(assignments.router)
api_router.include_router(payments.router)
api_router.include_router(invoices.router)
api_router.include_router(coupons.router)
api_router.include_router(reviews.router)
api_router.include_router(complaints.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(analytics.reports_router)
api_router.include_router(subscriptions.router)
