import { describe, it, expect } from 'vitest';
import {
  productSchema,
  redirectSchema,
  bannerSchema,
  pageSchema,
  SCHEMA_BY_TABLE,
} from '@/lib/admin/schemas';

describe('SCHEMA_BY_TABLE', () => {
  it('contém todas as tabelas CRUD esperadas', () => {
    const expected = [
      'solutions', 'products', 'product_categories', 'product_applications',
      'banners', 'footer_columns', 'footer_links',
      'navigation_items', 'pages', 'redirects',
      'home_slider_items', 'home_indicators', 'home_cta_cards',
    ];
    for (const table of expected) {
      expect(SCHEMA_BY_TABLE[table]).toBeDefined();
    }
  });
});


describe('productSchema', () => {
  it('aceita brand_id e category_id como uuid válido', () => {
    const result = productSchema.safeParse({
      name: 'Produto X',
      brand_id: '00000000-0000-0000-0000-000000000001',
      category_id: '00000000-0000-0000-0000-000000000002',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita brand_id que não é uuid', () => {
    const result = productSchema.safeParse({ brand_id: 'abc' });
    expect(result.success).toBe(false);
  });

  it('aceita brand_id null', () => {
    const result = productSchema.safeParse({ brand_id: null });
    expect(result.success).toBe(true);
  });
});

describe('redirectSchema', () => {
  it('aceita status_code 301', () => {
    const result = redirectSchema.safeParse({ status_code: 301 });
    expect(result.success).toBe(true);
  });

  it('rejeita status_code 200', () => {
    const result = redirectSchema.safeParse({ status_code: 200 });
    expect(result.success).toBe(false);
  });

  it('rejeita status_code 404', () => {
    const result = redirectSchema.safeParse({ status_code: 404 });
    expect(result.success).toBe(false);
  });
});

describe('bannerSchema', () => {
  it('aceita display_order válido', () => {
    const result = bannerSchema.safeParse({ display_order: 5 });
    expect(result.success).toBe(true);
  });

  it('rejeita display_order negativo', () => {
    const result = bannerSchema.safeParse({ display_order: -1 });
    expect(result.success).toBe(false);
  });

  it('rejeita display_order fracionário', () => {
    const result = bannerSchema.safeParse({ display_order: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('pageSchema', () => {
  it('aceita content com sections array', () => {
    const result = pageSchema.safeParse({
      content: { sections: [{ id: '1', type: 'text', display_order: 0, active: true, data: {} }] },
    });
    expect(result.success).toBe(true);
  });

  it('aceita SEO fields', () => {
    const result = pageSchema.safeParse({
      seo_title: 'Título SEO',
      seo_description: 'Descrição',
      robots_index: true,
      robots_follow: true,
      og_image_url: 'https://example.com/og.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita og_image_url malformada', () => {
    const result = pageSchema.safeParse({ og_image_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});
