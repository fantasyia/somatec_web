import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('home-data');
import type {
  HomeHero,
  HomeSliderItem,
  HomeIndicator,
  HomeCtaCard,
  Solution,
  Brand,
  Product,
  Recipe,
} from '@/types/database';

/**
 * Helpers de fetch da home com fallback gracioso.
 * Se o banco estiver vazio (caso atual em dev), retornam null/[] e o componente decide se renderiza placeholder seguro ou pula a seção.
 *
 * IMPORTANTE: nada nestes fetches é cacheado agressivamente — confia no
 * revalidate on-demand da Fase 7 (ISR).
 */

async function safeQuery<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      // log.error (não warn): alimenta msm_errors_total + Sentry. Antes um erro
      // real do Supabase virava "sem dados" silencioso e a home mostrava fallback.
      log.error('query error', undefined, error);
      return null;
    }
    return data;
  } catch (err) {
    log.error('thrown', undefined, err);
    return null;
  }
}

export async function getHomeHero(): Promise<HomeHero | null> {
  const supabase = getSupabaseAdminClient();
  return safeQuery(() =>
    supabase
      .from('home_hero')
      .select('*')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );
}

export async function getSliderItems(): Promise<HomeSliderItem[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<HomeSliderItem[]>(() =>
    supabase
      .from('home_slider_items')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
  );
  return data ?? [];
}

export async function getIndicators(): Promise<HomeIndicator[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<HomeIndicator[]>(() =>
    supabase
      .from('home_indicators')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
  );
  return data ?? [];
}

export async function getCtaCards(): Promise<HomeCtaCard[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<HomeCtaCard[]>(() =>
    supabase
      .from('home_cta_cards')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
  );
  return data ?? [];
}

export async function getFeaturedSolutions(): Promise<Solution[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<Solution[]>(() =>
    supabase
      .from('solutions')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .limit(6)
  );
  return data ?? [];
}

export async function getFeaturedBrands(): Promise<Brand[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<Brand[]>(() =>
    supabase
      .from('brands')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('display_order', { ascending: true })
      .limit(6)
  );
  return data ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<Product[]>(() =>
    supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('display_order', { ascending: true })
      .limit(8)
  );
  return data ?? [];
}

export async function getFeaturedRecipes(): Promise<Recipe[]> {
  const supabase = getSupabaseAdminClient();
  const data = await safeQuery<Recipe[]>(() =>
    supabase
      .from('recipes')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('display_order', { ascending: true })
      .limit(3)
  );
  return data ?? [];
}