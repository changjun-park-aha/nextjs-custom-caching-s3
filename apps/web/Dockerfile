# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

# Dependencies stage - optimized for pnpm-lock.yaml caching
FROM base AS deps
WORKDIR /app

# Copy only package files first (critical for caching)
# This layer will be cached as long as pnpm-lock.yaml doesn't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

# Install dependencies with cache mount for maximum efficiency
# The cache mount persists pnpm store across builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
  pnpm install --frozen-lockfile --prefer-offline

# Source stage - copy source code after dependencies
FROM base AS source
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/

# Copy source files (this layer changes frequently but deps don't)
COPY . .

# Build stage
FROM source AS builder
ENV TURBO_TELEMETRY_DISABLE=1
ENV DO_NOT_TRACK=1
ENV NODE_ENV=production

# Build the application
RUN pnpm turbo build --filter=web

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "apps/web/server.js"]
