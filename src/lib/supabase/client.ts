'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton para evitar múltiplas instâncias do client em HMR/strict-mode.
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. Verifique .env.local.',
    );
  }
  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
