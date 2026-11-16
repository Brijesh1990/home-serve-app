import uuid
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from app.core.security import generate_razorpay_signature
from app.database.base import Base
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _login(client: TestClient, email: str, password: str = "Password@123"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_health_and_28_tables(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert len(Base.metadata.tables) == 28
    assert data["tables_registered"] == 28


def test_auth_flow_and_rbac(client: TestClient):
    # 1. Seeded logins across all 4 roles
    admin_auth = _login(client, "admin@homeserve.com")
    cust_auth = _login(client, "customer@homeserve.com")
    prov_auth = _login(client, "provider@homeserve.com")
    tech_auth = _login(client, "tech@homeserve.com")

    assert admin_auth["user"]["role"] == "admin"
    assert cust_auth["user"]["role"] == "customer"
    assert prov_auth["user"]["role"] == "provider"
    assert tech_auth["user"]["role"] == "technician"

    # 2. Register new customer
    unique_email = f"test_cust_{uuid.uuid4().hex[:6]}@homeserve.com"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Karan Malhotra",
            "email": unique_email,
            "phone": "+91 9811122233",
            "password": "Password@123",
            "role": "customer",
            "city": "Mumbai",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert "refresh_token" in reg_data
    assert reg_data["user"]["email"] == unique_email

    # 3. /auth/me verification
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {reg_data['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == unique_email

    # 4. Refresh token rotation
    ref_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": reg_data["refresh_token"]},
    )
    assert ref_resp.status_code == 200
    assert "access_token" in ref_resp.json()

    # 5. Unauthorized access rejected
    unauth = client.get("/api/v1/auth/me")
    assert unauth.status_code == 401

    # 6. RBAC: Customer cannot access Admin-only user list
    forbidden = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {cust_auth['access_token']}"},
    )
    assert forbidden.status_code == 403

    # Admin can access user list
    allowed = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_auth['access_token']}"},
    )
    assert allowed.status_code == 200
    assert len(allowed.json()) >= 8


