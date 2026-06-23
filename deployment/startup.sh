#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting CRDMS Startup Procedure..."

# Run Database Migrations
echo "Checking and executing database migrations..."
npm run migrate

# Conditionally Seed Database if SEED_DATABASE environment variable is set to true
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database with default configuration and production-ready records..."
  npm run seed
fi

# Hand over to the primary server process
echo "Bootstrapping API Server..."
exec npm start
