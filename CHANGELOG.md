# Changelog

All notable changes to the CRDMS project are documented in this file.

---

## [1.0.0] - 2026-06-23

### Added
*   **Role-Based Access Control (RBAC):** Added backend `authorize(permission)` middleware enforcing granular access permissions mapped to roles: Admin, HR Manager, Recruiter, Interviewer, Data Entry, and Viewer.
*   **Detailed Audit Logging:** Integrated `requestLogger` middleware that extracts the IP, Browser, and Operating System using `ua-parser-js` and logs them along with old vs. new values for candidate updates, auth actions, and role modifications.
*   **Candidate Activity Timeline:** Implemented a timeline tracker recording candidate events (Created, Updated, Interview Scheduled, Offered, Hired, etc.) with performed-by user attributes, rendered on the frontend dashboard.
*   **Soft Deletes & Recycle Bin:** Integrated a soft-delete mechanism (`deleted_at`, `deleted_by`) for candidate profiles with an Administrative Recycle Bin interface supporting restoration and permanent purging.
*   **Winston Daily Rotating Logs:** Created a custom logger service that segments logs into `logs/application.log`, `logs/api.log`, `logs/auth.log`, `logs/db.log`, and `logs/error.log` with a 14-day rotation scheme.
*   **Automated Database Backups (GCP):** Added `backup.js` and cron script to run daily compressed gzip database dumps and upload them directly to a Google Cloud Storage bucket.
*   **Interactive API Docs (Swagger):** Setup Swagger JSDoc and Swagger UI mounting interactive documentation at the `/api-docs` endpoint.
*   **System Diagnostics (`/health`):** Created a system health endpoint returning CPU load, RAM margins, database connection latency, and runtime statistics.
*   **Production Security Hardening:** Integrated `helmet` headers, configurable origin CORS, brute-force login lockout policies (locks users out for 15 minutes after 5 consecutive failures), and API rate limiters (`express-rate-limit`).

### Refactored
*   **Modular Folder Architecture:** Reorganized the backend and frontend into highly structured folders separating controllers, repositories, services, routes, configurations, contexts, and helper utils.
*   **Centralized Client Fetcher:** Built `frontend/services/apiClient.js` with automatic JWT token refresh interceptors using secure `httpOnly` cookies.
*   **Database Normalization:** Redesigned database tables with appropriate foreign keys, index optimizations, cascades, and constraints.
*   **Error Handling Middleware:** Created a centralized error handler ensuring consistent JSON formats are returned for database, validation, or system exceptions.

### Dependencies Introduced
*   `helmet` (Backend security headers)
*   `compression` (Backend response compressing)
*   `express-rate-limit` (DDoS and brute-force mitigation)
*   `winston` & `winston-daily-rotate-file` (Log files management)
*   `ua-parser-js` (User agent analyzer)
*   `swagger-jsdoc` & `swagger-ui-express` (Interactive documentation)
*   `@google-cloud/storage` (GCS integration)
*   `nodemailer` (Generic SMTP emails service)
*   `xlsx` (Excel importing/exporting)
