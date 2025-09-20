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
# Ensure production SQL files are in builder
RUN echo "Checking for production SQL files..." && \
    ls -la production*.sql* 2>&1 || echo "No production SQL files found"

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

# Verify quick-import.sql is present before build
RUN ls -la quick-import.sql || echo "quick-import.sql not found in builder"

# Build the application (using special Docker build that skips static generation)
# The build:docker command already skips static generation
RUN corepack enable pnpm && pnpm run build:docker

# List files to debug what's available for copying
RUN echo "Files in /app:" && ls -la /app/*.sql* || echo "No SQL files in /app"

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
COPY --from=builder /app/schema.sql ./
COPY --from=builder /app/essential_data.sql ./
COPY --from=builder /app/init-full-bird-content.sql ./
COPY --from=builder /app/init-database-schema.sql ./
COPY --from=builder /app/quick-import.sql ./
COPY --from=builder /app/production-all-posts.sql.gz ./

# Copy production data and import scripts
COPY --from=builder /app/production_data.json ./
COPY --from=builder /app/import-production.js ./
COPY --from=builder /app/import-production-data.sh ./

# Copy runtime scripts from kawaiitorichan directory
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/run-migrations.sh ./
COPY --from=builder /app/server-wrapper.js ./

# Install PostgreSQL client and npm for database initialization
USER root
RUN apk add --no-cache postgresql-client npm
RUN chmod +x ./docker-entrypoint.sh ./init-db.sh ./force-init-db.sh ./init-bird-production.sh ./force-import.sh ./import-production-data.sh || true
RUN chmod 644 ./quick-import.sql || true
# Verify all SQL files are present
RUN echo "SQL files in container:" && ls -la *.sql

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