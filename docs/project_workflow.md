# HomeServe – System Workflows & Sequence Diagrams

> [!NOTE]
> This document details the core operational state machines, sequence diagrams, and concurrency safeguards powering **HomeServe**.

---

## 1. Authentication & Stateful Refresh Token Rotation Workflow

HomeServe implements a dual-token authentication architecture:
- **Access Token (JWT):** Short-lived (`30 minutes`), signed with `HS256`, carrying `sub` (user ID), `email`, and `role`.
- **Refresh Token:** Stateful token (`7 days`) whose SHA-256 hash is stored in the `refresh_tokens` table alongside `user_agent` and `ip_address`. Every refresh request atomically revokes the used refresh token (`is_revoked = TRUE`) and issues a new token pair.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React SPA)
    participant API as FastAPI Auth Router
    participant DB as MySQL 8.0 (users / refresh_tokens)

    User->>API: POST /api/v1/auth/login {email, password}
    API->>DB: SELECT * FROM users WHERE email = ?
    DB-->>API: User record + password_hash
    API->>API: Verify bcrypt(password, password_hash)
    API->>API: Generate JWT Access Token (30m) + Refresh Token (7d)
    API->>DB: INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address)
    API-->>User: 200 OK {access_token, refresh_token, user}

    Note over User,API: Access Token expires after 30 minutes
    User->>API: POST /api/v1/auth/refresh {refresh_token}
    API->>DB: SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = FALSE
    alt Valid & Unexpired Refresh Token
        API->>DB: UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = ?
        API->>DB: INSERT INTO refresh_tokens (new_token_hash, expires_at)
        API-->>User: 200 OK {new_access_token, new_refresh_token}
    else Revoked or Expired Token
        API-->>User: 401 Unauthorized (Session Expired)
    end
```

---

## 2. Service Provider Onboarding & Admin KYC Verification Flow

Service providers register and upload KYC documentation (`id_document_url`, `license_number`). Until an Administrator approves the profile (`verification_status = 'verified'`), the provider cannot receive public customer bookings.

```mermaid
flowchart LR
    A["Provider Registers Account"] --> B["Completes Business Profile & Uploads KYC Docs"]
    B --> C{"Admin KYC Review"}
    C -->|Approve| D["verification_status = 'verified'"]
    C -->|Reject + Reason| E["verification_status = 'rejected'"]
    E -->|Re-upload Updated KYC| B
    D --> F["Configure Provider Services & Custom Pricing"]
    F --> G["Set Working Hours, Service Areas & Availability Slots"]
    G --> H["Live in Public Marketplace & Eligible for Bookings"]
```

---

## 3. End-to-End Booking & Double-Booking Prevention Workflow

To prevent two customers from booking the same provider for the same date and time slot simultaneously, HomeServe checks both `availability_slots` (`UNIQUE(provider_id, slot_date, start_time)`) and active `bookings` (`status NOT IN ('Cancelled', 'Rejected')`) inside a single database transaction.

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant API as FastAPI Booking Engine
    participant DB as MySQL 8.0 (InnoDB Transaction)
    actor Prov as Service Provider

    Cust->>API: POST /api/v1/bookings {provider_id, service_id, address_id, date, time, coupon_code}
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT * FROM bookings WHERE provider_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ('Cancelled','Rejected') FOR UPDATE
    alt Slot Already Booked
        DB-->>API: Existing active booking found
        API->>DB: ROLLBACK
        API-->>Cust: 409 Conflict ("Selected time slot is no longer available")
    else Slot Available
        API->>API: Validate coupon, compute 18% GST, commission & net provider earning
        API->>DB: UPDATE availability_slots SET is_booked = TRUE
        API->>DB: INSERT INTO bookings (booking_reference='HS-2026-XXXXX', status='Pending', ...)
        API->>DB: INSERT INTO booking_status_history (old_status=NULL, new_status='Pending')
        API->>DB: INSERT INTO notifications (user_id=provider.user_id, ...)
        API->>DB: COMMIT
        API-->>Cust: 201 Created {booking_reference, total_amount, status: 'Pending'}
        API-->>Prov: In-App Notification ("New Booking Request")
    end
```

