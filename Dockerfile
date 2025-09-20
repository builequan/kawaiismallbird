# Dockerfile for Dokploy deployment - Located at repository root
FROM node:20-alpine AS deps
WORKDIR /app
# Copy from kawaiitorichan subdirectory when context is root
COPY ./kawaiitorichan/package.json ./kawaiitorichan/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY kawaiitorichan/ .

# Ensure runtime scripts are in the builder stage
RUN test -f docker-entrypoint.sh || echo "ERROR: docker-entrypoint.sh not found"
RUN test -f server-wrapper.js || echo "ERROR: server-wrapper.js not found"
RUN test -f build.sh || echo "ERROR: build.sh not found"

# Build-time environment variables (will be replaced at runtime)
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_BUILD_STATIC_GENERATION=true
ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

# These MUST be dummy values for build - real values come from runtime
# Using a fake but valid PostgreSQL URI format to satisfy Payload during build
ENV DATABASE_URI=postgresql://postgres:postgres@db:5432/payload
ENV PAYLOAD_SECRET=build_time_secret_will_be_replaced_at_runtime_minimum_32_chars
ENV NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Skip database operations during build
ENV SKIP_DB_PUSH=true
ENV SKIP_DB_SEED=true

# Use our build script that handles database issues
RUN corepack enable pnpm && chmod +x build.sh && ./build.sh

FROM node:20-alpine AS runner
WORKDIR /app

# Runtime environment setup
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database initialization files
COPY --from=builder /app/init-db.sh ./
COPY --from=builder /app/force-init-db.sh ./
COPY --from=builder /app/init-bird-production.sh ./
COPY --from=builder /app/schema.sql ./
COPY --from=builder /app/essential_data.sql ./
COPY --from=builder /app/init-full-bird-content.sql ./

# Copy runtime scripts from kawaiitorichan directory
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/server-wrapper.js ./

# Install PostgreSQL client for database initialization
USER root
RUN apk add --no-cache postgresql-client
RUN chmod +x ./docker-entrypoint.sh ./init-db.sh ./force-init-db.sh ./init-bird-production.sh || true

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Runtime environment variables (will be overridden by Dokploy)
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]