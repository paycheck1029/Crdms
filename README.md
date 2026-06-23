# Candidate Records Database Management System (CRDMS)

CRDMS is an enterprise-grade, secure, and performant full-stack application designed to manage recruitment pipelines, candidate profiles, and multi-format document uploads.

---

## 🌟 Key Features

*   🔐 **Role-Based Access Control (RBAC):** Define granular access configurations for roles including Admin, HR Manager, Recruiter, Interviewer, Data Entry, and Viewer.
*   📝 **Comprehensive Audit Logging:** Track every database transaction, log event, password reset, and configuration change with full User-Agent (Browser, OS) and IP resolution.
*   🕰️ **Candidate Activity Timeline:** Visually trace candidate progress stages from registration, interviews, offers, and hiring steps.
*   📂 **Secure File Management:** Upload resumes, portfolio assets, and certificates. Automatically sanitizes and stores uploads securely in Google Cloud Storage (GCS) or local environments.
*   🗑️ **Soft Deletes:** Ensure data safety by utilizing soft deletes with a Recycle Bin interface for restoration or absolute purging by Administrators.
*   📈 **Report Generation:** Create formatted XLS spreadsheets of recruitment progress metrics.
*   💾 **Automated Backups:** Daily compressed SQL database dumps with weekly/monthly retention policies integrated with Google Cloud Storage.
*   📊 **System Health Monitoring:** Access system metrics (CPU, RAM, uptime, database connections) using `/health`.

---

## 📂 Project Structure

```
crdms/
├── backend/
│   ├── config/             # DB & JWT configurations, static RBAC mappings
│   ├── controllers/        # Express handlers (Auth, Candidates, Audits, Users, etc.)
│   ├── database/           # Schemas, migrations, seeders, connection pool
│   ├── middleware/         # RBAC, Rate-Limiting, Helmet, Error Handling, Request Logging
│   ├── repositories/       # Direct SQL transaction layer
│   ├── routes/             # Express routes linked to controllers
│   ├── services/           # Business logic (Auth, File uploads, Winston logger, Mail)
│   ├── tests/              # Integration and unit tests
│   └── server.js           # Express API server entry point
├── frontend/
│   ├── app/                # Next.js pages (App Router)
│   ├── components/         # Layouts, Sidebar, Timeline components
│   ├── context/            # AuthContext holding state and JWT refresh triggers
│   ├── services/           # Centralized apiClient with JWT refresh interceptors
│   └── utils/              # Client side helpers and formatting constants
├── deployment/
│   ├── Dockerfile          # Multi-stage production container setup
│   ├── docker-compose.yml  # Complete local orchestration with Nginx & DB limits
│   ├── nginx.conf          # Nginx reverse proxy and HTTP security configurations
│   ├── backup.js           # Automated MySQL Gzip backup script
│   └── startup.sh          # Container entrypoint executing migrations/seeding
```

---

## 🚀 Quick Local Start

Follow these steps to run the complete stack locally using Docker Compose:

1.  **Configure Environment Variables:**
    Copy `.env.example` in both folders to create your `.env` configs:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
2.  **Spin Up the Stack:**
    Run the docker-compose command:
    ```bash
    cd deployment
    docker-compose up --build -d
    ```
3.  **Inspect Services:**
    *   **Frontend Client:** `http://localhost` (proxied through Nginx)
    *   **Backend Server:** `http://localhost/api` (or `http://localhost:5000` directly)
    *   **API Documentation:** `http://localhost/api-docs` (Swagger UI)
    *   **Health Status:** `http://localhost/health`

---

## 📖 Complete Documentation Manuals

Detailed documentation for specific operational functions is split into these dedicated manuals:

1.  📄 **[Installation & Setup Manual](file:///c:/Users/Lenovo/Documents/crdms/INSTALLATION.md)**: Steps to install and boot the app in development and testing environments.
2.  📄 **[Deployment Guide](file:///c:/Users/Lenovo/Documents/crdms/DEPLOYMENT.md)**: Exhaustive manual detailing deployments on GCP Cloud Run, Cloud SQL, Cloud Load Balancing, and SSL.
3.  📄 **[Database Optimization & Schema Guide](file:///c:/Users/Lenovo/Documents/crdms/DATABASE.md)**: Normalization diagrams, schema layout, indexes, foreign keys, and soft delete implementation.
4.  📄 **[API Documentation Manual](file:///c:/Users/Lenovo/Documents/crdms/API_DOCUMENTATION.md)**: Swagger configuration, details on payloads, endpoints, responses, and authorization.
5.  📄 **[Architecture & Flow Diagrams](file:///c:/Users/Lenovo/Documents/crdms/ARCHITECTURE_DIAGRAMS.md)**: Mermaid charts representing DB relationships, authentication flows, and infrastructure models.
6.  📄 **[Changelog](file:///c:/Users/Lenovo/Documents/crdms/CHANGELOG.md)**: Compilation of features added, dependencies introduced, and security audits.
