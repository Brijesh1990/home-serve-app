# HomeServe – Agile User Stories & Acceptance Criteria

> [!NOTE]
> All user stories follow the standard **INVEST** agile format (*As a `<Role>`, I want to `<Action>`, so that `<Business Value>`*) with explicit Given/When/Then acceptance criteria and Fibonacci story point estimates across **4 Roles** and **10 Platform Modules**.

---

## Summary of Epic Distribution

| Epic ID | Module Name | Primary Roles | User Stories | Total Story Points |
| :--- | :--- | :--- | :---: | :---: |
| **EPIC-01** | Authentication & Session Security | All Roles | US-101 to US-104 | 16 |
| **EPIC-02** | Service Catalog & Smart Discovery | Customer, Admin | US-201 to US-203 | 13 |
| **EPIC-03** | Customer Address & Profile Hub | Customer | US-301 to US-302 | 8 |
| **EPIC-04** | Provider Onboarding, KYC & SaaS Plans | Provider, Admin | US-401 to US-404 | 21 |
| **EPIC-05** | Slot Inventory & Double-Booking Prevention | Provider, Customer | US-501 to US-502 | 13 |
| **EPIC-06** | End-to-End Booking & Coupon Checkout | Customer, Provider | US-601 to US-603 | 21 |
| **EPIC-07** | Technician Dispatch & Field Job Execution | Provider, Technician | US-701 to US-703 | 16 |
| **EPIC-08** | Razorpay Payments, Commissions & GST Invoices | Customer, Provider, Admin | US-801 to US-803 | 21 |
| **EPIC-09** | Verified Reviews, Favorites & Dispute Tickets | Customer, Provider, Admin | US-901 to US-903 | 13 |
| **EPIC-10** | Real-Time Notifications & Role Dashboards | All Roles | US-1001 to US-1002 | 13 |
| **Total** | **10 Core Modules** | **4 RBAC Roles** | **29 Stories** | **155 Points** |

---

## EPIC-01: Authentication & Session Security

### US-101: Multi-Role Account Registration (5 Points)
- **Role:** Customer / Service Provider
- **Story:** As a new user, I want to register an account with my full name, email, phone number, password, and role (`customer` or `provider`), so that I can access role-specific platform workflows.
- **Acceptance Criteria:**
  1. **Given** valid registration details, **when** I submit `POST /api/v1/auth/register`, **then** the system hashes my password with `bcrypt`, creates a `users` row and corresponding `customers` or `service_providers` profile atomically, and returns HTTP `201 Created`.
  2. **Given** an email or phone number already registered, **when** I attempt to register, **then** the API returns HTTP `400 Bad Request` with a clear duplicate field message.

### US-102: JWT Login & Stateful Refresh Token Rotation (5 Points)
- **Role:** All Roles (`admin`, `customer`, `provider`, `technician`)
- **Story:** As a registered user, I want to sign in with my email and password and receive an access token and refresh token, so that my session stays secure without frequent re-logins.
- **Acceptance Criteria:**
  1. **Given** valid credentials, **when** I call `POST /api/v1/auth/login`, **then** I receive a 30-minute JWT `access_token`, a 7-day `refresh_token` stored hashed in `refresh_tokens`, and my role metadata.
  2. **Given** a valid refresh token, **when** I call `POST /api/v1/auth/refresh`, **then** the old refresh token is marked `is_revoked = TRUE` and a fresh token pair is returned.

### US-103: Secure Logout & Session Revocation (3 Points)
- **Role:** All Roles
- **Story:** As an authenticated user, I want to log out and revoke my active refresh token on the server, so that stolen tokens cannot be reused.
- **Acceptance Criteria:**
  1. **Given** an active session, **when** I call `POST /api/v1/auth/logout`, **then** `refresh_tokens.is_revoked` is set to `TRUE` in MySQL.