def test_categories_and_services_crud(client: TestClient):
    admin_token = _login(client, "admin@homeserve.com")["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # List 10 seeded categories
    cats_resp = client.get("/api/v1/categories")
    assert cats_resp.status_code == 200
    cats = cats_resp.json()
    assert len(cats) >= 10

    # Create a new category
    unique_cat = f"Smart Home Automation {uuid.uuid4().hex[:4]}"
    create_cat = client.post(
        "/api/v1/categories",
        headers=headers,
        json={
            "name": unique_cat,
            "description": "IoT switches, smart curtains & video doorbells",
            "icon_name": "Cpu",
            "display_order": 11,
        },
    )
    assert create_cat.status_code == 201
    cat_id = create_cat.json()["id"]

    # Create a service in that category
    create_svc = client.post(
        "/api/v1/services",
        headers=headers,
        json={
            "category_id": cat_id,
            "name": f"WiFi Video Doorbell Setup {uuid.uuid4().hex[:4]}",
            "short_description": "Smart doorbell wiring & mobile app pairing",
            "base_price": 899.0,
            "duration_minutes": 45,
            "inclusions": ["Mounting", "WiFi pairing", "Testing"],
            "is_featured": True,
        },
    )
    assert create_svc.status_code == 201
    svc_id = create_svc.json()["id"]

    # Update service
    upd_svc = client.put(
        f"/api/v1/services/{svc_id}",
        headers=headers,
        json={
            "category_id": cat_id,
            "name": "WiFi Video Doorbell Pro Setup",
            "base_price": 999.0,
            "duration_minutes": 60,
        },
    )
    assert upd_svc.status_code == 200
    assert upd_svc.json()["base_price"] == 999.0

    # Delete service and category
    assert client.delete(f"/api/v1/services/{svc_id}", headers=headers).status_code == 200
    assert client.delete(f"/api/v1/categories/{cat_id}", headers=headers).status_code == 200


def test_provider_verification_and_listing(client: TestClient):
    admin_token = _login(client, "admin@homeserve.com")["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    provs = client.get("/api/v1/providers").json()
    assert len(provs) >= 3

    # Register a new provider (starts as pending)
    prov_email = f"prov_{uuid.uuid4().hex[:5]}@homeserve.com"
    reg_prov = client.post(
        "/api/v1/providers/register",
        json={
            "full_name": "Deepak Verma",
            "email": prov_email,
            "phone": "+91 9899001122",
            "password": "Password@123",
            "role": "provider",
            "business_name": "MetroVolt Electricals",
            "category_specialization": "Electrical Services",
            "city": "Delhi",
            "experience_years": 6,
        },
    )
    assert reg_prov.status_code == 201
    new_prov_id = reg_prov.json()["user"]["provider_id"]

    # Admin verifies provider
    ver_resp = client.patch(f"/api/v1/providers/{new_prov_id}/verify", headers=headers)
    assert ver_resp.status_code == 200
    assert ver_resp.json()["verification_status"] == "verified"

    # Admin rejects provider with reason and re-verifies
    rej_resp = client.patch(
        f"/api/v1/providers/{new_prov_id}/reject",
        headers=headers,
        json={"rejection_reason": "License scan blurry"},
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["verification_status"] == "rejected"
    assert rej_resp.json()["rejection_reason"] == "License scan blurry"

    client.patch(f"/api/v1/providers/{new_prov_id}/verify", headers=headers)


def test_booking_pricing_coupon_and_double_booking_prevention(client: TestClient):
    cust_token = _login(client, "customer@homeserve.com")["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    services = client.get("/api/v1/services").json()
    target_service = services[0]  # Split AC Foam-Jet Deep Service (699.0)
    providers = client.get("/api/v1/providers?verification_status=verified").json()
    target_provider = providers[0]

    # 1. Validate coupon WELCOME20 (20% off)
    val_resp = client.post(
        "/api/v1/coupons/validate",
        json={"code": "WELCOME20", "order_amount": 1000.0},
    )
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["valid"] is True
    assert val_data["discount_amount"] == 200.0
    # Taxable = 800, 18% GST = 144, Final = 944
    assert val_data["tax_amount"] == 144.0
    assert val_data["final_amount"] == 944.0

    # 2. Create booking on a unique future date + slot
    future_date = (date.today() + timedelta(days=200 + int(uuid.uuid4().hex[:3], 16) % 500)).isoformat()
    slot_time = f"10:{int(uuid.uuid4().hex[:2], 16) % 50 + 10:02d} AM"

    bk_resp = client.post(
        "/api/v1/bookings",
        headers=cust_headers,
        json={
            "service_id": target_service["id"],
            "provider_id": target_provider["id"],
            "appointment_date": future_date,
            "appointment_time": slot_time,
            "problem_description": "Test AC jet servicing with WELCOME20 coupon",
            "coupon_code": "WELCOME20",
        },
    )
    assert bk_resp.status_code == 201, bk_resp.text
    booking = bk_resp.json()
    assert booking["status"] == "Pending"
    assert booking["discount_amount"] > 0
    assert booking["tax_amount"] > 0
    assert booking["total_amount"] == round(
        booking["base_amount"] - booking["discount_amount"] + booking["tax_amount"], 2
    )

    # 3. Attempt DOUBLE BOOKING for the same provider + date + time slot -> MUST fail with 409!
    dup_resp = client.post(
        "/api/v1/bookings",
        headers=cust_headers,
        json={
            "service_id": target_service["id"],
            "provider_id": target_provider["id"],
            "appointment_date": future_date,
            "appointment_time": slot_time,
            "problem_description": "Duplicate slot booking attempt",
        },
    )
    assert dup_resp.status_code in (400, 409), dup_resp.text


def test_technician_assignment_and_lifecycle_progression(client: TestClient):
    cust_token = _login(client, "customer@homeserve.com")["access_token"]
    prov_token = _login(client, "provider@homeserve.com")["access_token"]
    tech_token = _login(client, "tech@homeserve.com")["access_token"]

    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    prov_headers = {"Authorization": f"Bearer {prov_token}"}
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    services = client.get("/api/v1/services").json()
    providers = client.get("/api/v1/providers?verification_status=verified").json()
    techs = client.get("/api/v1/technicians", headers=prov_headers).json()
    assert len(techs) >= 1
    tech_id = techs[0]["id"]

    future_date = (date.today() + timedelta(days=750 + int(uuid.uuid4().hex[:3], 16) % 500)).isoformat()
    unique_slot = f"04:{int(uuid.uuid4().hex[:2], 16) % 50 + 10:02d} PM"
    bk_resp = client.post(
        "/api/v1/bookings",
        headers=cust_headers,
        json={
            "service_id": services[2]["id"],
            "provider_id": providers[0]["id"],
            "appointment_date": future_date,
            "appointment_time": unique_slot,
            "problem_description": "MCB tripping test for full technician lifecycle",
        },
    )
    assert bk_resp.status_code == 201
    booking_id = bk_resp.json()["id"]

    # Assign technician
    assign_resp = client.post(
        "/api/v1/assignments",
        headers=prov_headers,
        json={"booking_id": booking_id, "technician_id": tech_id},
    )
    assert assign_resp.status_code == 201, assign_resp.text
    assignment_id = assign_resp.json()["assignment"]["id"]
    assert assign_resp.json()["booking"]["status"] == "Provider Assigned"

    # Technician progresses job: Accepted -> Arrived -> In Progress -> Completed
    for step_status in ["Accepted", "Arrived", "In Progress"]:
        r = client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            headers=tech_headers,
            json={"assignment_status": step_status},
        )
        assert r.status_code == 200
        assert r.json()["assignment"]["assignment_status"] == step_status

    comp_resp = client.patch(
        f"/api/v1/assignments/{assignment_id}/status",
        headers=tech_headers,
        json={
            "assignment_status": "Completed",
            "completion_remarks": "Replaced faulty 32A MCB and tested load.",
            "before_image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
            "after_image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
        },
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["booking"]["status"] == "Completed"
    assert len(comp_resp.json()["booking"]["images"]) >= 2

    # Verify Payment order creation + HMAC verification + Invoice + Review creation
    order_resp = client.post(
        "/api/v1/payments/create-order",
        headers=cust_headers,
        json={"booking_id": booking_id, "payment_type": "full"},
    )
    assert order_resp.status_code == 200
    order_data = order_resp.json()
    rzp_order_id = order_data["razorpay_order_id"]
    rzp_pay_id = "pay_HS_verified_999"
    valid_sig = generate_razorpay_signature(rzp_order_id, rzp_pay_id)

    ver_resp = client.post(
        "/api/v1/payments/verify",
        headers=cust_headers,
        json={
            "booking_id": booking_id,
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_pay_id,
            "razorpay_signature": valid_sig,
        },
    )
    assert ver_resp.status_code == 200
    ver_json = ver_resp.json()
    assert ver_json["verified"] is True
    assert ver_json["payment"]["status"] == "Paid"
    assert ver_json["invoice"]["invoice_number"].startswith("INV-")

    # Customer submits review on Completed booking
    rev_resp = client.post(
        "/api/v1/reviews",
        headers=cust_headers,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Outstanding and prompt electrical repair!",
        },
    )
    assert rev_resp.status_code == 201
    assert rev_resp.json()["rating"] == 5

    # Duplicate review on same booking is prevented (409)
    dup_rev = client.post(
        "/api/v1/reviews",
        headers=cust_headers,
        json={"booking_id": booking_id, "rating": 4, "comment": "Duplicate"},
    )
    assert dup_rev.status_code == 409


def test_complaints_analytics_and_csv_exports(client: TestClient):
    cust_token = _login(client, "customer@homeserve.com")["access_token"]
    admin_token = _login(client, "admin@homeserve.com")["access_token"]
    prov_token = _login(client, "provider@homeserve.com")["access_token"]

    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    # 1. Customer raises complaint
    comp_resp = client.post(
        "/api/v1/complaints",
        headers=cust_headers,
        json={
            "category": "Billing",
            "subject": "Clarification on GST invoice line item",
            "description": "Need GSTIN mentioned on the invoice PDF.",
            "priority": "Medium",
        },
    )
    assert comp_resp.status_code == 201
    comp_id = comp_resp.json()["id"]

    # 2. Admin resolves complaint
    res_resp = client.patch(
        f"/api/v1/complaints/{comp_id}/resolve",
        headers=admin_headers,
        json={
            "status": "Resolved",
            "admin_resolution": "Updated GSTIN on invoice and emailed copy.",
        },
    )
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "Resolved"

    # 3. Role-specific analytics
    adm_analytics = client.get("/api/v1/analytics/admin", headers=admin_headers)
    assert adm_analytics.status_code == 200
    assert adm_analytics.json()["total_bookings"] >= 6

    prov_analytics = client.get("/api/v1/analytics/provider", headers=prov_headers)
    assert prov_analytics.status_code == 200
    assert "total_earnings" in prov_analytics.json()

    cust_analytics = client.get("/api/v1/analytics/customer", headers=cust_headers)
    assert cust_analytics.status_code == 200
    assert "total_bookings" in cust_analytics.json()

    # 4. CSV exports
    bk_csv = client.get("/api/v1/reports/bookings/export", headers=admin_headers)
    assert bk_csv.status_code == 200
    assert "text/csv" in bk_csv.headers["content-type"]
    assert "Booking Reference" in bk_csv.text

    rev_csv = client.get("/api/v1/reports/revenue/export", headers=admin_headers)
    assert rev_csv.status_code == 200
    assert "text/csv" in rev_csv.headers["content-type"]
    assert "Razorpay Order ID" in rev_csv.text
