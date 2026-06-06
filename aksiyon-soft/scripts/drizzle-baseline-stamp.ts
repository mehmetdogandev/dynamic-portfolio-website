/**
 * Veritabanı `drizzle-kit push` veya manuel kurulumla oluşturulduysa,
 * `drizzle.__drizzle_migrations` boş kalır; `pnpm db:migrate` tüm .sql dosyalarını
 * yeniden uygulamaya çalışır (ör. CREATE TYPE permission → zaten var hatası).
 *
 * Bu script, journal + migration dosyalarındaki hash/timestamp ile tabloyu
 * doldurur; sonrasında `pnpm db:migrate` eski migration'ları atlar, yalnızca
 * yeni eklenen migration'ları uygular.
 *
 * Güvenli: Tabloda zaten journal ile aynı sayıda kayıt varsa çıkar.
 */
import 'dotenv/config'
import { rewriteComposeInternalHostsForHostShell } from '../lib/db/rewrite-compose-internal-hosts-for-host-shell'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import pg from 'pg'

rewriteComposeInternalHostsForHostShell()

const MIGRATIONS_FOLDER = path.resolve(process.cwd(), 'drizzle')
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, 'meta/_journal.json')

type Journal = {
  entries: { tag: string; when: number; breakpoints?: boolean }[]
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.STUDIO_DB_URL
  if (!url) {
    throw new Error('DATABASE_URL veya STUDIO_DB_URL tanımlı olmalı')
  }

  const journal: Journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'))
  const expected = journal.entries.length

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `)

    const { rows: countRows } = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM drizzle.__drizzle_migrations`
    )
    const current = Number.parseInt(countRows[0]?.c ?? '0', 10)

    if (current >= expected) {
      console.log(
        `drizzle.__drizzle_migrations zaten ${current} kayıt içeriyor (beklenen: ${expected}). Baseline gerekmedi.`
      )
      return
    }

    if (current > 0 && current < expected) {
      throw new Error(
        `Kısmi migration geçmişi (${current}/${expected}). Veritabanını yedekleyip drizzle.__drizzle_migrations tablosunu inceleyin veya boş bir DB ile migrate kullanın.`
      )
    }

    if (current === 0) {
      const { rows: existsRows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'user'
        ) AS exists`
      )
      if (!existsRows[0]?.exists) {
        throw new Error(
          'Bu veritabanı boş görünüyor (public.user tablosu yok). Önce `pnpm db:migrate` ile şemayı oluşturun. ' +
            '`pnpm db:baseline` yalnızca `db:push` veya manuel kurulum sonrası migration geçmişini senkronize etmek içindir; boş DB’de çalıştırılırsa kayıtlar yazılır ama tablolar oluşmaz ve seed hata verir.'
        )
      }
    }

    await client.query('BEGIN')
    try {
      for (const entry of journal.entries) {
        const sqlPath = path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`)
        const query = fs.readFileSync(sqlPath, 'utf8')
        const hash = crypto.createHash('sha256').update(query).digest('hex')
        await client.query(
          `INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ($1, $2)`,
          [hash, entry.when]
        )
        console.log(`İşaretlendi: ${entry.tag}`)
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }

    console.log(
      '\nTamam. Artık `pnpm db:migrate` mevcut migration dosyalarını tekrar uygulamaz; yalnızca yeni üretilenler çalışır.'
    )
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