### US-104: Password Reset Flow (3 Points)
- **Role:** All Roles
- **Story:** As a user who forgot my password, I want to request a time-limited reset token and set a new password, so that I can recover my account safely.
- **Acceptance Criteria:**
  1. **Given** a registered email, **when** I request a password reset, **then** a single-use token is stored in `password_reset_tokens` with a 30-minute expiry.
  2. **Given** a valid unused token, **when** I submit a new password, **then** `users.password_hash` is updated and `is_used` becomes `TRUE`.

---

## EPIC-02: Service Catalog & Smart Discovery

### US-201: Browse 10 Core Service Categories & Featured Services (3 Points)
- **Role:** Customer / Public Visitor
- **Story:** As a homeowner visiting HomeServe, I want to explore all 10 service categories and featured services with upfront base prices and durations, so that I can quickly find the home service I need.
- **Acceptance Criteria:**
  1. **Given** I open the landing or catalog page, **when** `GET /api/v1/categories` and `GET /api/v1/services` are called, **then** all 10 categories (Electrical, Plumbing, AC Repair, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control, Deep Cleaning, Home Maintenance) render with icons, service counts, and transparent pricing.

### US-202: Multi-Filter Service & Provider Search (5 Points)
- **Role:** Customer
- **Story:** As a customer, I want to filter services by category, keyword, price range, rating, and city/postal code, so that I only see verified providers serving my neighborhood.
- **Acceptance Criteria:**
  1. **Given** filter parameters (`category_id`, `search`, `min_price`, `max_price`, `city`), **when** I query `GET /api/v1/services`, **then** matching active services and verified providers are returned in `<250ms`.

### US-203: Admin Service & Category Management (5 Points)
- **Role:** Admin
- **Story:** As a Platform Admin, I want to create, update, or deactivate service categories and individual services (including JSON inclusions and exclusions), so that the marketplace catalog stays accurate.
- **Acceptance Criteria:**
  1. **Given** Admin authentication, **when** I submit `POST /api/v1/categories` or `POST /api/v1/services`, **then** the catalog entry is persisted with unique slug generation.
  2. **Given** a non-admin role, **when** I attempt to mutate the catalog, **then** the API returns HTTP `403 Forbidden`.

---

## EPIC-03: Customer Address & Profile Hub

### US-301: Multi-Address Management with Default Selection (5 Points)
- **Role:** Customer
- **Story:** As a customer, I want to save multiple addresses (`Home`, `Office`, `Parents' House`) with city, postal code, and coordinates, so that I can select the right service location during checkout.
- **Acceptance Criteria:**
  1. **Given** I add an address with `is_default = TRUE`, **when** `POST /api/v1/customers/addresses` executes, **then** any previous default address for my account is automatically unset (`is_default = FALSE`).

### US-302: Customer Loyalty Points & Favorite Providers (3 Points)
- **Role:** Customer
- **Story:** As a customer, I want to bookmark my favorite service providers (`favorite_providers`) and track my loyalty points, so that I can re-book trusted professionals effortlessly.
- **Acceptance Criteria:**
  1. **Given** a verified provider, **when** I toggle favorite status, **then** a unique row in `favorite_providers` is created or removed without duplicates.

---

## EPIC-04: Provider Onboarding, KYC & SaaS Plans

### US-401: Provider Business Onboarding & KYC Document Submission (5 Points)
- **Role:** Service Provider
- **Story:** As a service provider, I want to submit my business name, experience years, license number, and KYC document URL, so that the platform administrator can verify my business.
- **Acceptance Criteria:**
  1. **Given** a newly registered provider, **when** I update my profile via `PUT /api/v1/providers/profile`, **then** my `verification_status` is tracked as `pending` and an Admin notification is created.

