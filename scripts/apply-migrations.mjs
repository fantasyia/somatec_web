#!/usr/bin/env node
/**
 * Aplica todas as migrations SQL em supabase/migrations/ no banco apontado por DIRECT_URL.
 * Usa a conexão direta (porta 5432) — pgbouncer (6543) não suporta múltiplos statements em alguns casos.
 *
 * Uso: node scripts/apply-migrations.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

loadEnv({ path: join(projectRoot, '.env.local') });

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  console.error('❌ DIRECT_URL não encontrada em .env.local');
  process.exit(1);
}

const migrationsDir = join(projectRoot, 'supabase', 'migrations');

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('Nenhuma migration encontrada em', migrationsDir);
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('✓ Conectado ao Postgres');

let ok = 0;
let failed = 0;

for (const file of files) {
  const sqlPath = join(migrationsDir, file);
  const sql = await readFile(sqlPath, 'utf8');
  process.stdout.write(`→ ${file} ... `);
  try {
    await client.query(sql);
    console.log('✓');
    ok++;
  } catch (err) {
    console.log('✗');
    console.error(`\n=== ERRO em ${file} ===`);
    console.error(err.message);
    if (err.position) {
      const pos = parseInt(err.position, 10);
      const around = sql.slice(Math.max(0, pos - 120), pos + 120);
      console.error('Contexto:\n' + around);
    }
    failed++;
  }
}

await client.end();

console.log(`\nResultado: ${ok} OK · ${failed} falha${failed === 1 ? '' : 's'}`);
process.exit(failed === 0 ? 0 : 1);
