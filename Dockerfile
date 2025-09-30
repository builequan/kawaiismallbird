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
# Copy SQL files with proper names for init scripts
COPY kawaiitorichan/production-data-115-posts.sql.gz ./production-all-posts.sql.gz
COPY kawaiitorichan/production-data-115-posts.sql.gz ./production-data-115-posts.sql.gz
COPY kawaiitorichan/quick-import-data.sql ./quick-import.sql
COPY kawaiitorichan/quick-import-data.sql ./quick-import-data.sql
COPY kawaiitorichan/media-files-list.txt ./media-files-list.txt

# Cache bust - Force rebuild at 2025-09-30 21:45
# Change this timestamp to force complete rebuild
ENV REBUILD_TIMESTAMP="2025-09-30-21:45:00"

# Remove any existing .env files that might have been copied
RUN rm -f .env .env.local .env.production.local

# Copy and use build environment file
COPY kawaiitorichan/.env.build .env

# Accept build-time argument for NEXT_PUBLIC_SERVER_URL from Dokploy
ARG NEXT_PUBLIC_SERVER_URL
# Set it as environment variable so Next.js can use it during build
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

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

# Verify SQL files are present
RUN echo "=== VERIFYING SQL FILES IN BUILDER ===" && \
    ls -la *.sql* 2>&1 && \
    echo "Checking critical files:" && \
    test -f quick-import.sql && echo "✅ quick-import.sql found" || echo "❌ quick-import.sql missing" && \
    test -f production-all-posts.sql.gz && echo "✅ production-all-posts.sql.gz found" || echo "❌ production-all-posts.sql.gz missing"

# Clean any cached builds and build fresh
RUN rm -rf .next || true
RUN corepack enable pnpm && pnpm run build:docker


FROM node:20-alpine AS runner
WORKDIR /app

# Runtime environment setup
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application and media files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create media directory structure
RUN mkdir -p public/media && chown -R nextjs:nodejs public/media

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
COPY --from=builder /app/media-files-list.txt ./
COPY --from=builder /app/insert-categories.sql ./
# Copy all SQL files that might exist
COPY --from=builder /app/*.sql* ./

# Copy runtime scripts from kawaiitorichan directory
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/run-migrations.sh ./
COPY --from=builder /app/server-wrapper.js ./
COPY --from=builder /app/smart-media-sync.sh ./
COPY --from=builder /app/runtime-env-replace.sh ./

# Install PostgreSQL client, npm, wget and curl for database initialization
USER root
RUN apk add --no-cache postgresql-client npm curl wget
RUN chmod +x ./docker-entrypoint.sh ./init-db.sh ./force-init-db.sh ./init-bird-production.sh ./force-import.sh ./smart-media-sync.sh ./runtime-env-replace.sh || true
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