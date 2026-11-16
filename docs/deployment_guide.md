# HomeServe – Production Deployment & DevOps Guide

> [!NOTE]
> This guide covers both **Local Development Setup** and **Cloud Production Deployment** across **Vercel / Netlify** (React Vite Frontend), **Render / Railway** (FastAPI Backend), **Managed MySQL 8.0** (Aiven / AWS RDS / Railway MySQL), **Razorpay Test/Live Mode**, and **Cloudinary CDN**.

---

## 1. Cloud Deployment Topology

```mermaid
flowchart LR
    User(("End Users\n(Web / Mobile Browser)")) -->|HTTPS CDN| Vercel["Vercel / Netlify\nReact 18 + Vite SPA"]
    Vercel -->|REST API /api/v1| Render["Render Web Service\nFastAPI + Uvicorn Workers"]
    Render -->|SSL Connection Pool| CloudDB[("Managed MySQL 8.0\n(28 InnoDB Tables)")]
    Render -->|Orders & Webhooks| Razorpay["Razorpay Gateway"]
    Render -->|Media Assets| Cloudinary["Cloudinary CDN"]
```

---

## 2. Prerequisites

- **Python:** `3.11+`
- **Node.js:** `18.x` or `20.x+` (with `npm`)
- **MySQL Server:** `8.0+`
- **Git:** `2.40+`

---

## 3. Local Environment Setup (Step-by-Step)

### Step 1: Initialize the MySQL 8.0 Database

Run the schema and seed SQL scripts against your local or cloud MySQL 8.0 instance:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Step 2: Configure & Launch the FastAPI Backend

1. Navigate to `backend/` and create a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # macOS / Linux:
   source .venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and configure your credentials:
   ```env
   APP_NAME="HomeServe SaaS Platform"
   ENVIRONMENT="development"
   DATABASE_URL="mysql+pymysql://root:yourpassword@localhost:3306/homeserve_db"
   JWT_SECRET_KEY="super-secret-production-jwt-key-change-me"
   JWT_ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
   RAZORPAY_KEY_SECRET="YourRazorpayTestSecret"
   RAZORPAY_WEBHOOK_SECRET="YourWebhookSecret"
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
   ```
4. Start the FastAPI server with hot-reload:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - **API Base URL:** `http://localhost:8000/api/v1`
   - **Swagger UI:** `http://localhost:8000/docs`

### Step 3: Configure & Launch the React + Vite Frontend

1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `.env` from `.env.example`:
   ```env
   VITE_API_BASE_URL="http://localhost:8000/api/v1"
   VITE_RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   - **Frontend URL:** `http://localhost:5173`

---

## 4. Cloud Production Deployment Steps

### 4.1 Managed MySQL 8.0 (Aiven / Railway / AWS RDS)
1. Provision a MySQL 8.0 instance with `utf8mb4` character set.
2. Execute `database/schema.sql` followed by `database/seed.sql` using MySQL CLI or MySQL Workbench.
3. Copy the connection URI (`mysql+pymysql://<user>:<password>@<host>:<port>/homeserve_db`).

### 4.2 FastAPI Backend on Render
1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repository.
2. Set the following service settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add all environment variables from `backend/.env.example` in the Render Environment tab, setting `ENVIRONMENT=production` and `CORS_ORIGINS` to your Vercel/Netlify URL.

### 4.3 React Frontend on Vercel / Netlify
1. Import the repository into [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Configure build settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Set environment variables:
   - `VITE_API_BASE_URL=https://your-homeserve-api.onrender.com/api/v1`
   - `VITE_RAZORPAY_KEY_ID=rzp_test_YourTestKeyId`
4. Configure SPA routing fallback (`vercel.json` / `_redirects` -> `/* /index.html 200`) so client-side React Router links resolve cleanly on refresh.

---

## 5. Git Branching & Release Workflow

HomeServe follows a structured Git-Flow branching model:

```mermaid
flowchart LR
    F1["feature/auth-rbac"] --> DEV["develop"]
    F2["feature/catalog-providers"] --> DEV
    F3["feature/bookings-slots-technicians"] --> DEV
    F4["feature/payments-invoices-coupons"] --> DEV
    F5["feature/reviews-complaints-analytics"] --> DEV
    F6["feature/frontend-portals"] --> DEV
    DEV -->|Automated Pytest & Build Check| MAIN["main (Production Release)"]
```

| Branch Name | Scope |
| :--- | :--- |
| `main` | Production-ready, tested release branch deployed to Vercel & Render |
| `develop` | Integration branch combining all feature modules |
| `feature/auth-rbac` | Authentication, JWT + refresh token rotation, and RBAC dependencies |
| `feature/catalog-providers` | 10 service categories, 16+ services, provider KYC, slots & working hours |
| `feature/bookings-slots-technicians` | Booking engine, double-booking prevention, technician assignment & photo evidence |
| `feature/payments-invoices-coupons` | Razorpay orders, HMAC verification, webhooks, coupons, commissions & GST invoices |
| `feature/reviews-complaints-analytics` | Verified customer reviews, dispute tickets, notifications & role analytics |
| `feature/frontend-portals` | React 18 + Tailwind CSS portals for Public, Customer, Provider, Technician & Admin |
