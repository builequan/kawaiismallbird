#!/bin/sh
# Build script for Docker that handles database connection issues

echo "Starting build process..."

# Set build-time environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export SKIP_BUILD_STATIC_GENERATION=true
export SKIP_DB_PUSH=true
export SKIP_DB_SEED=true

# Use dummy database URL if not provided
if [ -z "$DATABASE_URI" ]; then
  export DATABASE_URI="postgresql://build:build@localhost:5432/build"
  echo "Using dummy DATABASE_URI for build"
fi

# Ensure PAYLOAD_SECRET is set for build
if [ -z "$PAYLOAD_SECRET" ]; then
  export PAYLOAD_SECRET="build_time_secret_will_be_replaced_at_runtime_minimum_32_chars"
  echo "Using dummy PAYLOAD_SECRET for build"
fi

# Run the build
echo "Running pnpm build..."
pnpm build

if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed!"
  exit 1
fi