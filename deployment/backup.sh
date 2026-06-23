#!/bin/bash
# CRDMS Automated Database Backup Trigger Script

# Set working directory to project root
cd "$(dirname "$0")/.."

echo "Starting automated cron database backup..."
node deployment/backup.js >> backend/logs/application.log 2>&1
echo "Backup execution finished."
