# HomeServe – Home Services Booking SaaS Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Frontend](https://img.shields.io/badge/React_18-Vite_%2B_Tailwind_CSS-06B6D4)
![Backend](https://img.shields.io/badge/FastAPI-Python_3.11%2B-009688)
![Database](https://img.shields.io/badge/MySQL_8.0-28_Tables_(3NF)-4479A1)
![Payments](https://img.shields.io/badge/Payments-Razorpay_HMAC-3395FF)
![License](https://img.shields.io/badge/License-MIT-blue)

**HomeServe** is an enterprise-grade, multi-role **Home Services Booking SaaS Platform** built with **React 18 (Vite + Tailwind CSS)**, **Python FastAPI**, and **MySQL 8.0**. It connects homeowners (**Customers**) with verified service businesses (**Service Providers**), on-ground field specialists (**Technicians**), and platform operators (**Administrators**) across **10 core home service categories**.

---

## 1. Key Platform Highlights

- **4 Dedicated Role Portals (RBAC):**
  - **Customer Portal:** Browse 10 categories & 16+ services, filter by price/rating/city, manage multiple saved addresses, apply promo coupons (`WELCOME20`, `SUMMER15`, `HOME500`), book time slots, pay via Razorpay, track live job progress, download GST invoices, leave verified 1–5 star reviews, and raise support tickets.
  - **Service Provider Portal:** Complete business KYC onboarding, map custom service pricing & service areas, configure weekly working hours & time slots, onboard field technicians, accept/reject bookings, dispatch technicians, respond to reviews, manage SaaS subscriptions (`Starter`, `Professional`, `Enterprise`), and track net earnings & commissions.
  - **Technician Field Portal:** View dispatched jobs, update real-time field status (`Accepted` -> `Arrived` -> `In Progress` -> `Completed`), upload `before` and `after` job photos, and log completion remarks.
  - **Admin Command Center:** Verify or reject provider KYC documents, manage the 10 service categories & service catalog, create promotional coupons, moderate reviews, resolve customer/provider complaints, and monitor platform-wide GMV & commission analytics.
- **28-Table 3NF Relational Database (`MySQL 8.0`):** Full ACID compliance, atomic double-booking prevention, immutable booking status audit trails (`booking_status_history`), and idempotent payment webhook logs (`payment_webhook_events`).

---

## 2. Demo Credentials (All 4 Roles)

All seeded accounts in [`database/seed.sql`](file:///c:/vibe_coding_tops/homeserve/database/seed.sql) use the password: **`Password@123`**

| Role | Full Name / Business | Email | Password | Portal Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Arjun Mehta (Platform Admin) | `admin@homeserve.com` | `Password@123` | KYC verification queue, GMV analytics, catalog & coupon management, dispute resolution |
| **Customer** | Priya Sharma | `priya.sharma@example.com` | `Password@123` | Completed & active bookings, GST invoices, saved Mumbai addresses, loyalty points |
| **Customer** | Rohan Verma | `rohan.verma@example.com` | `Password@123` | Upcoming plumbing & pest control bookings, Bengaluru address |
| **Service Provider** | Vikramaditya Joshi (*VoltCraft Electrical*) | `vikram@voltcraft.in` | `Password@123` | Verified Pro provider, custom services, technician roster, commission ledger |
| **Service Provider** | Siddharth Malhotra (*SparkleClean Hygiene*) | `siddharth@sparkleclean.in` | `Password@123` | Verified Enterprise provider, active 2BHK deep cleaning booking |
| **Service Provider** | Karthik Subramanian (*CoolBreeze HVAC*) | `karthik@coolbreeze.in` | `Password@123` | Pending KYC verification demo account |
| **Technician** | Manoj Tiwari (*VoltCraft Senior Tech*) | `manoj.tech@voltcraft.in` | `Password@123` | Completed MCB upgrade job with before/after photos |
| **Technician** | Deepak Solanki (*SparkleClean Lead*) | `deepak.tech@sparkleclean.in` | `Password@123` | Active `In Progress` 2BHK deep cleaning field job |

### Active Promotional Coupons
- **`WELCOME20`**: 20% off (up to ₹300) on orders above ₹499
- **`SUMMER15`**: 15% off (up to ₹400) on orders above ₹599
- **`HOME500`**: Flat ₹500 off on orders above ₹2,500

---

## 3. Repository Structure

```text
homeserve/
├── backend/                     # Python FastAPI REST API (/api/v1)
│   ├── app/
│   │   ├── core/                # Config, database session, JWT & bcrypt security
│   │   ├── models/              # SQLAlchemy 2.0 ORM models (all 28 tables)
│   │   ├── schemas/             # Pydantic v2 request/response validation schemas
│   │   ├── routers/             # Modular API routers (auth, catalog, bookings, payments, admin...)
│   │   └── main.py              # FastAPI application entrypoint & middleware
│   ├── tests/                   # Pytest unit, API, RBAC & lifecycle integration tests
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/                    # React 18 + Vite + Tailwind CSS Single Page Application
│   ├── src/
│   │   ├── api/                 # Axios client with JWT & refresh token interceptors
│   │   ├── context/             # AuthContext & role session state
│   │   ├── components/          # Navbar, ProtectedRoute, Modals, StatusBadges
│   │   └── pages/               # Public, Customer, Provider, Technician & Admin pages
│   ├── package.json
│   └── vite.config.js
├── database/                    # MySQL 8.0 Database Artifacts
│   ├── schema.sql               # Complete DDL for all 28 tables
│   ├── seed.sql                 # Realistic seed data across 10 categories & 4 roles
│   └── er_diagram.md            # Mermaid ER diagram & 3NF normalization notes
├── docs/                        # Enterprise Technical Documentation Suite
│   ├── requirement_specification.md
│   ├── user_stories.md
│   ├── project_workflow.md
│   ├── api_documentation.md
│   ├── testing_report.md
│   ├── security_checklist.md
│   ├── deployment_guide.md
│   └── ai_development_log.md
└── README.md
```

---

## 4. Quick Start Guide

### 1. Database Initialization (MySQL 8.0+)
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup (`http://localhost:8000`)
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
- **Swagger UI:** `http://localhost:8000/docs`

### 3. Frontend Setup (`http://localhost:5173`)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Run Automated Tests
```bash
cd backend
pytest -v
```

---

## 5. Technical Documentation Index

1. [Software Requirement Specification (SRS)](file:///c:/vibe_coding_tops/homeserve/docs/requirement_specification.md)
2. [Agile User Stories & Acceptance Criteria](file:///c:/vibe_coding_tops/homeserve/docs/user_stories.md)
3. [Entity Relationship Diagram (28 Tables)](file:///c:/vibe_coding_tops/homeserve/database/er_diagram.md)
4. [System Workflows & Sequence Diagrams](file:///c:/vibe_coding_tops/homeserve/docs/project_workflow.md)
5. [REST API Reference Documentation (`/api/v1`)](file:///c:/vibe_coding_tops/homeserve/docs/api_documentation.md)
6. [Testing Report & 20-Step E2E Verification](file:///c:/vibe_coding_tops/homeserve/docs/testing_report.md)
7. [Security & OWASP Compliance Checklist](file:///c:/vibe_coding_tops/homeserve/docs/security_checklist.md)
8. [Cloud Deployment & DevOps Guide](file:///c:/vibe_coding_tops/homeserve/docs/deployment_guide.md)
9. [AI Vibe Coding Development Log](file:///c:/vibe_coding_tops/homeserve/docs/ai_development_log.md)
