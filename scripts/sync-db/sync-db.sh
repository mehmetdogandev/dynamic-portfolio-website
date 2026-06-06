#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

banner_line() { printf '%s\n' "$1"; }

load_dotenv() {
  local line key val
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[ERR] Dosya bulunamadi: $ENV_FILE (kok .env gerekli)" >&2
    exit 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val#"${val%%[![:space:]]*}"}"
      val="${val%"${val##*[![:space:]]}"}"
      if [[ "$val" == \"*\" ]]; then val="${val:1:${#val}-2}"; fi
      if [[ "$val" == \'*\' ]]; then val="${val:1:${#val}-2}"; fi
      export "$key=$val"
    fi
  done <"$ENV_FILE"
}

# Not: Sonucu stdout ile $() icinde almak ALT KABUK acar; AUTO_RUN_REST / AUTO_SKIP_REST
# o zaman ana scripte yazilmaz. Bu yuzden STEP_DECISION kullanilir; $() KULLANILMAZ.
get_step_choice() {
  local title="$1" detail="${2:-}"
  local c
  if [[ "$AUTO_RUN_REST" -eq 1 ]]; then STEP_DECISION=run; return; fi
  if [[ "$AUTO_SKIP_REST" -eq 1 ]]; then STEP_DECISION=skip; return; fi
  while true; do
    echo "" >&2
    echo "----------------------------------------" >&2
    echo "$title" >&2
    [[ -n "$detail" ]] && echo "$detail" >&2
    echo "  [1] Bu adimi calistir (sonrakilerde tekrar sor)" >&2
    echo "  [2] Bu adimi atla (sonrakilerde tekrar sor)" >&2
    echo "  [3] Tum islemi iptal et" >&2
    echo "  [4] Bu adimi calistir; sonraki tum adimlari sorulmadan calistir" >&2
    echo "  [5] Bu adimi calistir; sonraki tum adimlari sorulmadan atla" >&2
    read -r -p "Seciminiz (1-5): " c </dev/tty || true
    case "$c" in
      1) STEP_DECISION=run; return ;;
      2) STEP_DECISION=skip; return ;;
      3) STEP_DECISION=abort; return ;;
      4)
        AUTO_RUN_REST=1
        echo "[OK] Bu adim ve sonrasindaki tum adimlar sorulmadan calistirilacak." >&2
        STEP_DECISION=run
        return
        ;;
      5)
        AUTO_SKIP_REST=1
        echo "[OK] Bu adim calistirilacak; sonraki adimlar sorulmadan atlanacak." >&2
        STEP_DECISION=run
        return
        ;;
      *) echo "Gecersiz. 1-5 arasi girin." >&2 ;;
    esac
  done
}

run_checked() {
  local label="$1"
  shift
  echo ">> $label"
  "$@"
  local ec=$?
  if [[ $ec -ne 0 ]]; then
    echo "[ERR] Komut basarisiz (exit $ec): $label" >&2
    exit 1
  fi
}

dc() {
  docker compose -f "$LOCAL_COMPOSE_ABS" "$@"
}

redis_flush() {
  local rp="${REDIS_PASSWORD:-}"
  if [[ -n "$rp" ]]; then
    dc exec -T redis redis-cli -a "$rp" FLUSHALL
  else
    dc exec -T redis redis-cli FLUSHALL
  fi
}

declare -a SKIPPED=()

banner_line '========================================'
banner_line ' AKSIYON SOFT DB RESET + REMOTE SYNC'
banner_line '========================================'
echo ""

load_dotenv

# SSH: `ssh aksiyon1` / `scp aksiyon1:...` — Host "aksiyon1" ~/.ssh/config icinde (User, HostName, IdentityFile)
SSH_TARGET="aksiyon1"
# Uzakta: ornek varsayilan compose proje adi aksiyon-soft -> aksiyon-soft-postgres-1. Farkli isim: .env SYNC_REMOTE_PG_CONTAINER
REMOTE_PG_CONTAINER="${SYNC_REMOTE_PG_CONTAINER:-aksiyon-soft-postgres-1}"
SYNC_LOCAL_COMPOSE_FILE="docker-compose.dev.yml"
LOCAL_COMPOSE_ABS="$REPO_ROOT/$SYNC_LOCAL_COMPOSE_FILE"
if [[ ! -f "$LOCAL_COMPOSE_ABS" ]]; then
  echo "[ERR] Compose dosyasi yok: $LOCAL_COMPOSE_ABS" >&2
  exit 1
fi

# .env: yalnizca veritabani adi (diger app ayarlari zaten yuklendi)
DB_NAME="${POSTGRES_DB:-aksiyonsoft}"
DB_NAME="${DB_NAME#"${DB_NAME%%[![:space:]]*}"}"
DB_NAME="${DB_NAME%"${DB_NAME##*[![:space:]]}"}"
[[ -z "$DB_NAME" ]] && DB_NAME="aksiyonsoft"

echo "SSH hedefi: $SSH_TARGET (~/.ssh/config Host)" >&2
echo "Yerel compose: $SYNC_LOCAL_COMPOSE_FILE | Uzak PG container: $REMOTE_PG_CONTAINER | DB: $DB_NAME (.env POSTGRES_DB)" >&2
echo ""
echo "[OK] Uzak: ssh/scp $SSH_TARGET"
echo ""

BACKUP_PATH="$REPO_ROOT/backup.sql"
AUTO_RUN_REST=0
AUTO_SKIP_REST=0
STEP_DECISION=

# --- Adim 1 ---
get_step_choice "ADIM 1: Yerel veritabanini sifirla (DROP + CREATE ${DB_NAME})" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 1 (local DB reset)')
  echo "[SKIP] Adim 1 atlandi."
else
  run_checked 'DROP DATABASE' dc exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"
  run_checked 'CREATE DATABASE' dc exec -T postgres psql -U postgres -c "CREATE DATABASE \"${DB_NAME}\";"
  echo "[OK] Yerel DB yeniden olusturuldu."
fi

# --- Adim 2 ---
get_step_choice "ADIM 2: Uzak sunucuda pg_dump (backup.sql)" "ssh $SSH_TARGET"
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 2 (remote pg_dump)')
  echo "[SKIP] Adim 2 atlandi."
else
  run_checked 'Remote pg_dump' ssh "$SSH_TARGET" "docker exec -t ${REMOTE_PG_CONTAINER} pg_dump -U postgres -d ${DB_NAME} -F p > backup.sql"
  echo "[OK] Uzak yedek alindi."
fi

# --- Adim 3 ---
get_step_choice "ADIM 3: backup.sql dosyasini yerine cek (scp)" "scp ${SSH_TARGET}:backup.sql"
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 3 (scp)')
  echo "[SKIP] Adim 3 atlandi."
else
  run_checked 'SCP backup' scp "${SSH_TARGET}:backup.sql" "$BACKUP_PATH"
  echo "[OK] backup.sql yerelde."
fi

# --- Adim 4 ---
get_step_choice "ADIM 4: Yerel restore (backup.sql -> ${DB_NAME})" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 4 (restore)')
  echo "[SKIP] Adim 4 atlandi."
else
  if [[ ! -f "$BACKUP_PATH" ]]; then
    echo "[ERR] backup.sql bulunamadi: $BACKUP_PATH (Adim 2 ve 3 gerekli)" >&2
    exit 1
  fi
  echo ">> Local restore"
  if ! cat -- "$BACKUP_PATH" | dc exec -T postgres psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1; then
    echo "[ERR] Komut basarisiz: Local restore" >&2
    exit 1
  fi
  echo "[OK] Restore tamamlandi."
fi

# --- Adim 5 ---
get_step_choice "ADIM 5: Uzak sunucuda backup.sql sil" "ssh $SSH_TARGET rm -f ~/backup.sql"
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 5 (remote rm)')
  echo "[SKIP] Adim 5 atlandi."
else
  run_checked 'Remote rm backup' ssh "$SSH_TARGET" "rm -f ~/backup.sql"
  echo "[OK] Uzak backup silindi."
fi

# --- Adim 6 ---
get_step_choice "ADIM 6: Yerel backup.sql sil" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 6 (local del backup)')
  echo "[SKIP] Adim 6 atlandi."
else
  rm -f "$BACKUP_PATH"
  echo "[OK] Yerel backup silindi."
fi

# --- Adim 7 ---
get_step_choice "ADIM 7: Redis FLUSHALL" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 7 (redis flush)')
  echo "[SKIP] Adim 7 atlandi."
else
  run_checked 'Redis flush' redis_flush
  echo "[OK] Redis temizlendi."
fi

# --- Adim 8 ---
get_step_choice "ADIM 8: pnpm db:push" "Dizin: $REPO_ROOT"
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 8 (db:push)')
  echo "[SKIP] Adim 8 atlandi."
else
  ( cd "$REPO_ROOT" && run_checked 'pnpm db:push' pnpm db:push )
  echo "[OK] db:push tamamlandi."
fi

# --- Adim 9 ---
get_step_choice "ADIM 9: pnpm db:seed" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 9 (db:seed)')
  echo "[SKIP] Adim 9 atlandi."
else
  ( cd "$REPO_ROOT" && run_checked 'pnpm db:seed' pnpm db:seed )
  echo "[OK] db:seed tamamlandi."
fi

# --- Adim 10 ---
get_step_choice "ADIM 10: Redis FLUSHALL (post-seed)" ""
d="$STEP_DECISION"
if [[ "$d" == "abort" ]]; then echo "[ABORT] Kullanici iptal etti." >&2; exit 2; fi
if [[ "$d" == "skip" ]]; then
  SKIPPED+=('Adim 10 (redis final)')
  echo "[SKIP] Adim 10 atlandi."
else
  run_checked 'Redis final flush' redis_flush
  echo "[OK] Redis final temizlendi."
fi

banner_line '========================================'
echo "[OK] Is akisi tamamlandi."
if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  echo ""
  echo "Atlanan adimlar:"
  for s in "${SKIPPED[@]}"; do echo "  - $s"; done
fi
banner_line '========================================'
