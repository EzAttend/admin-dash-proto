# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
# Use Node.js for building — Bun segfaults on arm64 under QEMU emulation
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs ./
COPY src ./src
COPY public ./public
COPY middleware.ts ./

# Build-time env vars for Next.js (override at build or use defaults)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BETTER_AUTH_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}

# Next.js collects telemetry — disable it during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx next build

# ── Stage 3: Production ──────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run as root
RUN useradd --system --uid 1001 --no-create-home nextjs
RUN mkdir -p .next && chown nextjs:nogroup .next

# Copy standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nogroup /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nogroup /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
