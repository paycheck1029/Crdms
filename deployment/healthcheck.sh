#!/bin/sh
set -e

# Port defaults to 5000 if not specified
APP_PORT=${PORT:-5000}
HEALTH_URL="http://localhost:${APP_PORT}/health"

# Perform curl/wget request to evaluate application state
if wget --quiet --tries=1 --spider "$HEALTH_URL"; then
  exit 0
else
  exit 1
fi
