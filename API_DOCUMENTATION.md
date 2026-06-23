# CRDMS REST API Documentation

This guide outlines the endpoints, request/response models, authorization mechanisms, and error formats for the Candidate Records Database Management System (CRDMS) API.

---

## 🔒 Authentication & Security

All API endpoints (except `/auth/login`, `/auth/refresh`, and `/health`) require authentication using a JSON Web Token (JWT).

*   **Access Token**: Transmitted in the HTTP headers as:
    ```http
    Authorization: Bearer <access_token>
    ```
    Access tokens are short-lived (15 minutes).
*   **Refresh Token**: Automatically transmitted as a secure, httpOnly cookie:
    ```http
    Cookie: refresh_token=<token>; Secure; SameSite=Strict; Path=/auth
    ```
    Refresh tokens are long-lived (7 days) and used to request new access tokens.
*   **Alternative Token Access**: For direct downloads (e.g. `GET /uploads/download/:id`) where headers cannot be sent natively by browser tags, the API accepts a query parameter fallback:
    ```http
    GET /uploads/download/12?token=<access_token>
    ```

---

## 📊 Standard Response Wrappers

The API returns consistent JSON envelopes for all requests.

### Success Envelope
```json
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

### Paginated Success Envelope
```json
{
  "success": true,
  "data": {
    "candidates": [...],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Error details here",
  "errors": [] // Optional array of field-level validations
}
```

---

## 🛠️ API Endpoints Reference

### 1. Authentication (`/auth`)

#### `POST /auth/login`
Authenticates user credentials.
*   **Rate Limit:** Max 5 requests per 15 minutes per IP. Lockout triggered after 5 consecutive failures.
*   **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "SecurePassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi...",
        "user": {
          "id": 1,
          "username": "admin",
          "email": "admin@crdms.com",
          "role": "Admin"
        }
      }
    }
    ```

#### `POST /auth/refresh`
Issues a new Access Token. Reads refresh token from cookie.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```

#### `POST /auth/logout`
Revokes the refresh token and clears HTTP cookies.
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

---

### 2. Candidate Management (`/candidates`)
*   **Required Headers:** `Authorization: Bearer <token>`

#### `GET /candidates`
Fetch candidates list. Supports pagination, searching, and advanced filters.
*   **Permissions:** `Candidate:View`
*   **Query Parameters:**
    *   `page` (int, default: 1)
    *   `limit` (int, default: 10)
    *   `search` (string: filters by name, email, phone, location, skills)
    *   `status` (string)
    *   `location` (string)
    *   `experience_min` / `experience_max` (double)
*   **Response (200 OK):** Standard Paginated Envelope.

#### `POST /candidates`
Register a new candidate.
*   **Permissions:** `Candidate:Create`
*   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "skills": "JavaScript, Node.js, React",
      "location": "New York",
      "experience_years": 4.5,
      "status": "Applied"
    }
    ```

#### `GET /candidates/:id`
Fetch candidate details, timeline log, and uploaded attachments.
*   **Permissions:** `Candidate:View`

#### `PUT /candidates/:id`
Modify candidate details. Triggers a CandidateTimeline entry.
*   **Permissions:** `Candidate:Edit`

#### `DELETE /candidates/:id`
Soft-deletes candidate (sets `deleted_at` and `deleted_by`).
*   **Permissions:** `Candidate:Delete`

#### `GET /candidates/recycle-bin`
Lists soft-deleted candidates.
*   **Permissions:** `Candidate:Delete`

#### `POST /candidates/restore/:id`
Restores a soft-deleted candidate.
*   **Permissions:** `Candidate:Delete`

#### `DELETE /candidates/hard-delete/:id`
Permanently purges candidate record and cascade-deletes documents/timelines from the database.
*   **Permissions:** `Candidate:Delete`

#### `POST /candidates/import`
Bulk import candidates from spreadsheet.
*   **Permissions:** `Candidate:Create`
*   **Content-Type:** `multipart/form-data`
*   **Form Param:** `file` (Excel spreadsheet `.xls`/`.xlsx`)

---

### 3. File Uploads & Attachments (`/uploads`)
*   **Enforced Upload Limit:** Max 10MB per file.
*   **Supported File Formats:** PDF, DOC, DOCX, JPG, PNG.

#### `POST /uploads`
Uploads document associated with candidate.
*   **Permissions:** `Candidate:Edit`
*   **Content-Type:** `multipart/form-data`
*   **Form Params:**
    *   `candidateId` (int)
    *   `resume` (File)

#### `GET /uploads/download/:id`
Streams binary attachment. Supports header token or query parameter token authorization.
*   **Permissions:** `Candidate:View`

#### `DELETE /uploads/:id`
Deletes uploaded document file from disk/GCS and database.
*   **Permissions:** `Candidate:Edit`

---

### 4. User Accounts Administration (`/users`)
*   **Permissions Required:** `Users:Create`

#### `GET /users`
Fetch all registered user credentials and roles.

#### `POST /users`
Create database account with assigned role (Admin, HR Manager, Recruiter, Interviewer, Data Entry, Viewer).

#### `PUT /users/:id`
Update database user password or roles.

#### `DELETE /users/:id`
Deletes database user.

---

### 5. Excel Reports (`/reports`)

#### `GET /reports`
Generates and downloads a binary Excel spreadsheet compilation containing all candidates, aggregated stats, and metrics.
*   **Permissions:** `Reports:View`

---

### 6. Audit & Activity Logs (`/logs`)

#### `GET /logs`
Fetch audit events database (IP, OS, Browser, Action, Old values, New values, User).
*   **Permissions:** `Settings:Read`

---

### 7. Health Monitor (`/health`)

#### `GET /health`
System diagnostics endpoint.
*   **Authentication:** Public (No JWT required)
*   **Response (200 OK if DB connects, 503 Service Unavailable if DB down):**
    ```json
    {
      "status": "UP",
      "timestamp": "2026-06-23T21:12:00.000Z",
      "uptime": 3600.23,
      "responseTimeMs": 4,
      "db": { "status": "UP", "error": null },
      "system": {
        "platform": "linux",
        "arch": "x64",
        "cpuCores": 4,
        "freeMemoryBytes": 2048576000,
        "totalMemoryBytes": 8192000000,
        "loadAverage": [0.15, 0.08, 0.02]
      }
    }
    ```
