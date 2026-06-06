# Remote DB sync (`scripts/sync-db`)

Yerel veritabanını (`POSTGRES_DB`, varsayılan `aksiyonsoft`) uzak sunucudan yedek ile sıfırlar ve şema/seed adımlarını çalıştırır.

## SSH: `aksiyon1`

Uzak işlemler **`ssh aksiyon1`** ve **`scp aksiyon1:...`** kullanır. **Şirket bilgisayarlarında** bu `Host` adı genelde IT tarafından veya imaj ile **varsayılan** olarak `~/.ssh/config` içine eklenir; kendi makinenizde `ssh aksiyon1` ile sunucuya girebiliyorsanız ek bir host tanımı gerekmez.

`aksiyon1`, `~/.ssh/config` içinde tanımlı bir **Host** olmalıdır (`HostName`, `User`, `IdentityFile` vb. orada verilir). **`sync-db.sh` ve `sync-db.ps1` aynı SSH hedefini kullanır** (`aksiyon1`); uzak **Postgres konteyner adı** için isteğe bağlı **`SYNC_REMOTE_PG_CONTAINER`** kullanılır (aşağıda).

Örnek (özel kurulum veya referans için):

```sshconfig
Host aksiyon1
  HostName ipadress
  User aksiyon1
  IdentityFile ~/.ssh/id_ed25519
```

## `.env` (sync ile ilgili)

Script kök `.env` yükler. Senkron için:

- **`POSTGRES_DB`** — yerel ve uzak `pg_dump` / restore için veritabanı adı (boşsa `aksiyonsoft`); **zorunlu sayılır**.
- **`SYNC_REMOTE_PG_CONTAINER`** — (opsiyonel) uzak sunucudaki Postgres Docker konteyner adı; yoksa varsayılan **`aksiyon-soft-postgres-1`** kullanılır.

Yerel Redis adımları için **`REDIS_PASSWORD`** kullanılır (compose’taki `redis` servisi).

## Sabitler (script içi)

- Yerel Docker: repo kökünde **`docker-compose.dev.yml`** (`postgres` / `redis` servisleri).
- Uzak Postgres **konteyner adı** (uzakta `docker exec … pg_dump` için): genelde compose proje adı + `postgres-1` (ör. **`aksiyon-soft-postgres-1`**). Farklı proje adı: `.env` içinde `SYNC_REMOTE_PG_CONTAINER` ile verin. Doğrulamak: `ssh aksiyon1 'docker ps --format "{{.Names}}" | grep -i postgres'`.

## Çalıştırma

Repo kökünden:

```bash
pnpm sync-db:ps      # PowerShell (Windows önerilen)
pnpm sync-db:cmd     # CMD üzerinden sync-db.bat → PowerShell
pnpm sync-db:bash    # Git Bash / WSL / Linux (`*.sh` LF satır sonu; CRLF bash’i bozar)
```

## Güvenlik

Üretim sırlarını tercihen `.env.local` gibi gitignore’lu dosyalarda tutun.

## Adım seçenekleri

Her adımda **1–5** menüsü vardır (önceki sürümlerle aynı). Uzak yedek veya `scp` atlandıysa yerel restore başarısız olabilir.

## Gereksinimler

- Yerelde: `docker compose` ile `docker-compose.dev.yml` içinde `postgres` ve `redis` ayakta
- `ssh`, `scp` (OpenSSH) PATH’te; `~/.ssh/config` içinde **`Host aksiyon1`** tanımlı
- `pnpm` — `db:push` / `db:seed` repo kökünden
