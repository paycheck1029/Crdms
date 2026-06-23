# Installation & Setup Manual

This document details the step-by-step instructions required to install, build, test, and run the **CRDMS** application in a local development environment.

---

## 🛠️ Prerequisites

Ensure the following tools are installed on your workstation:
*   **Node.js**: `v20.x` or higher (LTS recommended)
*   **npm**: `v10.x` or higher
*   **MySQL**: `v8.0` database engine
*   **Git** (for version control operations)

---

## 📦 1. Database Setup

1.  **Start MySQL Service**: Ensure your local or remote MySQL service is active.
2.  **Create Database**: Log in to your MySQL terminal and create a clean database:
    ```sql
    CREATE DATABASE crdms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
3.  **Database User**: Ensure you have a user with full privileges to the newly created database (e.g., `crdms_user`).

---

## ⚙️ 2. Backend Installation

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    Copy `.env.example` to `.env` and adjust the variables:
    ```bash
    cp .env.example .env
    ```
    *Open the `.env` file and verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.*

4.  **Run Database Migrations**:
    This will execute the SQL schema creation scripts in `backend/database/migrations/`:
    ```bash
    npm run migrate
    ```
5.  **Seed the Database**:
    This populates the database with initial security roles, permissions, administrative accounts, and default candidates:
    ```bash
    npm run seed
    ```

---

## 🖥️ 3. Frontend Installation

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Ensure `NEXT_PUBLIC_API_URL` points to your backend instance (e.g., `http://localhost:5000/api` for local development).*

---

## 🚀 4. Running the Application

For standard development execution with hot reloading:

### Run Backend Server:
```bash
cd backend
npm run dev
# The API server will listen on http://localhost:5000
```

### Run Frontend Client:
```bash
cd frontend
npm run dev
# The Next.js dev server will listen on http://localhost:3000
```

---

## 🧪 5. Testing & Verification

### Running Integration Tests
The backend integration test suite validates authentication lifecycles, user registrations, candidate retrieval, soft deletes, and RBAC restrictions.
```bash
cd backend
npm run test
```

### Running Frontend Linters
Validate Next.js formatting and static code rules:
```bash
cd frontend
npm run lint
```
