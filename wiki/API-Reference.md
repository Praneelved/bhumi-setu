# 🔌 API Reference

The BhoomiSetu backend exposes RESTful HTTP endpoints for authentication, GIS queries, parcel adjudication, and administrative workflows.

---

## 🔒 Authentication & OTP Endpoints

### 1. Request OTP
- **URL:** `POST /api/auth/government/send-otp` or `POST /api/auth/agency/send-otp` or `POST /api/auth/personal/send-otp`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "identifier": "officer@nic.in"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "OTP dispatched successfully"
  }
  ```

### 2. Verify OTP & Authenticate
- **URL:** `POST /api/auth/verify-otp`
- **Request Body:**
  ```json
  {
    "identifier": "officer@nic.in",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "District Officer",
      "role": "GOVERNMENT",
      "jurisdiction": "Pune District"
    }
  }
  ```

---

## 📍 Land Parcels & Survey Records

### 1. Get Parcels by Project
- **URL:** `GET /api/parcels?project_id=12`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1042,
      "survey_number": "144/2B",
      "district": "Pune",
      "taluka": "Haveli",
      "village": "Wagholi",
      "owner_name": "Ramesh Patil",
      "total_area_sqm": 4200.5,
      "acquired_area_sqm": 1250.0,
      "status": "APPROVED",
      "compensation_amount": 3750000.00
    }
  ]
  ```

---

## 💰 Compensation & Disbursements

### Calculate Compensation
- **URL:** `POST /api/compensation/calculate`
- **Request Body:**
  ```json
  {
    "parcel_id": 1042,
    "circle_rate_per_sqm": 1000.00,
    "market_value": 1250000.00,
    "is_rural": true,
    "asset_valuation": 250000.00
  }
  ```
- **Calculation Formulation:**
  - `Base Value = Market Value × Rural Multiplier (2.0)`
  - `Solatium (100%) = Base Value`
  - `Additional Interest = 12% per annum`
  - `Total Award = Base Value + Solatium + Assets + Interest`
