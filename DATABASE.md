# Database Architecture & Optimization Guide

This document describes the schema design, tables, relationships, indexes, constraints, and optimization strategies implemented in the CRDMS database to ensure compatibility with production environments (including GCP Cloud SQL).

---

## 📊 Entity Relationship (ER) Diagram

```mermaid
erDiagram
    Users ||--o{ Candidates : "deletes (soft)"
    Users ||--o{ ActivityLogs : "performs"
    Users ||--o{ CandidateTimeline : "performs"
    Candidates ||--o{ Documents : "has"
    Candidates ||--o{ CandidateTimeline : "moves through"

    Users {
        int id PK
        string username UNIQUE
        string password_hash
        string email UNIQUE
        string role
        boolean email_verified
        string refresh_token
        int login_attempts
        datetime locked_until
        datetime created_at
        datetime updated_at
    }

    Candidates {
        int id PK
        string name
        string email UNIQUE
        string phone
        string skills
        string location
        double experience_years
        string status
        double current_ctc
        double expected_ctc
        int notice_period_days
        string linkedin_url
        string company
        string preferred_location
        string remarks
        string comment
        datetime deleted_at
        int deleted_by FK
        datetime created_at
        datetime updated_at
    }

    Documents {
        int id PK
        int candidate_id FK
        string file_name
        string file_path
        int file_size
        string mime_type
        datetime uploaded_at
    }

    CandidateTimeline {
        int id PK
        int candidate_id FK
        string event
        string details
        int performed_by FK
        datetime timestamp
    }

    ActivityLogs {
        int id PK
        int user_id FK
        string username
        string action
        string details
        string ip_address
        string browser
        string os
        string old_value
        string new_value
        datetime timestamp
    }
```

---

## 🛠️ Table Specifications & Indexes

### 1. `Users`
Stores authentication credentials, permission roles, and login lockout flags.
*   **Indexes:**
    *   `idx_users_username` on `username` (faster lookup during authentication).
    *   `idx_users_email` on `email` (faster lookup during registration/password resets).
*   **Security Lockout Rules:** Uses `login_attempts` (locks out user after 5 failures) and `locked_until` (datetime representation of lockout expiry).

### 2. `Candidates`
Maintains records of all candidate profiles.
*   **Indexes:**
    *   `idx_candidates_status` on `status` (optimizes filtration by pipeline stages).
    *   `idx_candidates_location` on `location` (optimizes geo-location queries).
    *   `idx_candidates_experience` on `experience_years` (optimizes range-filtering).
    *   `idx_candidates_email` on `email` (optimizes search by email).
    *   `idx_candidates_phone` on `phone` (optimizes search by phone).
    *   `idx_candidates_created` on `created_at` (optimizes default sorting).
*   **Soft Delete Mechanism:**
    *   `deleted_at`: Default is `NULL`. If non-null, candidate is soft-deleted and omitted from standard search queries.
    *   `deleted_by` (Foreign Key -> `Users.id`): Tracks who deleted the candidate.

### 3. `Documents`
Stores metadata and paths for resume/certificate attachments.
*   **Indexes:**
    *   `idx_documents_candidate` on `candidate_id` (optimizes document retrieval for candidate profiles).
*   **Constraints:**
    *   `FOREIGN KEY (candidate_id) REFERENCES Candidates(id) ON DELETE CASCADE`: Deleting a candidate permanently (purging from the Recycle Bin) automatically cascadingly deletes their documents record.

### 4. `CandidateTimeline`
Maintains candidate stage progression histories (e.g., status changes, assignees, edits).
*   **Indexes:**
    *   `idx_timeline_candidate` on `candidate_id` (optimizes timeline widget rendering).
*   **Constraints:**
    *   `FOREIGN KEY (candidate_id) REFERENCES Candidates(id) ON DELETE CASCADE`.
    *   `FOREIGN KEY (performed_by) REFERENCES Users(id) ON DELETE SET NULL`: If a user account is deleted, their timeline logging is preserved (marked as null).

### 5. `ActivityLogs`
Stores administrative actions and audit logs.
*   **Indexes:**
    *   `idx_logs_timestamp` on `timestamp` (optimizes sorting of recent audits).
    *   `idx_logs_username` on `username` (optimizes audits by user).
    *   `idx_logs_action` on `action` (optimizes search by specific event categories).
*   **Constraints:**
    *   `FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL`.

---

## ⚙️ Optimization & Scalability Decisions

1.  **Foreign Key Cascades:** `ON DELETE CASCADE` is set on candidate dependencies (`Documents`, `CandidateTimeline`) to prevent orphaned rows when candidates are permanently deleted.
2.  **Explicit Columns in Indexing:** B-Tree indexes are explicitly added for fields that are sorted or filtered on standard UI listings (e.g., experience years, location, created date, and candidate status).
3.  **Soft Delete Filtering:** Standard repository queries enforce `deleted_at IS NULL` to ensure active candidate lists do not perform manual filtering operations in the server runtime.
