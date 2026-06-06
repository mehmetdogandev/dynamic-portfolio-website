import { existsSync } from 'node:fs'

/**
 * Compose `app-network` uzerinde `postgres` DNS ile cozulur; kabuktan (`pnpm db:seed`,
 * `pnpm db:migrate` vb.) calisirken ayni `.env` ile baglanmak icin 127.0.0.1 + publish
 * port kullanilir. Konteyner icinde `/.dockerenv` vardir — dokunulmaz.
 */
export function rewriteComposeInternalHostsForHostShell(): void {
  if (existsSync('/.dockerenv')) {
    return
  }

  let didRewrite = false

  for (const key of ['DATABASE_URL', 'STUDIO_DB_URL'] as const) {
    const raw = process.env[key]
    if (!raw?.trim()) continue
    const next = rewritePostgresServiceHostInConnectionString(raw)
    if (next !== raw) {
      process.env[key] = next
      didRewrite = true
    }
  }

  if (process.env.POSTGRES_HOST === 'postgres') {
    process.env.POSTGRES_HOST = '127.0.0.1'
    didRewrite = true
  }

  if (didRewrite) {
    console.info(
      '[db] Docker disi kabuk: `postgres` → 127.0.0.1 (DATABASE_URL / POSTGRES_HOST)'
    )
  }
}

function rewritePostgresServiceHostInConnectionString(
  connectionString: string
): string {
  try {
    const u = new URL(connectionString)
    if (u.hostname !== 'postgres') {
      return connectionString
    }
    u.hostname = '127.0.0.1'
    return u.toString()
  } catch {
    return connectionString
  }
}