### US-402: Admin KYC Approval & Rejection Workflow (5 Points)
- **Role:** Admin
- **Story:** As an Admin, I want to inspect pending provider applications and mark them `verified` or `rejected` (with a mandatory rejection reason), so that only vetted professionals serve customers.
- **Acceptance Criteria:**
  1. **Given** a `pending` provider, **when** Admin approves via `PATCH /api/v1/admin/providers/{id}/verify`, **then** `verification_status` becomes `verified` and the provider becomes bookable.
  2. **Given** Admin rejects the provider, **when** a `rejection_reason` is supplied, **then** `verification_status` becomes `rejected` and the provider receives an in-app notification.

### US-403: Provider Custom Service Mapping & Service Areas (5 Points)
- **Role:** Service Provider
- **Story:** As a verified provider, I want to map the specific catalog services I offer (`provider_services`) with custom pricing and define my serviceable postal codes (`service_areas`), so that customers receive accurate quotes.
- **Acceptance Criteria:**
  1. **Given** a catalog service, **when** I link it to my provider profile, **then** `UNIQUE(provider_id, service_id)` prevents duplicate mappings and stores my `custom_price`.

### US-404: Provider SaaS Subscription Tiers (6 Points)
- **Role:** Service Provider
- **Story:** As a service provider, I want to subscribe to `Starter`, `Professional`, or `Enterprise` SaaS plans (`subscriptions`), so that I can unlock lower platform commission rates (`15%` -> `12%` -> `10%`) and higher technician limits.
- **Acceptance Criteria:**
  1. **Given** I upgrade to the `Enterprise` plan, **when** my subscription activates, **then** my `service_providers.commission_rate` updates to `10.0%` and `max_technicians` increases to `50`.

---

## EPIC-05: Slot Inventory & Double-Booking Prevention

### US-501: Provider Working Hours & Availability Slot Publishing (5 Points)
- **Role:** Service Provider
- **Story:** As a provider, I want to configure my weekly working hours (`provider_working_hours`) and publish available time slots (`availability_slots`), so that customers only book when my team is available.
- **Acceptance Criteria:**
  1. **Given** a valid date and start/end time, **when** I create slots via `POST /api/v1/providers/slots`, **then** slots are created with `is_booked = FALSE` and protected by `UNIQUE(provider_id, slot_date, start_time)`.

### US-502: Atomic Double-Booking Prevention (8 Points)
- **Role:** Customer / System
- **Story:** As a customer booking a popular time slot, I want the system to atomically lock the slot during checkout, so that two customers never double-book the same provider at the same date and time.
- **Acceptance Criteria:**
  1. **Given** a provider already has an active booking (`Pending`, `Confirmed`, `Provider Assigned`, `In Progress`) on `appointment_date` at `appointment_time`, **when** a second booking request arrives for the same slot, **then** the API rejects the second request with HTTP `409 Conflict`.

---

## EPIC-06: End-to-End Booking & Coupon Checkout

### US-601: Coupon Validation & Discount Calculation (5 Points)
- **Role:** Customer
- **Story:** As a customer at checkout, I want to apply promotional coupon codes (`WELCOME20`, `SUMMER15`, `HOME500`), so that I receive instant discounts on eligible bookings.
- **Acceptance Criteria:**
  1. **Given** coupon `WELCOME20` (20% off, min order ₹499, max discount ₹300), **when** I validate it on a ₹699 service via `POST /api/v1/coupons/validate`, **then** a discount of `₹139.80` is returned, taxable subtotal becomes `₹559.20`, 18% GST (`₹100.66`) is added, and final payable total is `₹659.86`.
  2. **Given** an expired coupon or order below `min_order_amount`, **when** I validate it, **then** HTTP `400 Bad Request` is returned.

### US-602: Customer Booking Creation with Reference Photo (8 Points)
- **Role:** Customer
- **Story:** As a customer, I want to book a service by selecting an address, date, time slot, problem description, and optional reference photo, so that the provider has full context before arriving.
- **Acceptance Criteria:**
  1. **Given** valid booking inputs, **when** I submit `POST /api/v1/bookings`, **then** a booking record with a unique `booking_reference` (`HS-YYYY-NNNNN`) is created in `Pending` status, `availability_slots.is_booked` is marked `TRUE`, and an initial `booking_status_history` entry is logged.

