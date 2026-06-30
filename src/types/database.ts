// =============================================================================
// MSM — Tipos do banco Supabase
// Gerados manualmente a partir das migrations v1.0 + v1.1.
// Pode ser regenerado via `supabase gen types typescript` quando CLI for instalada.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Status = 'draft' | 'published';

// Estruturas jsonb tipadas (adendo v1.1 §1)
export type PageSection =
  | { id: string; type: 'text'; display_order: number; active: boolean; data: { title: string | null; body_markdown: string } }
  | { id: string; type: 'image'; display_order: number; active: boolean; data: { image_url: string; alt: string; caption: string | null; width: 'full' | 'contained' } }
  | { id: string; type: 'image_text'; display_order: number; active: boolean; data: { image_url: string; alt: string; title: string; body_markdown: string; image_side: 'left' | 'right' } }
  | { id: string; type: 'cta'; display_order: number; active: boolean; data: { title: string; description: string | null; button_label: string; button_url: string; style: 'primary' | 'secondary' } }
  | { id: string; type: 'stats'; display_order: number; active: boolean; data: { title: string | null; items: { value: string; label: string }[] } }
  | { id: string; type: 'gallery'; display_order: number; active: boolean; data: { title: string | null; items: { image_url: string; alt: string; caption: string | null }[] } }
  | { id: string; type: 'video'; display_order: number; active: boolean; data: { video_url: string; poster_url: string | null; title: string | null; autoplay: boolean; muted: boolean; loop: boolean } }
  | { id: string; type: 'quote'; display_order: number; active: boolean; data: { text: string; author: string | null; role: string | null } }
  | { id: string; type: 'spacer'; display_order: number; active: boolean; data: { size: 'sm' | 'md' | 'lg' | 'xl' } }
  | { id: string; type: 'accordion'; display_order: number; active: boolean; data: { title: string | null; items: { question: string; answer_markdown: string }[] } };

export type PageContent = { sections: PageSection[] };

export type SolutionBenefit = {
  icon_url: string | null;
  title: string;
  description: string;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string | null;
  product_id: string | null;
};

export type RecipeInstruction = {
  step: number;
  text: string;
  image_url: string | null;
  tip: string | null;
};

// SEO compartilhado
type SeoColumns = {
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
};

type Timestamps = {
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// Tabelas
// -----------------------------------------------------------------------------

export type AdminProfile = Timestamps & {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  active: boolean;
};

export type SiteSetting = Timestamps & {
  id: string;
  key: string;
  value: Json;
  description: string | null;
};

export type MediaAsset = Timestamps & {
  id: string;
  bucket: string;
  path: string;
  public_url: string | null;
  file_name: string | null;
  file_type: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  uploaded_by: string | null;
};

export type Page = Timestamps & SeoColumns & {
  id: string;
  title: string;
  slug: string;
  route_path: string;
  page_type: string;
  status: Status;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  content: PageContent;
};

export type NavigationItem = Timestamps & {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  location: 'header' | 'footer' | string;
  display_order: number;
  active: boolean;
  is_external: boolean;
  open_in_new_tab: boolean;
};

export type HomeHero = Timestamps & {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  video_url: string | null;
  fallback_image_url: string | null;
  mobile_fallback_image_url: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  overlay_opacity: number;
  active: boolean;
  seo_support_text: string | null;
};

export type HomeSliderItem = Timestamps & {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  display_order: number;
  transition_seconds: number;
  active: boolean;
};

export type HomeIndicator = Timestamps & {
  id: string;
  main_text: string;
  description: string | null;
  icon_url: string | null;
  internal_note: string | null;
  display_order: number;
  active: boolean;
};

export type HomeCtaCard = Timestamps & {
  id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  interest_type: string | null;
  button_label: string | null;
  button_url: string | null;
  display_order: number;
  active: boolean;
};

export type Banner = Timestamps & {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  location: string;
  route_path: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  video_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  overlay_style: string | null;
  display_order: number;
  active: boolean;
};

export type Solution = Timestamps & SeoColumns & {
  id: string;
  title: string;
  slug: string;
  route_path: string;
  short_description: string | null;
  full_content: PageContent;
  hero_image_url: string | null;
  icon_url: string | null;
  benefits: SolutionBenefit[];
  cta_label: string | null;
  cta_url: string | null;
  form_interest_type: string | null;
  status: Status;
  display_order: number;
};

export type Brand = Timestamps & SeoColumns & {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  positioning: string | null;
  target_audience: string | null;
  categories: string[];
  featured: boolean;
  display_order: number;
  status: Status;
};

export type ProductCategory = Timestamps & SeoColumns & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  status: Status;
};

