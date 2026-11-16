# HomeServe – AI Vibe Coding Development Log (SDLC Phases 1–9)

> [!NOTE]
> This log documents the iterative **AI-Assisted Software Development Lifecycle (Vibe Coding)** used to architect, implement, test, and harden the **HomeServe – Home Services Booking SaaS Platform** across all 9 project phases.

---

## Phase-by-Phase AI Engineering Summary

| Phase | SDLC Stage | Primary AI Prompts & Engineering Objectives | Key Architectural Decisions & Refinements | Verification Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Requirement Analysis & Planning** | *"Design a comprehensive SRS, 4-role RBAC permission matrix, and INVEST user stories for a multi-tenant Home Services Booking SaaS platform covering 10 service categories."* | Separated **Service Provider** (business owner managing catalog, pricing, slots, and earnings) from **Technician** (field specialist executing dispatched jobs and uploading before/after photos). | `requirement_specification.md` & `user_stories.md` (29 stories, 155 pts) verified. |
| **Phase 2** | **Database Architecture (28 Tables)** | *"Generate a 3NF MySQL 8.0 schema and seed dataset for all 28 tables including users, customers, service_providers, technicians, availability_slots, bookings, payments, invoices, coupons, and webhook events."* | Added `UNIQUE(provider_id, slot_date, start_time)` on `availability_slots` and `UNIQUE(booking_id)` on `invoices`, `reviews`, and `provider_earnings` to guarantee relational integrity. | `schema.sql`, `seed.sql` & `er_diagram.md` validated with 28 InnoDB tables. |
| **Phase 3** | **Backend Core, Auth & RBAC** | *"Build a modular FastAPI backend with SQLAlchemy 2.0 ORM, bcrypt hashing, short-lived JWT access tokens, stateful refresh token rotation, and role-based dependency guards."* | Implemented SHA-256 hashing for stored `refresh_tokens` and `password_reset_tokens` so even a database read leak cannot compromise active sessions. | Auth & RBAC unit/API tests passing (`100%`). |
| **Phase 4** | **Catalog, KYC, Slots & Booking Engine** | *"Implement endpoints for the 10 service categories, provider KYC verification, time slot publishing, atomic double-booking prevention, and technician dispatch."* | Enforced strict booking state machine validation (`Pending` -> `Confirmed` -> `Provider Assigned` -> `In Progress` -> `Completed`) and automatic slot release (`is_booked = FALSE`) when a booking is `Cancelled` or `Rejected`. | Concurrency & slot-release integration tests passing. |
| **Phase 5** | **Payments, Coupons, Invoices & Commissions** | *"Integrate Razorpay order creation, HMAC-SHA256 signature verification, idempotent webhook handling, promotional coupon validation, 18% GST invoicing, and provider commission splits."* | Snapshot financial metrics (`base_amount`, `discount_amount`, `tax_amount`, `commission_amount`, `provider_earning_amount`) directly on the `bookings` and `invoices` rows at checkout time. | Financial math, HMAC verification & webhook replay tests passing. |
| **Phase 6** | **Multi-Role React + Tailwind Frontend** | *"Build a responsive React 18 + Vite + Tailwind CSS frontend with dedicated portals for Public Marketplace, Customer, Service Provider, Technician, and Admin."* | Created unified Axios interceptors for automatic JWT attachment and 401 refresh rotation, plus interactive booking wizards, GST invoice modals, and KPI analytics cards. | Production Vite build (`npm run build`) succeeded with zero errors. |
| **Phase 7** | **Automated Testing & E2E Verification** | *"Write comprehensive pytest unit, API, and integration tests covering all 4 roles and the 20-step E2E workflow."* | Configured an isolated test database fixture in `tests/conftest.py` to test full multi-role lifecycles deterministically without polluting seed data. | All automated tests passing (`0 failures`). |
| **Phase 8** | **Security Hardening Audit** | *"Audit the platform against OWASP Top 10: rate limiting, file upload MIME/size checks, CORS, RBAC ownership verification, and webhook replay protection."* | Added ownership checks on `/bookings/{id}`, `/invoices/{booking_id}`, and `/complaints` to prevent Horizontal Privilege Escalation (IDOR). | `security_checklist.md` completed with 14 verified controls. |
| **Phase 9** | **Documentation & Git Flow Packaging** | *"Compile OpenAPI documentation, cloud deployment guide, master README, and clean Git commit history."* | Documented one-command local startup, demo credentials for all 4 roles, and Render + Vercel deployment blueprints. | All 13 database & documentation artifacts delivered. |

---

## Key Iterative Bug Fixes & Edge Cases Resolved During AI Pair Programming

1. **Edge Case #1 – Coupon Discount Exceeding Cap on High-Value Bookings:**
   - *Issue:* Percentage coupons (`WELCOME20` = 20%) initially applied uncapped discounts on ₹3,499 deep cleaning orders.
   - *Fix:* Enforced `discount = min(round(base_amount * (coupon.discount_value / 100.0), 2), coupon.max_discount_amount)` and verified minimum order threshold (`base_amount >= coupon.min_order_amount`).

2. **Edge Case #2 – Re-booking a Slot After Customer Cancellation:**
   - *Issue:* When a customer cancelled a `Pending` or `Confirmed` booking, `availability_slots.is_booked` remained `TRUE`, blocking future customers from booking that time slot.
   - *Fix:* Added transactional slot release logic inside the booking status transition handler whenever `new_status in ('Cancelled', 'Rejected')` and excluded `Cancelled`/`Rejected` bookings from the active slot conflict query.

3. **Edge Case #3 – Provider Rating Drift on Multiple Reviews:**
   - *Issue:* Incremental floating-point averaging caused rounding drift.
   - *Fix:* Recomputed `avg_rating` and `total_reviews` directly via SQL aggregate (`AVG(rating)`, `COUNT(id)`) over approved reviews in `reviews` whenever a new review is submitted or moderated.