### US-603: Provider Accept/Reject & Cancellation Policy (8 Points)
- **Role:** Customer / Service Provider
- **Story:** As a provider, I want to accept (`Confirmed`) or reject (`Rejected`) incoming `Pending` bookings, and as a customer, I want to cancel a booking before work starts if my plans change.
- **Acceptance Criteria:**
  1. **Given** a `Pending` booking, **when** the provider accepts it, **then** status transitions to `Confirmed` and the customer is notified.
  2. **Given** a booking is cancelled or rejected, **when** status updates to `Cancelled` or `Rejected`, **then** any reserved `availability_slots.is_booked` flag is released back to `FALSE`.

---

## EPIC-07: Technician Dispatch & Field Job Execution

### US-701: Provider Technician Onboarding & Roster Management (5 Points)
- **Role:** Service Provider
- **Story:** As a service provider, I want to add field technicians (`technicians`) with their specialization, experience, and ID proof, so that I can dispatch them to confirmed customer bookings.
- **Acceptance Criteria:**
  1. **Given** a verified provider, **when** I create a technician via `POST /api/v1/providers/technicians`, **then** a `users` row (`role='technician'`) and linked `technicians` profile are created.

### US-702: Dispatching a Technician to a Confirmed Booking (5 Points)
- **Role:** Service Provider
- **Story:** As a provider, I want to assign an available technician to a `Confirmed` booking, so that the booking advances to `Provider Assigned` and appears in the technician's job queue.
- **Acceptance Criteria:**
  1. **Given** a `Confirmed` booking and an active technician belonging to my company, **when** I call `POST /api/v1/bookings/{id}/assign-technician`, **then** a `booking_assignments` record is created, booking status becomes `Provider Assigned`, and both customer and technician are notified.

### US-703: Technician On-Site Execution & Before/After Photo Upload (6 Points)
- **Role:** Technician
- **Story:** As a field technician, I want to mark my job as `Arrived`, `In Progress`, and `Completed` while uploading `before` and `after` photos (`booking_images`) and completion remarks, so that service quality is documented.
- **Acceptance Criteria:**
  1. **Given** an assigned booking, **when** I update status to `In Progress`, **then** `booking_assignments.start_time` and `bookings.status = 'In Progress'` are recorded.
  2. **Given** work is finished, **when** I mark the job `Completed` with completion remarks, **then** `bookings.status = 'Completed'`, `service_providers.total_completed_jobs` and `technicians.total_jobs_completed` increment by 1, and `provider_earnings` is generated.

---

## EPIC-08: Razorpay Payments, Commissions & GST Invoices

### US-801: Razorpay Order Creation & HMAC-SHA256 Payment Verification (8 Points)
- **Role:** Customer
- **Story:** As a customer, I want to pay securely via Razorpay (UPI, Card, NetBanking) with idempotency protection, so that my payment is verified and receipted immediately.
- **Acceptance Criteria:**
  1. **Given** an active booking, **when** I call `POST /api/v1/payments/create-order`, **then** a `payments` row is created with a unique `razorpay_order_id` and `idempotency_key`.
  2. **Given** payment completion on the client or webhook, **when** `POST /api/v1/payments/verify` validates the `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)` signature, **then** `payments.status` becomes `Paid` and `paid_at` is timestamped.

### US-802: Automated GST Invoice Generation & Download (5 Points)
- **Role:** Customer / Service Provider
- **Story:** As a customer or provider, I want an itemized GST invoice (`invoices`) generated automatically upon payment/completion, so that I can view or download a compliant tax receipt.
- **Acceptance Criteria:**
  1. **Given** a paid booking, **when** invoice generation triggers, **then** a unique `invoice_number` (`INV-YYYY-NNNN`) is created with `subtotal`, `discount_amount`, `tax_amount` (18% GST), `total_amount`, and a JSON billing snapshot.

