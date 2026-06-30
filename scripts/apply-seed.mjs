#!/usr/bin/env node
// =============================================================================
// MSM — Runner de migrations idempotentes
//
// Uso:
//   DATABASE_URL=postgres://... node scripts/apply-seed.mjs
//   ou
//   node scripts/apply-seed.mjs  (lê .env.local automaticamente)
//
// - Aplica todos os .sql do diretório scripts/ em ordem alfabética.
// - Usa tabela _schema_migrations para tracking: pula arquivos já aplicados.
// - Verifica checksum SHA256: avisa se arquivo aplicado mudou no disco.
// - Cada arquivo deve ser idempotente (ON CONFLICT DO NOTHING / IF NOT EXISTS).
// =============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migrate] DATABASE_URL ausente — defina em .env.local ou via env var.');
  console.error('          Encontre em Supabase Dashboard → Project Settings → Database → Connection string.');
  process.exit(1);
}

const files = readdirSync(__dirname)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.warn('[migrate] nenhum arquivo .sql em scripts/');
  process.exit(0);
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id           text PRIMARY KEY,
      applied_at   timestamptz NOT NULL DEFAULT now(),
      duration_ms  integer,
      checksum     text
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('SELECT id, checksum FROM _schema_migrations');
  return new Map(rows.map((r) => [r.id, r.checksum]));
}

const client = new Client({ connectionString: DATABASE_URL });

let applied = 0;
let skipped = 0;
let checksumWarnings = 0;

try {
  await client.connect();
  await ensureMigrationsTable(client);
  const alreadyApplied = await getApplied(client);

  console.log(`[migrate] ${files.length} arquivo(s) no disco, ${alreadyApplied.size} já aplicado(s).`);

  for (const file of files) {
    const sql = readFileSync(join(__dirname, file), 'utf8');
    const checksum = sha256(sql);

    if (alreadyApplied.has(file)) {
      const oldChecksum = alreadyApplied.get(file);
      if (oldChecksum && oldChecksum !== checksum) {
        console.warn(`[migrate] ⚠  ${file}: checksum mudou desde a aplicação inicial`);
        console.warn(`           → aplicado: ${oldChecksum.slice(0, 12)}`);
        console.warn(`           →   disco:  ${checksum.slice(0, 12)}`);
        console.warn(`           Crie um novo arquivo de migração em vez de editar este.`);
        checksumWarnings++;
      }
      skipped++;
      continue;
    }

    const start = Date.now();
    process.stdout.write(`[migrate] aplicando ${file}... `);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO _schema_migrations (id, duration_ms, checksum) VALUES ($1, $2, $3)',
        [file, Date.now() - start, checksum],
      );
      await client.query('COMMIT');
      console.log(`OK (${Date.now() - start}ms)`);
      applied++;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.log('ERRO');
      console.error(`           ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }

  console.log(`[migrate] concluído: ${applied} aplicado(s), ${skipped} pulado(s).`);
  if (checksumWarnings > 0) {
    console.log(`[migrate] ⚠  ${checksumWarnings} migration(s) com checksum divergente — atenção.`);
  }
} finally {
  await client.end();
}