export type ProductApplication = Timestamps & SeoColumns & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  status: Status;
};

export type Product = Timestamps & SeoColumns & {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  main_image_url: string | null;
  technical_sheet_url: string | null;
  packaging_summary: string | null;
  commercial_notes: string | null;
  featured: boolean;
  display_order: number;
  status: Status;
};

export type ProductImage = Timestamps & {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  active: boolean;
};

export type ProductPackagingOption = Timestamps & {
  id: string;
  product_id: string;
  label: string;
  description: string | null;
  weight_or_volume: string | null;
  weight_grams: number | null;
  units_per_box: string | null;
  image_url: string | null;
  is_primary: boolean;
  display_order: number;
  active: boolean;
};

export type ProductApplicationLink = {
  product_id: string;
  application_id: string;
};

export type RecipeCategory = Timestamps & SeoColumns & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  status: Status;
};

export type Recipe = Timestamps & SeoColumns & {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  introduction: string | null;
  image_url: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  yield_text: string | null;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  chef_notes: string | null;
  application_context: string | null;
  featured: boolean;
  display_order: number;
  status: Status;
};

export type RecipeProduct = {
  recipe_id: string;
  product_id: string;
};

export type FooterColumn = Timestamps & {
  id: string;
  title: string;
  display_order: number;
  active: boolean;
};

export type FooterLink = Timestamps & {
  id: string;
  column_id: string;
  label: string;
  href: string;
  is_external: boolean;
  open_in_new_tab: boolean;
  display_order: number;
  active: boolean;
};

export type WebhookRetryQueue = Timestamps & {
  id: string;
  destination: string;
  idempotency_key: string;
  payload: Json;
  status: 'pending' | 'sent' | 'failed' | 'dead';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_attempted_at: string | null;
  next_attempt_at: string;
  sent_at: string | null;
  source_page: string | null;
  source_ip: string | null;
};

export type Redirect = Timestamps & {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  active: boolean;
  notes: string | null;
};

export type AdminActivityLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  record_label: string | null;
  changes: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type MullerBotCallback = {
  id: string;
  idempotency_key: string;
  event_type: string;
  source_ip: string | null;
  signature_ok: boolean;
  payload: Json;
  received_at: string;
  processed_at: string | null;
};

// -----------------------------------------------------------------------------
// Schema do Supabase (formato esperado pelo SupabaseClient<Database>)
// -----------------------------------------------------------------------------

type Insert<T extends Timestamps> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>> &
  Omit<T, 'id' | 'created_at' | 'updated_at' | keyof Partial<T>>;
type Update<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

type TableRow<T extends Timestamps> = {
  Row: T;
  Insert: Insert<T>;
  Update: Update<T>;
  Relationships: [];
};

type JunctionRow<T> = {
  Row: T;
  Insert: T;
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      admin_profiles: TableRow<AdminProfile>;
      site_settings: TableRow<SiteSetting>;
      media_assets: TableRow<MediaAsset>;
      pages: TableRow<Page>;
      navigation_items: TableRow<NavigationItem>;
      home_hero: TableRow<HomeHero>;
      home_slider_items: TableRow<HomeSliderItem>;
      home_indicators: TableRow<HomeIndicator>;
      home_cta_cards: TableRow<HomeCtaCard>;
      banners: TableRow<Banner>;
      solutions: TableRow<Solution>;
      brands: TableRow<Brand>;
      product_categories: TableRow<ProductCategory>;
      product_applications: TableRow<ProductApplication>;
      products: TableRow<Product>;
      product_images: TableRow<ProductImage>;
      product_packaging_options: TableRow<ProductPackagingOption>;
      product_application_links: JunctionRow<ProductApplicationLink>;
      recipe_categories: TableRow<RecipeCategory>;
      recipes: TableRow<Recipe>;
      recipe_products: JunctionRow<RecipeProduct>;
      footer_columns: TableRow<FooterColumn>;
      footer_links: TableRow<FooterLink>;
      webhook_retry_queue: TableRow<WebhookRetryQueue>;
      redirects: TableRow<Redirect>;
      admin_activity_log: {
        Row: AdminActivityLog;
        Insert: Omit<AdminActivityLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdminActivityLog>;
        Relationships: [];
      };
      mullerbot_callbacks: {
        Row: MullerBotCallback;
        Insert: Omit<MullerBotCallback, 'id' | 'received_at' | 'processed_at' | 'source_ip'> & {
          id?: string;
          received_at?: string;
          processed_at?: string | null;
          source_ip?: string | null;
        };
        Update: Partial<MullerBotCallback>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
