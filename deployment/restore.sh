#!/bin/bash
# CRDMS Database Restoration Script

# Exits on any error
set -e

# Load configurations from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST=${DB_HOST:-$MYSQLHOST}
DB_PORT=${DB_PORT:-$MYSQLPORT}
DB_USER=${DB_USER:-$MYSQLUSER}
DB_PASSWORD=${DB_PASSWORD:-$MYSQLPASSWORD}
DB_NAME=${DB_NAME:-$MYSQLDATABASE}
GCS_BUCKET=${GCS_BUCKET_NAME}

# Check input parameters
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_filename_or_path>"
  echo "Example GCS: ./restore.sh backup-railway-2026-06-23.sql.gz"
  echo "Example Local: ./restore.sh ./temp_backups/backup-railway-2026-06-23.sql.gz"
  exit 1
fi

BACKUP_TARGET=$1

# Temporary workspace file
TEMP_SQL="temp_restore.sql"

# Check if target is a local file
if [ -f "$BACKUP_TARGET" ]; then
  echo "Restoring from local backup: $BACKUP_TARGET..."
  gunzip -c "$BACKUP_TARGET" > "$TEMP_SQL"
else
  # Check GCS bucket configuration
  if [ -z "$GCS_BUCKET" ]; then
    echo "Error: Local file not found and GCS_BUCKET_NAME is not configured."
    exit 1
  fi
  
  echo "Downloading backup from GCS bucket: gs://$GCS_BUCKET/backups/$BACKUP_TARGET..."
  gsutil cp "gs://$GCS_BUCKET/backups/$BACKUP_TARGET" "./$BACKUP_TARGET"
  
  echo "Unpacking SQL dump..."
  gunzip -c "./$BACKUP_TARGET" > "$TEMP_SQL"
  
  # Cleanup downloaded zip
  rm "./$BACKUP_TARGET"
fi

# Execute Import
echo "Importing SQL dump into MySQL database: $DB_NAME..."
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" "$DB_NAME" < "$TEMP_SQL"

# Cleanup SQL
rm "$TEMP_SQL"

echo "✓ Database restore completed successfully."
exit 0
