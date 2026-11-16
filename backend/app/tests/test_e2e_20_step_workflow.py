"""
20-Step End-to-End (E2E) Workflow Verification Suite for HomeServe SaaS Platform.
Tests the complete lifecycle across Customer, Service Provider, Technician, and Super Admin roles
against the live FastAPI + SQLAlchemy 2.x + MySQL 8.0 database.
"""
import uuid
from datetime import date, timedelta
from fastapi.testclient import TestClient

from app.main import app


def test_complete_20_step_homeserve_e2e_scenario():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:6]
        customer_email = f"e2e.customer.{unique_suffix}@homeserve.com"
        target_date = (date.today() + timedelta(days=45 + int(unique_suffix[:2], 16) % 90)).isoformat()
        target_slot = "02:00 PM"

        # ------------------------------------------------------------------
        # STEP 1: Customer registers
        # ------------------------------------------------------------------
        reg_res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Rohan Deshmukh",
                "email": customer_email,
                "phone": f"+91 98111{int(unique_suffix[:5], 16) % 90000 + 10000}",
                "password": "Password@123",
                "role": "customer",
                "city": "Mumbai",
            },
        )
        assert reg_res.status_code == 201, reg_res.text
        assert reg_res.json()["user"]["role"] == "customer"

        # ------------------------------------------------------------------
        # STEP 2: Customer logs in
        # ------------------------------------------------------------------
        cust_login = client.post(
            "/api/v1/auth/login",
            json={"email": customer_email, "password": "Password@123"},
        )
        assert cust_login.status_code == 200
        cust_token = cust_login.json()["access_token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # ------------------------------------------------------------------
        # STEP 3: Customer searches for a plumber / plumbing service
        # ------------------------------------------------------------------
        search_res = client.get("/api/v1/services?search=Pipe")
        assert search_res.status_code == 200
        services = search_res.json()
        if not services:
            services = client.get("/api/v1/services").json()
        assert len(services) > 0

        # ------------------------------------------------------------------
        # STEP 4: Customer selects a service
        # ------------------------------------------------------------------
        selected_service = services[0]
        svc_detail_res = client.get(f"/api/v1/services/{selected_service['id']}")
        assert svc_detail_res.status_code == 200
        service_id = svc_detail_res.json()["id"]

        # ------------------------------------------------------------------
        # STEP 5: Customer selects a verified provider
        # ------------------------------------------------------------------
        prov_list_res = client.get("/api/v1/providers?verification_status=verified")
        assert prov_list_res.status_code == 200
        verified_providers = prov_list_res.json()
        assert len(verified_providers) > 0
        # Select Apex Home Solutions (provider@homeserve.com)
        apex_provider = next(
            (p for p in verified_providers if p.get("email") == "provider@homeserve.com"),
            verified_providers[0],
        )
        provider_id = apex_provider["id"]

        # ------------------------------------------------------------------
        # STEP 6: Customer selects a date and time & checks availability
        # ------------------------------------------------------------------
        avail_res = client.get(
            f"/api/v1/availability/check?provider_id={provider_id}&scheduled_date={target_date}&time_slot={target_slot}"
        )
        assert avail_res.status_code == 200
        assert avail_res.json()["available"] is True

        # ------------------------------------------------------------------
        # STEP 7: Customer creates a booking
        # ------------------------------------------------------------------
        booking_res = client.post(
            "/api/v1/bookings",
            headers=cust_headers,
            json={
                "service_id": service_id,
                "provider_id": provider_id,
                "scheduled_date": target_date,
                "time_slot": target_slot,
                "problem_description": "Main kitchen sink pipe leaking and needs pressure valve replacement",
                "address_line": "502, Sea Breeze Apartments, Worli",
                "city": "Mumbai",
                "postal_code": "400018",
                "coupon_code": "WELCOME20",
            },
        )
        assert booking_res.status_code == 201, booking_res.text
        booking_data = booking_res.json()
        booking_id = booking_data["id"]
        assert booking_data["status"] == "Pending"
        assert booking_data["discount_amount"] > 0

        # ------------------------------------------------------------------
        # STEP 8: Provider logs in and receives a notification
        # ------------------------------------------------------------------
        prov_login = client.post(
            "/api/v1/auth/login",
            json={"email": "provider@homeserve.com", "password": "Password@123"},
        )
        assert prov_login.status_code == 200
        prov_headers = {"Authorization": f"Bearer {prov_login.json()['access_token']}"}

        prov_notifs = client.get("/api/v1/notifications", headers=prov_headers)
        assert prov_notifs.status_code == 200
        assert any(booking_data["booking_reference"] in n["title"] for n in prov_notifs.json())

        # ------------------------------------------------------------------
        # STEP 9: Provider accepts the booking
        # ------------------------------------------------------------------
        accept_res = client.patch(
            f"/api/v1/bookings/{booking_id}/status",
            headers=prov_headers,
            json={"status": "Confirmed", "notes": "Confirmed by Apex Home Solutions dispatch desk"},
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "Confirmed"

        # ------------------------------------------------------------------
        # STEP 10: Provider assigns a technician
        # ------------------------------------------------------------------
        techs_res = client.get("/api/v1/technicians", headers=prov_headers)
        assert techs_res.status_code == 200
        tech_id = techs_res.json()[0]["id"]

        assign_res = client.post(
            "/api/v1/assignments",
            headers=prov_headers,
            json={
                "booking_id": booking_id,
                "technician_id": tech_id,
                "notes": "Priority plumbing repair dispatch",
            },
        )
        assert assign_res.status_code == 201, assign_res.text
        assignment_id = assign_res.json()["assignment"]["id"]
        assert assign_res.json()["booking"]["status"] == "Provider Assigned"

        # ------------------------------------------------------------------
        # STEP 11: Technician logs in and accepts the assignment
        # ------------------------------------------------------------------
        tech_login = client.post(
            "/api/v1/auth/login",
            json={"email": "tech@homeserve.com", "password": "Password@123"},
        )
        assert tech_login.status_code == 200
        tech_headers = {"Authorization": f"Bearer {tech_login.json()['access_token']}"}

        step11 = client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            headers=tech_headers,
            json={"status": "Accepted"},
        )
        assert step11.status_code == 200
        assert step11.json()["assignment"]["assignment_status"] == "Accepted"

        # ------------------------------------------------------------------
        # STEP 12: Technician marks arrival
        # ------------------------------------------------------------------
        step12 = client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            headers=tech_headers,
            json={"status": "Arrived"},
        )
        assert step12.status_code == 200
        assert step12.json()["assignment"]["arrival_time"] is not None

        # ------------------------------------------------------------------
        # STEP 13: Technician starts the service
        # ------------------------------------------------------------------
        step13 = client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            headers=tech_headers,
            json={"status": "In Progress"},
        )
        assert step13.status_code == 200
        assert step13.json()["booking"]["status"] == "In Progress"

        # ------------------------------------------------------------------
        # STEP 14: Technician uploads before/after completion images
        # ------------------------------------------------------------------
        step14 = client.post(
            f"/api/v1/bookings/{booking_id}/images",
            headers=tech_headers,
            json={
                "before_image_url": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
                "after_image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
                "completion_remarks": "Replaced worn brass valve and pressure-tested pipe joints.",
            },
        )
        assert step14.status_code in (200, 201)

        # ------------------------------------------------------------------
        # STEP 15: Technician completes the job
        # ------------------------------------------------------------------
        step15 = client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            headers=tech_headers,
            json={
                "status": "Completed",
                "completion_remarks": "Job completed with 30-day leak-free warranty.",
            },
        )
        assert step15.status_code == 200
        assert step15.json()["booking"]["status"] == "Completed"

        # ------------------------------------------------------------------
        # STEP 16: Customer initiates online payment order
        # ------------------------------------------------------------------
        order_res = client.post(
            "/api/v1/payments/create-order",
            headers=cust_headers,
            json={"booking_id": booking_id, "payment_type": "full", "payment_method": "Razorpay"},
        )
        assert order_res.status_code == 200
        order_payload = order_res.json()
        assert order_payload["razorpay_order_id"].startswith("order_HS_")

        # ------------------------------------------------------------------
        # STEP 17: Payment is verified via HMAC-SHA256 signature
        # ------------------------------------------------------------------
        verify_res = client.post(
            "/api/v1/payments/verify",
            headers=cust_headers,
            json={
                "booking_id": booking_id,
                "razorpay_order_id": order_payload["razorpay_order_id"],
                "razorpay_payment_id": order_payload["test_payment_id"],
                "razorpay_signature": order_payload["test_signature_hint"],
                "payment_method": "Razorpay UPI",
            },
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verified"] is True
        assert verify_res.json()["payment"]["status"] == "Paid"

        # ------------------------------------------------------------------
        # STEP 18: Customer downloads / retrieves GST invoice
        # ------------------------------------------------------------------
        inv_res = client.get(f"/api/v1/invoices/booking/{booking_id}", headers=cust_headers)
        assert inv_res.status_code == 200
        invoice = inv_res.json()
        assert invoice["invoice_number"].startswith("INV-")
        assert invoice["payment_status"] == "Paid"

        # ------------------------------------------------------------------
        # STEP 19: Customer submits a verified 5-star review
        # ------------------------------------------------------------------
        rev_res = client.post(
            "/api/v1/reviews",
            headers=cust_headers,
            json={
                "booking_id": booking_id,
                "rating": 5,
                "comment": "Outstanding plumbing work! Arrived on time and fixed the leak completely.",
            },
        )
        assert rev_res.status_code == 201
        assert rev_res.json()["rating"] == 5

        # ------------------------------------------------------------------
        # STEP 20: Super Admin views complete transaction & booking analytics
        # ------------------------------------------------------------------
        admin_login = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@homeserve.com", "password": "Password@123"},
        )
        assert admin_login.status_code == 200
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        analytics_res = client.get("/api/v1/analytics/admin", headers=admin_headers)
        assert analytics_res.status_code == 200
        admin_stats = analytics_res.json()
        assert admin_stats["total_bookings"] >= 1
        assert admin_stats["completed_bookings"] >= 1
        assert admin_stats["total_revenue"] > 0

        csv_res = client.get("/api/v1/reports/bookings/export", headers=admin_headers)
        assert csv_res.status_code == 200
        assert booking_data["booking_reference"] in csv_res.text
