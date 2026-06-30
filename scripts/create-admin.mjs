#!/usr/bin/env node
/**
 * Cria o primeiro usuário admin no Supabase.
 *
 * Uso:
 *   node scripts/create-admin.mjs <email> <senha> [nome]
 *
 * Exemplo:
 *   node scripts/create-admin.mjs admin@msm.com.br MinhaS3nha "Admin MSM"
 *
 * Requer em .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=
 */

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env.local') });

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? 'Admin';

if (!email || !password) {
  console.error('Uso: node scripts/create-admin.mjs <email> <senha> [nome]');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`\nCriando admin: ${email} …`);

// 1. Criar usuário no Supabase Auth
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError) {
  // Usuário pode já existir — tenta buscar
  if (!authError.message.includes('already been registered')) {
    console.error('❌ Erro ao criar usuário:', authError.message);
    process.exit(1);
  }
  console.log('ℹ  Usuário já existe no Supabase Auth — buscando ID…');
}

let userId = authData?.user?.id;

if (!userId) {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message);
    process.exit(1);
  }
  const existing = users.find((u) => u.email === email);
  if (!existing) {
    console.error('❌ Usuário não encontrado após tentativa de criação.');
    process.exit(1);
  }
  userId = existing.id;
}

// 2. Inserir em admin_profiles (upsert para ser idempotente)
const { error: profileError } = await supabase
  .from('admin_profiles')
  .upsert(
    { user_id: userId, email, full_name: name, active: true },
    { onConflict: 'user_id' },
  );

if (profileError) {
  console.error('❌ Erro ao criar admin_profile:', profileError.message);
  process.exit(1);
}

console.log(`✓ Admin criado com sucesso!`);
console.log(`  Email : ${email}`);
console.log(`  Nome  : ${name}`);
console.log(`  ID    : ${userId}`);
console.log(`\nAcesse /admin/login para entrar.\n`);
