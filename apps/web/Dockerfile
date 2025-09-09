# 1. 베이스 이미지 설정
FROM node:20-alpine AS base
WORKDIR /app

# corepack을 설치하고, pnpm을 활성화
RUN corepack enable pnpm

# pnpm의 위치를 확인하여 설치 확인
RUN corepack prepare pnpm@latest --activate
RUN which pnpm && pnpm --version

# 2. 빌드 의존성 단계
FROM base AS deps
WORKDIR /app
# 앱의 루트 디렉토리로부터 파일을 복사

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY turbo.json ./

# # 앱의 실제 소스 파일 복사
COPY apps/web ./apps/web
# # 앱의 Dependency 파일 복사
COPY packages ./packages

# pnpm을 사용하여 의존성 설치
RUN pnpm install --frozen-lockfile

# 3. 빌드 단계
FROM base AS builder
WORKDIR /app

# node_modules를 복사
COPY --from=deps /app ./
ENV TURBO_TELEMETRY_DISABLE=1
ENV DO_NOT_TRACK=1
# 앱을 빌드
RUN pnpm build --filter=./apps/web

# 4. 런타임 단계
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

RUN mkdir .next
RUN chown nextjs:nodejs .next
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public


EXPOSE 3000
# 앱을 실행
CMD ["node", "./apps/web/server.js"]

