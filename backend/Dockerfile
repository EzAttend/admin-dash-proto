# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM oven/bun:1 AS deps

WORKDIR /app

# better-sqlite3 requires python3, make, g++ for native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* tsconfig.json ./
COPY src ./src

RUN bun build src/app.ts --outdir ./dist --target bun

# ── Stage 3: Production ──────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create data directory for auth.db
RUN mkdir -p /app/data

# Copy built output and production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Persistent volume for SQLite auth database
VOLUME ["/app/data"]

EXPOSE 5000

CMD ["bun", "dist/app.js"]
