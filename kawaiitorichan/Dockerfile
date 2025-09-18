FROM node:20-alpine AS deps
WORKDIR /app
# Context is repository root, files are in kawaiitorichan subdirectory
COPY kawaiitorichan/package.json kawaiitorichan/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy all files from kawaiitorichan subdirectory
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

# Install PostgreSQL client for database initialization
RUN apk add --no-cache postgresql-client

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy runtime scripts from builder stage (they're now in /app after COPY kawaiitorichan/)
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/server-wrapper.js ./
COPY --from=builder /app/start.sh ./
COPY --from=builder /app/simple-server.cjs ./
COPY --from=builder /app/init-db.sh ./
COPY --from=builder /app/schema.sql ./
RUN chmod +x ./docker-entrypoint.sh ./start.sh ./init-db.sh

# Change ownership of all files to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
