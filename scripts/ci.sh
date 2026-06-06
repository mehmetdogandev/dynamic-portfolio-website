#!/usr/bin/env bash
# Ortak altyapi sunucuda ayaktayken: localde imaj build → tar → scp → uzakta load + app-only compose.
# Uzak DEPLOY_REMOTE_DIR yoksa mkdir -p ile acilir. Ilk sefer: dizine docker-compose.app.yml ve .env kopyala.
# DEPLOY_* degiskenleri: `.env` icinde tanimlanabilir (script otomatik yukler)
# veya export / komut satirinda verilir.
#   DEPLOY_SSH          SSH hedefi (ornek: aksiyon2 — ~/.ssh/config Host)
#   DEPLOY_REMOTE_DIR   Sunucudaki repo kok dizini (ornek: /root/dynamic-portfolio-website-mehmetdogandev)
# Opsiyonel:
#   DEPLOY_IMAGE_NAME   (varsayilan: dynamic-portfolio-website-mehmetdogandev-app)
#   DEPLOY_IMAGE_TAG    (varsayilan: UTC tarih-saat)
#   COMPOSE_FILE        (varsayilan: docker-compose.app.yml)
#   APP_HOST_PORT       (varsayilan: 3000 — nginx ile uyumlu)
#   CI_RUN_MIGRATE_BEFORE_BUILD=1  — once `pnpm i`, db:migrate, db:triggers (uzak DB'ye baglanir)
#   CI_SKIP_ENV_SYNC=1           — `.env` uzakta elle yonetiliyorsa yerel `.env` kopyalanmaz
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DEPLOY_SSH="${DEPLOY_SSH:-${DEPLOY_SSH_HOST:-}}"
DEPLOY_IMAGE_NAME="${DEPLOY_IMAGE_NAME:-dynamic-portfolio-website-mehmetdogandev-app}"
DEPLOY_IMAGE_TAG="${DEPLOY_IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.app.yml}"
TAR_NAME="${DEPLOY_IMAGE_NAME}_${DEPLOY_IMAGE_TAG}.tar"

if [[ -z "${DEPLOY_SSH:-}" ]]; then
  echo "Hata: DEPLOY_SSH (veya DEPLOY_SSH_HOST) tanimli degil. Ornek: DEPLOY_SSH=aksiyon2 pnpm run ci" >&2
  exit 1
fi
if [[ -z "${DEPLOY_REMOTE_DIR:-}" ]]; then
  echo "Hata: DEPLOY_REMOTE_DIR tanimli degil. Ornek: DEPLOY_REMOTE_DIR=/root/dynamic-portfolio-website-mehmetdogandev pnpm run ci" >&2
  exit 1
fi

node -e "const fs=require('fs');const path=require('path');fs.writeFileSync(path.join(process.cwd(),'.maintenance.json'),JSON.stringify({is_in_maintenance:true,updated_at:new Date().toISOString()},null,2));"
trap 'node -e "const fs=require(\"fs\");const path=require(\"path\");fs.writeFileSync(path.join(process.cwd(),\".maintenance.json\"),JSON.stringify({is_in_maintenance:false,updated_at:new Date().toISOString()},null,2));"' EXIT

if [[ "${CI_RUN_MIGRATE_BEFORE_BUILD:-}" == "1" ]]; then
  pnpm install
  pnpm db:migrate
  pnpm db:triggers
fi

docker build -t "${DEPLOY_IMAGE_NAME}:${DEPLOY_IMAGE_TAG}" .
docker save "${DEPLOY_IMAGE_NAME}:${DEPLOY_IMAGE_TAG}" -o "${TAR_NAME}"

ssh "${DEPLOY_SSH}" "mkdir -p \"${DEPLOY_REMOTE_DIR}\""
# compose `env_file: .env` sunucudaki dosyayi okur; yanlislikla .env.host (127.0.0.1) kopyalanmissa
# konteyner icinde DB'ye baglanilmaz. Build makinesindeki .env (postgres/redis/minio) ile esitle.
if [[ -f .env && "${CI_SKIP_ENV_SYNC:-}" != "1" ]]; then
  scp .env "${DEPLOY_SSH}:${DEPLOY_REMOTE_DIR}/.env"
fi
scp "${TAR_NAME}" "${DEPLOY_SSH}:${DEPLOY_REMOTE_DIR}/"

ssh "${DEPLOY_SSH}" bash -s <<REMOTE_EOF
set -euo pipefail
cd "${DEPLOY_REMOTE_DIR}"
docker load -i "${TAR_NAME}"
export DEPLOY_IMAGE_NAME="${DEPLOY_IMAGE_NAME}"
export DEPLOY_IMAGE_TAG="${DEPLOY_IMAGE_TAG}"
if [[ -n "${APP_HOST_PORT:-}" ]]; then export APP_HOST_PORT="${APP_HOST_PORT}"; fi
docker compose -f "${COMPOSE_FILE}" up -d
rm -f "${TAR_NAME}"
REMOTE_EOF

rm -f "${TAR_NAME}"
echo "Deploy tamam: ${DEPLOY_IMAGE_NAME}:${DEPLOY_IMAGE_TAG} -> ${DEPLOY_SSH}:${DEPLOY_REMOTE_DIR}"
