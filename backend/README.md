# HomeServe Backend API

Enterprise-grade **FastAPI + SQLAlchemy 2.x + MySQL 8.0** backend for the **HomeServe – Home Services Booking SaaS Platform**.

## Features
- **28 Normalized MySQL 8.0 Tables** with strict foreign keys, cascades, and indexes
- **JWT Authentication** (Access & Refresh tokens with rotation, Argon2/bcrypt password hashing, RBAC across `admin`, `customer`, `provider`, `technician`)
- **Service Catalog & Provider Verification** (10 Categories, 16+ Services, provider service customization, service areas, working hours)
- **Booking Engine** (Double-booking prevention, dynamic pricing with coupons & 18% GST, 15% platform commission, status history audit log)
- **Technician Dispatch & Field Operations** (Conflict-checked assignment, status progression from Assigned -> Accepted -> Arrived -> In Progress -> Completed, before/after photo upload)
- **Payments & Invoicing** (Razorpay order generation, HMAC-SHA256 signature verification, webhook idempotency, automated invoice & provider earning ledger)
- **Reviews, Complaints, Notifications, Subscriptions & Analytics** (Role-specific KPI dashboards + CSV export streams)

## Quick Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Running Tests

```bash
pytest -v
```