### US-803: Provider Commission Split & Payout Ledger (8 Points)
- **Role:** Service Provider / Admin
- **Story:** As a provider, I want transparent tracking of gross booking amounts, platform commissions, and net earnings (`provider_earnings`), so that I can reconcile my payouts.
- **Acceptance Criteria:**
  1. **Given** a booking with `base_amount = ₹699`, `discount = ₹139.80` (net service value `₹559.20`), and provider `commission_rate = 12%`, **when** earnings are calculated, **then** `commission_amount = ₹67.10` and `net_earning = ₹492.10` are recorded in `provider_earnings`.

---

## EPIC-09: Verified Reviews, Favorites & Dispute Tickets

### US-901: Verified Post-Completion Rating & Provider Response (5 Points)
- **Role:** Customer / Service Provider
- **Story:** As a customer, I want to leave a 1–5 star rating and review once my booking is `Completed`, and as a provider, I want to post an official reply.
- **Acceptance Criteria:**
  1. **Given** a booking with `status = 'Completed'`, **when** the customer submits `POST /api/v1/reviews`, **then** the review is saved (`UNIQUE(booking_id)`) and `service_providers.avg_rating` and `total_reviews` are recalculated atomically.
  2. **Given** a booking that is NOT `Completed`, **when** a customer attempts to review it, **then** the API rejects the request with HTTP `400 Bad Request`.

### US-902: Customer & Provider Complaint Ticketing (5 Points)
- **Role:** Customer / Service Provider
- **Story:** As a customer or provider experiencing an issue with a booking, I want to raise a support complaint (`complaints`) with a priority level, so that an Admin can mediate and resolve the dispute.
- **Acceptance Criteria:**
  1. **Given** an existing booking, **when** I submit `POST /api/v1/complaints`, **then** a ticket (`TKT-YYYY-NNN`) is created in `Open` status.

### US-903: Admin Review Moderation & Complaint Resolution (3 Points)
- **Role:** Admin
- **Story:** As an Admin, I want to resolve open complaint tickets with resolution notes and hide abusive reviews (`moderation_status = 'hidden'`), so that marketplace trust is maintained.
- **Acceptance Criteria:**
  1. **Given** an `Open` complaint, **when** Admin submits `PATCH /api/v1/complaints/{id}/resolve`, **then** `status` updates to `Resolved`, `resolved_by_user_id` and `resolved_at` are recorded, and the complainant is notified.

---

## EPIC-10: Real-Time Notifications & Role Dashboards

### US-1001: In-App Notification Center with Unread Badges (5 Points)
- **Role:** All Roles
- **Story:** As a platform user, I want to receive in-app notifications (`notifications`) for booking confirmations, technician assignments, payments, and KYC updates, and mark them as read.
- **Acceptance Criteria:**
  1. **Given** unread notifications exist, **when** I call `GET /api/v1/notifications` and `PATCH /api/v1/notifications/{id}/read`, **then** my unread counter updates accurately.

### US-1002: Role-Specific KPI & Analytics Dashboards (8 Points)
- **Role:** Admin / Service Provider / Customer / Technician
- **Story:** As any authenticated user, I want a tailored dashboard showing my key metrics, charts, and upcoming actions immediately after login.
- **Acceptance Criteria:**
  1. **Admin Dashboard:** Total GMV, platform commission revenue, active users by role, pending KYC queue, booking status breakdown, and open complaints.
  2. **Provider Dashboard:** Net earnings, completed jobs, average rating, upcoming bookings awaiting technician dispatch, and technician availability roster.
  3. **Technician Dashboard:** Today's assigned field jobs, current active job timer, before/after photo uploader, and completed job history.
  4. **Customer Dashboard:** Active bookings tracker, quick re-book, loyalty points balance, saved addresses, and downloadable GST invoices.
