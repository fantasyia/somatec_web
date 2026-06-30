// Barrel export — escolha o client por ambiente.
export { getSupabaseBrowserClient } from './client';
// server.ts e admin.ts NÃO são reexportados aqui pois usam 'server-only'.
// Importe diretamente: `import { getSupabaseServerClient } from '@/lib/supabase/server'`
