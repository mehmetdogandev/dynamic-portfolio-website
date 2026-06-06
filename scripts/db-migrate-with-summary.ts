/**
 * `drizzle-kit migrate` çıktısı çoğu ortamda neredeyse sessiz kalır.
 * Bu script migrate'ı çalıştırır; başarıda journal ile veritabanı migration kayıtlarını özetler.
 */
import 'dotenv/config'
import { rewriteComposeInternalHostsForHostShell } from '../lib/db/rewrite-compose-internal-hosts-for-host-shell'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

rewriteComposeInternalHostsForHostShell()

const JOURNAL_PATH = path.join(process.cwd(), 'drizzle/meta/_journal.json')

type Journal = {
  entries: { tag: string; when: number; breakpoints?: boolean }[]
}

async function main(): Promise<void> {
  const migrateResult = spawnSync('npx', ['drizzle-kit', 'migrate'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  })

  if (migrateResult.error) {
    console.error(migrateResult.error)
    process.exit(1)
  }
  const code = migrateResult.status === null ? 1 : migrateResult.status
  if (code !== 0) {
    process.exit(code)
  }

  const journal: Journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'))
  const expected = journal.entries.length

  const url = process.env.DATABASE_URL ?? process.env.STUDIO_DB_URL
  if (!url) {
    console.error(
      'Özet için DATABASE_URL veya STUDIO_DB_URL gerekli; tanımlı değil.'
    )
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    const { rows } = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM drizzle.__drizzle_migrations`
    )
    const dbCount = Number.parseInt(rows[0]?.c ?? '0', 10)

    console.log('')
    console.log('✓ Migration tamamlandı.')
    console.log(
      `  Veritabanındaki kayıt: ${dbCount} | Journal (beklenen): ${expected}`
    )
    if (dbCount === expected) {
      console.log('  Journal ile uyumlu.')
    } else {
      console.warn(
        '  Uyarı: Kayıt sayısı journal ile eşleşmiyor. drizzle.__drizzle_migrations veya baseline sürecini kontrol edin.'
      )
    }
  } catch (e) {
    console.error(
      'Migration başarılı görünüyor ancak özet sorgusu başarısız:',
      e
    )
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