---

## 4. Booking & Technician Field Execution State Machine

Every booking progresses through a strictly validated state machine. Invalid state jumps (e.g., jumping from `Pending` directly to `Completed`) are blocked with HTTP `400 Bad Request`.

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer Creates Booking
    Pending --> Confirmed : Provider Accepts
    Pending --> Rejected : Provider Declines (Slot Released)
    Pending --> Cancelled : Customer Cancels (Slot Released)
    Confirmed --> Provider_Assigned : Provider Dispatches Technician
    Confirmed --> Cancelled : Customer/Provider Cancels (Slot Released)
    Provider_Assigned --> In_Progress : Technician Arrives & Starts Job (Before Photo)
    In_Progress --> Completed : Technician Finishes Job (After Photo + Remarks)
    Completed --> [*] : Earnings Credited, Invoice & Review Unlocked
    Rejected --> [*]
    Cancelled --> [*]
```

---

## 5. Razorpay Payment, HMAC-SHA256 Verification & Webhook Idempotency

HomeServe supports both client-side checkout callback verification and asynchronous Razorpay server-to-server webhooks (`payment.captured`).

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer Browser
    participant API as FastAPI Payment Router
    participant RZP as Razorpay Gateway
    participant DB as MySQL 8.0

    Cust->>API: POST /api/v1/payments/create-order {booking_id, payment_type: "full"}
    API->>DB: Check existing idempotency_key / create payments row (status='Pending')
    API-->>Cust: 201 Created {razorpay_order_id, amount, currency: "INR", key_id}

    Cust->>RZP: Complete UPI / Card Checkout
    RZP-->>Cust: {razorpay_order_id, razorpay_payment_id, razorpay_signature}

    Cust->>API: POST /api/v1/payments/verify {order_id, payment_id, signature}
    API->>API: Compute HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
    alt Signature Matches
        API->>DB: UPDATE payments SET status='Paid', paid_at=NOW()
        API->>DB: INSERT INTO invoices (invoice_number, subtotal, tax_amount, total_amount)
        API->>DB: INSERT INTO provider_earnings (gross_amount, commission_amount, net_earning)
        API-->>Cust: 200 OK {payment_status: "Paid", invoice_number}
    else Invalid Signature
        API->>DB: UPDATE payments SET status='Failed'
        API-->>Cust: 400 Bad Request ("Invalid payment signature")
    end

    Note over RZP,API: Asynchronous Webhook Delivery (Idempotent Replay Protection)
    RZP->>API: POST /api/v1/payments/webhook (Header: X-Razorpay-Signature)
    API->>DB: SELECT * FROM payment_webhook_events WHERE event_id = ?
    alt Event Already Processed
        API-->>RZP: 200 OK {"status": "already_processed"}
    else New Webhook Event
        API->>DB: INSERT INTO payment_webhook_events (event_id, event_type, payload_json)
        API->>DB: Ensure payment status='Paid' & invoice exists
        API-->>RZP: 200 OK {"status": "processed"}
    end
```

---

## 6. Customer Dispute & Admin Complaint Resolution Workflow

```mermaid
flowchart TD
    A["Customer or Provider Raises Complaint Ticket (POST /api/v1/complaints)"] --> B["Ticket Assigned Unique ID (TKT-2026-XXX) & Priority (Low/Medium/High/Critical)"]
    B --> C["Status = 'Open' | Notification Sent to Admin"]
    C --> D["Admin Investigates Booking History, Before/After Photos & Technician Remarks"]
    D --> E["Status = 'In Review'"]
    E --> F{"Admin Decision"}
    F -->|Issue Refund / Partial Credit| G["Trigger Payment Refund & Record Admin Resolution"]
    F -->|Operational Resolution / Warning| H["Record Admin Resolution Notes"]
    G & H --> I["Status = 'Resolved' -> Notifies Complainant & Provider"]
    I --> J["Status = 'Closed'"]
```
