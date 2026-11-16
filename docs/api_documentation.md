# HomeServe – REST API Reference Documentation (`/api/v1`)

> [!IMPORTANT]
> **Base URL (Local):** `http://localhost:8000/api/v1`  
> **Interactive OpenAPI Swagger UI:** `http://localhost:8000/docs`  
> **ReDoc Specification:** `http://localhost:8000/redoc`  
> **Authentication:** Bearer JWT (`Authorization: Bearer <access_token>`)

---

## 1. Standard API Response & Error Envelope

All endpoints return structured JSON responses with consistent HTTP status codes:
- `200 OK` / `201 Created`: Successful operation
- `400 Bad Request`: Business rule violation (e.g., invalid state transition, expired coupon)
- `401 Unauthorized`: Missing, invalid, or expired JWT / credentials
- `403 Forbidden`: Insufficient RBAC role or resource ownership violation
- `404 Not Found`: Requested entity ID does not exist
- `409 Conflict`: Duplicate resource or double-booked time slot
- `422 Unprocessable Entity`: Pydantic request schema validation error

---

## 2. Authentication & Session Endpoints (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new `customer`, `provider`, or `technician` account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email & password; receive JWT + refresh token |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token and issue a fresh JWT access token |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke active refresh token in database |
| `GET` | `/api/v1/auth/me` | Bearer | Get current authenticated user profile and role metadata |
| `PUT` | `/api/v1/auth/me` | Bearer | Update current user's name, phone, or avatar URL |
| `POST` | `/api/v1/auth/forgot-password` | Public | Generate a single-use password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password using a valid reset token |

### Example: `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "priya.sharma@example.com",
  "password": "Password@123"
}
```

**Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "full_name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "phone": "+919811110001",
    "role": "customer",
    "is_active": true,
    "is_email_verified": true
  }
}
```

---

## 3. Service Catalog & Discovery Endpoints (`/api/v1/categories`, `/api/v1/services`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | List all 10 active service categories ordered by `display_order` |
| `POST` | `/api/v1/categories` | Admin | Create a new service category or subcategory |
| `PUT` | `/api/v1/categories/{id}` | Admin | Update a service category |
| `DELETE` | `/api/v1/categories/{id}` | Admin | Soft-delete or remove a service category |
| `GET` | `/api/v1/services` | Public | Search & filter services (`category_id`, `search`, `min_price`, `max_price`, `is_featured`) |
| `GET` | `/api/v1/services/{id}` | Public | Get detailed service info, inclusions, exclusions, and verified providers |
| `POST` | `/api/v1/services` | Admin | Create a new bookable service |
| `PUT` | `/api/v1/services/{id}` | Admin | Update service pricing, duration, or inclusions |
| `DELETE` | `/api/v1/services/{id}` | Admin | Deactivate a service |

---

## 4. Customer Profile, Addresses & Favorites (`/api/v1/customers`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers/profile` | Customer | Retrieve customer profile, loyalty points, saved addresses & favorites |
| `GET` | `/api/v1/customers/addresses` | Customer | List all saved addresses for the logged-in customer |
| `POST` | `/api/v1/customers/addresses` | Customer | Add a new address (automatically toggles default if `is_default=true`) |
| `PUT` | `/api/v1/customers/addresses/{id}` | Customer | Update an existing customer address |
| `DELETE` | `/api/v1/customers/addresses/{id}` | Customer | Delete a saved address |
| `GET` | `/api/v1/customers/favorites` | Customer | List bookmarked favorite service providers |
| `POST` | `/api/v1/customers/favorites/{provider_id}` | Customer | Toggle a provider in customer's favorites |

---

## 5. Service Provider, Slots & Technician Management (`/api/v1/providers`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/providers` | Public | List verified & available service providers (`city`, `service_id`, `min_rating`) |
| `GET` | `/api/v1/providers/{id}` | Public | Get provider public profile, services offered, working hours, slots & reviews |
| `GET` | `/api/v1/providers/me/dashboard` | Provider | Provider KPI summary, earnings ledger, upcoming jobs & technician roster |
| `PUT` | `/api/v1/providers/me/profile` | Provider | Update business profile, KYC document URL, license number & availability |
| `POST` | `/api/v1/providers/me/services` | Provider | Map a catalog service to the provider with custom price & duration |
| `POST` | `/api/v1/providers/me/areas` | Provider | Add a serviceable city/postal code and radius |
| `POST` | `/api/v1/providers/me/working-hours` | Provider | Set weekly working schedule (`0=Monday .. 6=Sunday`) |
| `GET` | `/api/v1/providers/{id}/slots` | Public | List available time slots for a provider on a target date |
| `POST` | `/api/v1/providers/me/slots` | Provider | Publish availability time slots (`slot_date`, `start_time`, `end_time`) |
| `GET` | `/api/v1/providers/me/technicians` | Provider | List technicians managed by the logged-in provider |
| `POST` | `/api/v1/providers/me/technicians` | Provider | Onboard a new field technician under the provider's organization |
| `GET` | `/api/v1/providers/me/earnings` | Provider | View itemized commission and payout ledger (`provider_earnings`) |
| `POST` | `/api/v1/providers/me/subscriptions` | Provider | Subscribe or upgrade SaaS tier (`Starter`, `Professional`, `Enterprise`) |

