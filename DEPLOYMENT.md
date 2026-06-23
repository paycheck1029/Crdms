# Deployment Manual (Google Cloud Platform & Production Environments)

This document describes instructions for deploying CRDMS in production using a containerized architecture on Google Cloud Platform (GCP) or generic Linux instances running Docker, Nginx, and MySQL.

Detailed technical commands and bucket setup scripts are located in [README_DEPLOYMENT.md](file:///c:/Users/Lenovo/Documents/crdms/deployment/README_DEPLOYMENT.md).

---

## ☁️ Google Cloud Platform Deployment (Recommended)

The production CRDMS architecture on GCP maps to these components:

*   **Google Cloud Run**: Managed serverless containers hosting the Next.js frontend and Express backend.
*   **Google Cloud SQL (MySQL 8.0)**: High-availability, secure database.
*   **Google Cloud Storage (GCS)**: Buckets for candidate documents (resumes, certificates) and database backup dumps.
*   **Google Cloud Secret Manager**: Encrypts and loads database credentials, JWT secrets, and SMTP passwords.
*   **Google Cloud HTTP(S) Load Balancing**: Single domain routing with Serverless NEGs and automated SSL/TLS certificates.

---

## 🛠️ Deployment Steps Summary

### 1. Cloud Storage Setup
Provision two separate buckets:
*   `gs://[project-id]-crdms-uploads` (For resumes and files)
*   `gs://[project-id]-crdms-backups` (For daily SQL backup dumps)

Ensure the backend service account has **Storage Object Admin** permissions for these buckets.

### 2. Cloud SQL Provisioning
Create a MySQL 8.0 Cloud SQL instance. Configure:
*   Standard SSD storage (20GB+ auto-expanding).
*   Automatic backups & binary logging (point-in-time recovery).
*   Add a user `crdms_app_user` with a secure password.

### 3. Secret Manager Provisioning
Create secret resources in Secret Manager:
*   `CRDMS_DB_PASSWORD` (App user DB password)
*   `CRDMS_DB_ROOT_PASSWORD` (Database root password)
*   `CRDMS_JWT_SECRET` (For signing JWT tokens)
*   `CRDMS_JWT_REFRESH_SECRET` (For signing refresh tokens)
*   `CRDMS_MAIL_USERNAME` (SMTP mail login)
*   `CRDMS_MAIL_PASSWORD` (SMTP mail password)

### 4. Build and Push Containers
Compile production Docker builds using the multi-stage [Dockerfile](file:///c:/Users/Lenovo/Documents/crdms/deployment/Dockerfile):
```bash
# Build & tag Backend
docker build --target backend -t us-central1-docker.pkg.dev/[project]/crdms/backend:latest -f deployment/Dockerfile .

# Build & tag Frontend (Specify API endpoint during build step)
docker build --target frontend --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com/api -t us-central1-docker.pkg.dev/[project]/crdms/frontend:latest -f deployment/Dockerfile .
```
Push the images to the Google Artifact Registry.

### 5. Deploy Cloud Run Services
1.  **Deploy Backend Container**: Mount SQL connection proxy, specify bucket name and environment parameters, and read secrets from Secret Manager.
2.  **Deploy Frontend Container**: Map NextJS execution parameters and bind to port `3000`.

---

## 🐳 On-Premises / Virtual Machine Deployment (Docker Compose & Nginx)

If deploying to a virtual machine (e.g., Google Compute Engine, AWS EC2, or a private server):

1.  Clone the repository on the target VM.
2.  Navigate to the deployment directory:
    ```bash
    cd deployment
    ```
3.  Configure `.env` environment file:
    ```bash
    # Prepare environment with database, jwt, mail and storage variables
    nano .env
    ```
4.  Launch the containers:
    ```bash
    docker-compose up --build -d
    ```
    This launches MySQL, Backend, Frontend, and Nginx proxy in a secure, isolated network. Nginx binds to ports `80` and `443` on the host, handling SSL routing and file size limits (10MB).

---

## 🔄 Automated Backup Restorations

In the event of database failure or migration:
1.  Locate the database container name (e.g., `crdms-db`).
2.  Execute the restoration helper:
    ```bash
    ./restore.sh /path/to/backup.sql.gz
    ```
    This script automatically decompresses the database dump and imports it into your MySQL instance safely.
