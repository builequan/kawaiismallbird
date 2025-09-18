FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
# Skip static generation during build
ENV SKIP_BUILD_STATIC_GENERATION=true
# Use dummy values for build time - real values will be provided at runtime
ENV PAYLOAD_SECRET=dummy_secret_for_build_only_not_for_production
ENV DATABASE_URI=postgres://dummy:dummy@localhost:5432/dummy
ENV NEXT_PUBLIC_SERVER_URL=http://localhost:3000

RUN corepack enable pnpm && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
