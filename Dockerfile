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
