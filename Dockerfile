# Dockerfile for Dokploy deployment - Located at repository root
FROM node:20-alpine AS deps
WORKDIR /app
# Copy from kawaiitorichan subdirectory when context is root
COPY ./kawaiitorichan/package.json ./kawaiitorichan/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy everything from kawaiitorichan first
COPY kawaiitorichan/ .
# Now explicitly verify and copy SQL files (with error handling)
RUN echo "=== CHECKING FOR SQL FILES IN BUILD ===" && \
    echo "Current directory:" && pwd && \
    echo "Files in current directory:" && ls -la && \
    echo "SQL files found:" && ls -la *.sql* 2>&1 || echo "No SQL files found yet"
# Try to explicitly copy the critical files (will fail if not exist, which is what we want)
COPY kawaiitorichan/quick-import.sql ./quick-import.sql
COPY kawaiitorichan/production-all-posts.sql.gz ./production-all-posts.sql.gz

# Remove any existing .env files that might have been copied
RUN rm -f .env .env.local .env.production.local

# Copy and use build environment file
COPY kawaiitorichan/.env.build .env

# Set all build-time environment variables explicitly
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_BUILD_STATIC_GENERATION=true
ENV SKIP_DB_PUSH=true
ENV SKIP_DB_SEED=true
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js
# Use a non-localhost database URL to prevent connection attempts
ENV DATABASE_URI=postgresql://build:build@db:5432/build
ENV PAYLOAD_SECRET=build_time_secret_will_be_replaced_at_runtime_minimum_32_chars
ENV NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Create quick-import.sql directly in the container if it doesn't exist
RUN if [ ! -f quick-import.sql ]; then \
    echo "Creating quick-import.sql in container..." && \
    cat > quick-import.sql << 'SQLEOF' && \
    echo "-- Quick import SQL file created in Docker build" >> quick-import.sql && \
    echo "-- This file contains minimal data for testing" >> quick-import.sql; \
    fi

# Verify SQL files NOW
RUN echo "=== FINAL CHECK IN BUILDER ===" && \
    ls -la *.sql* 2>&1 && \
    echo "quick-import.sql exists:" && test -f quick-import.sql && echo "YES" || echo "NO" && \
    echo "production-all-posts.sql.gz exists:" && test -f production-all-posts.sql.gz && echo "YES" || echo "NO"

# Build the application (using special Docker build that skips static generation)
RUN corepack enable pnpm && pnpm run build:docker


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

# Copy migrations and Payload config (required for Payload CMS v3)
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/src/migrations ./src/migrations
COPY --from=builder /app/src/payload.config.ts ./src/payload.config.ts

# Copy package.json and node_modules for payload CLI
COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy database initialization files
COPY --from=builder /app/init-db.sh ./
COPY --from=builder /app/force-init-db.sh ./
COPY --from=builder /app/init-bird-production.sh ./
COPY --from=builder /app/force-import.sh ./
COPY --from=builder /app/quick-import.sql ./
COPY --from=builder /app/production-all-posts.sql.gz ./

# Copy runtime scripts from kawaiitorichan directory
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/run-migrations.sh ./
COPY --from=builder /app/server-wrapper.js ./

# Install PostgreSQL client, npm, and curl for database initialization
USER root
RUN apk add --no-cache postgresql-client npm curl
RUN chmod +x ./docker-entrypoint.sh ./init-db.sh ./force-init-db.sh ./init-bird-production.sh ./force-import.sh || true
RUN chmod 644 ./quick-import.sql ./production-all-posts.sql.gz || true

# Verify SQL files are present in the final container
RUN echo "Final container SQL files:" && \
    ls -la quick-import.sql production-all-posts.sql.gz && \
    echo "All SQL files in container:" && ls -la *.sql*

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