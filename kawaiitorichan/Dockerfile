FROM node:20-alpine AS deps
WORKDIR /app
# If context is repository root (not kawaiitorichan), use full paths
COPY kawaiitorichan/package.json ./
COPY kawaiitorichan/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Cache busting - update timestamp to force rebuild
ARG REBUILD_TIMESTAMP=2025-01-22-SUSPENSE-FIX-GOOGLE-ANALYTICS

# Copy all files from kawaiitorichan directory (context is repository root)
COPY kawaiitorichan/ .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
# Skip static generation during build
ENV SKIP_BUILD_STATIC_GENERATION=true
# IMPORTANT: These are dummy values for build only
# Real values MUST be provided at runtime via Docker environment
ENV PAYLOAD_SECRET=build_time_secret_replaced_at_runtime
ENV DATABASE_URI=postgres://build:build@localhost:5432/build
ENV NEXT_PUBLIC_SERVER_URL=http://localhost:3000

RUN corepack enable pnpm && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install PostgreSQL client for database initialization and curl for media downloads
RUN apk add --no-cache postgresql-client curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public directory (media files excluded via .dockerignore to save space)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Media files will be downloaded at runtime to save build space

# Copy runtime scripts from builder stage (they're now in /app after COPY kawaiitorichan/)
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/server-wrapper.js ./
COPY --from=builder /app/start.sh ./
COPY --from=builder /app/simple-server.cjs ./
COPY --from=builder /app/init-db.sh ./
COPY --from=builder /app/force-init-db.sh ./
COPY --from=builder /app/schema.sql ./
COPY --from=builder /app/reset-and-init-db.sh ./
COPY --from=builder /app/ensure-status-column.sh ./
COPY --from=builder /app/simple-status-fix.sql ./
COPY --from=builder /app/comprehensive-schema-fix.sql ./
COPY --from=builder /app/emergency-fix.sql ./
COPY --from=builder /app/add-comments-schema.sql ./
COPY --from=builder /app/validate-schema.sh ./
COPY --from=builder /app/download-media.sh ./
COPY --from=builder /app/smart-media-sync.sh ./
COPY --from=builder /app/check-media-files.sh ./

# Copy bird theme SQL initialization and ALL data files
COPY --from=builder /app/force-clean-import.sh ./
COPY --from=builder /app/production-data-366-posts-fixed.sql.gz ./
COPY --from=builder /app/schema.sql ./
COPY --from=builder /app/media-files-list.txt ./

# Copy media files directly into Docker image
COPY --from=builder /app/public/media ./public/media

# Copy only essential scripts needed at runtime
RUN mkdir -p ./scripts
COPY --from=builder /app/scripts/fix-categories.sql ./scripts/fix-categories.sql

RUN chmod +x ./docker-entrypoint.sh ./start.sh ./force-clean-import.sh ./download-media.sh ./smart-media-sync.sh ./check-media-files.sh

# Change ownership of all files to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
