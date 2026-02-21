#!/bin/bash
# Production Deployment - dynamic-portfolio-website (mehmetdogandev.com)
# Uses external Postgres. Run from project root.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}▶${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

if [ ! -f ".env.prod" ]; then
  print_error ".env.prod not found!"
  print_warning "Copy .env.prod.example to .env.prod and fill in values"
  exit 1
fi

print_step "Pulling latest changes..."
if git pull origin main 2>/dev/null || git pull origin master 2>/dev/null; then
  print_success "Git pull completed"
else
  print_warning "Git pull failed or no remote, continuing..."
fi

print_step "Installing dependencies..."
if pnpm install --frozen-lockfile; then
  print_success "Dependencies installed"
else
  print_error "Failed to install dependencies"
  exit 1
fi

set -a
source .env.prod
set +a

print_step "Starting MinIO and Drizzle Gateway..."
if docker compose -f docker-compose.prod.yml up -d minio drizzle-gateway; then
  print_success "Containers started"
else
  print_error "Failed to start containers"
  exit 1
fi

print_step "Waiting for MinIO to be ready..."
sleep 5

print_step "Running database migrations..."
HOST_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/@host.docker.internal:/@localhost:/' | sed 's/@postgres:/@localhost:/')
if [ -n "$HOST_DATABASE_URL" ]; then
  export DATABASE_URL="$HOST_DATABASE_URL"
fi
if pnpm db:push; then
  print_success "Migrations completed"
  set -a
  source .env.prod
  set +a
else
  print_error "Migrations failed"
  exit 1
fi

print_step "Building and starting Next.js..."
if docker compose -f docker-compose.prod.yml up -d --build nextjs; then
  print_success "Deployment completed"
else
  print_error "Failed to build/start"
  exit 1
fi

echo ""
print_success "Deployment completed successfully!"
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  dynamic-portfolio-website (mehmetdogandev.com)${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next.js${NC}     http://localhost:${PORT:-8081}"
echo -e "${BLUE}MinIO API${NC}   http://localhost:${MINIO_API_PORT:-9010}"
echo -e "${BLUE}MinIO Console${NC} http://localhost:${MINIO_CONSOLE_PORT:-9011}"
echo -e "${BLUE}Drizzle${NC}     http://localhost:${DRIZZLE_GATEWAY_PORT:-7711}"
echo ""
echo -e "${YELLOW}Commands:${NC} docker compose -f docker-compose.prod.yml logs -f"
echo "          docker compose -f docker-compose.prod.yml down"
echo "          pnpm run cli  (redeploy)"
echo ""
