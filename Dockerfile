# syntax=docker.io/docker/dockerfile:1



FROM node:24-alpine AS base

# ---------------------------------------------------
# Install dependencies only when needed
# ---------------------------------------------------
FROM base AS deps

# Some dependencies need additional OS packages
# Detail: https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine

run apk add --no-cache libc6-compat

WORKDIR /app

# it automatically uses the cache if package.json and package-lock.json are not changed
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./


RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then corepack enable npm && npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---------------------------------------------------
# Rebuild the source code only when needed
# ---------------------------------------------------

FROM base as builder

WORKDIR /app

# Transfer dependencies installation from "deps" stage

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous usage data.
# If you want to disable it during build, the following line is used.

ENV NEXT_TELEMETRY_DISABLED 1

# Kullanılan paket yöneticisine göre uygun build komutunu çalıştırır.
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then corepack enable npm && npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---------------------------------------------------
# Production image, copy all the files and run next
# ---------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# If you want to cancel telemetry at run time:
# ENV NEXT_TELEMETRY_DISABLED 1


# PostgreSQL client tools are added for backup and management commands.
RUN apk add --no-cache postgresql-client
# For security, a non-root user is created.

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Add public folder to prod environment
COPY --from=builder /app/public ./public

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy custom server.ts and necessary files for custom server
# We need the full source for custom server to work
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Note: .env.prod file is loaded via docker-compose-prod.yml's env_file directive
# If you want server.ts to read .env.prod file directly, uncomment the line below
# and ensure .env.prod exists in the build context (it should be in .dockerignore for security)
# COPY --chown=nextjs:nodejs .env.prod ./

# Copy node_modules (needed for custom server imports)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Install tsx globally for running TypeScript server in production
RUN npm install -g tsx

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Use tsx to run custom server.ts instead of server.js
CMD ["tsx", "server.ts"]