---

## 6. Bookings & Technician Dispatch Lifecycle (`/api/v1/bookings`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings` | Customer | Create a new booking with atomic slot locking and tax/coupon calculation |
| `GET` | `/api/v1/bookings` | Bearer | List bookings filtered by role (`customer` own, `provider` assigned, `technician` dispatched, `admin` all) |
| `GET` | `/api/v1/bookings/{id}` | Bearer | Get full booking details, status audit history, assignment, photos & invoice |
| `PATCH` | `/api/v1/bookings/{id}/status` | Bearer | Transition booking status (`Confirmed`, `In Progress`, `Completed`, `Cancelled`, `Rejected`) |
| `POST` | `/api/v1/bookings/{id}/assign-technician` | Provider / Admin | Dispatch a technician (`booking_assignments`) and set status to `Provider Assigned` |
| `POST` | `/api/v1/bookings/{id}/images` | Bearer | Attach `reference`, `before`, `after`, or `issue` photo URL to a booking |

### Example: `POST /api/v1/bookings`

**Request Body:**
```json
{
  "provider_id": 1,
  "service_id": 1,
  "address_id": 1,
  "appointment_date": "2026-11-25",
  "appointment_time": "10:00 AM",
  "problem_description": "Main MCB trips whenever AC and geyser run together.",
  "reference_image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500",
  "coupon_code": "WELCOME20"
}
```

**Response (`201 Created`):**
```json
{
  "id": 6,
  "booking_reference": "HS-2026-10006",
  "status": "Pending",
  "appointment_date": "2026-11-25",
  "appointment_time": "10:00 AM",
  "base_amount": 699.0,
  "discount_amount": 139.8,
  "tax_amount": 100.66,
  "total_amount": 659.86,
  "commission_amount": 67.1,
  "provider_earning_amount": 492.1,
  "coupon_code": "WELCOME20"
}
```

---

## 7. Payments, Coupons & GST Invoices (`/api/v1/payments`, `/api/v1/coupons`, `/api/v1/invoices`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/coupons/validate` | Bearer | Validate a promo code against order subtotal and return calculated discount |
| `GET` | `/api/v1/coupons` | Public | List active promotional coupons |
| `POST` | `/api/v1/coupons` | Admin | Create a new promotional coupon (`percentage` or `fixed`) |
| `POST` | `/api/v1/payments/create-order` | Customer | Create an idempotent Razorpay payment order for a booking |
| `POST` | `/api/v1/payments/verify` | Customer | Verify Razorpay `HMAC-SHA256` signature, mark payment `Paid` & generate invoice |
| `POST` | `/api/v1/payments/webhook` | Public (HMAC) | Idempotent Razorpay server webhook listener (`payment_webhook_events`) |
| `POST` | `/api/v1/payments/{id}/refund` | Admin | Process full/partial refund and record `refund_reason` |
| `GET` | `/api/v1/invoices/{booking_id}` | Bearer | Retrieve itemized GST invoice JSON & downloadable receipt metadata |

---

## 8. Reviews, Complaints, Notifications & Admin Analytics

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reviews` | Customer | Submit a 1–5 star rating & review for a `Completed` booking |
| `GET` | `/api/v1/reviews/provider/{provider_id}` | Public | List approved customer reviews for a service provider |
| `PATCH` | `/api/v1/reviews/{id}/respond` | Provider | Post provider response to a customer review |
| `PATCH` | `/api/v1/reviews/{id}/moderate` | Admin | Update review `moderation_status` (`approved`, `flagged`, `hidden`) |
| `POST` | `/api/v1/complaints` | Bearer | Raise a dispute/support ticket (`TKT-YYYY-NNN`) linked to a booking |
| `GET` | `/api/v1/complaints` | Bearer | List complaints (user's own or all for Admin) |
| `PATCH` | `/api/v1/complaints/{id}/resolve` | Admin | Resolve or close a complaint with `admin_resolution` notes |
| `GET` | `/api/v1/notifications` | Bearer | List in-app notifications for the current user |
| `PATCH` | `/api/v1/notifications/{id}/read` | Bearer | Mark a notification (or all notifications) as read |
| `GET` | `/api/v1/admin/analytics` | Admin | Platform-wide GMV, commission revenue, booking breakdown & KYC queue |
| `PATCH` | `/api/v1/admin/providers/{id}/verify` | Admin | Approve (`verified`) or reject (`rejected`) a service provider's KYC |
| `PATCH` | `/api/v1/admin/users/{id}/status` | Admin | Activate or suspend (`is_active`) any user account |
