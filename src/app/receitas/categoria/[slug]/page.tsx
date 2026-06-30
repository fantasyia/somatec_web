import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { RecipeCard, type RecipeCardData } from '@/components/recipes/RecipeCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type CatMeta = { name: string; seo_title: string | null };
type CatRow = { id: string; name: string; description: string | null };
type RawRecipe = { id: string; title: string; slug: string; short_description: string | null; image_url: string | null; total_time: string | null; category_id: string | null };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db.from('recipe_categories').select('name, seo_title').eq('slug', slug).single();
  const row = data as unknown as CatMeta | null;
  if (!row) return { title: 'Categoria não encontrada' };
  return { title: row.seo_title ?? `${row.name} — Receitas MSM`, robots: { index: false, follow: true } };
}

export default async function ReceitaCategoriaPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const [{ data: rawCat }, { data: rawRecipes }] = await Promise.all([
    db.from('recipe_categories').select('id, name, description').eq('slug', slug).eq('status', 'published').single(),
    db.from('recipes').select('id, title, slug, short_description, image_url, total_time, category_id').eq('status', 'published').order('display_order'),
  ]);

  const category = rawCat as unknown as CatRow | null;
  if (!category) notFound();

  const allRecipes = (rawRecipes as unknown as RawRecipe[] | null) ?? [];
  // Eyebrow de categoria omitido (categoryName null) — é a página da própria categoria.
  const filtered: RecipeCardData[] = allRecipes
    .filter((r) => r.category_id === category.id)
    .map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      short_description: r.short_description,
      image_url: r.image_url,
      total_time: r.total_time,
      categoryName: null,
    }));

  return (
    <>
      <PageHero
        eyebrow="Categoria"
        title={category.name}
        description={category.description ?? undefined}
        breadcrumbs={[{ label: 'Receitas', href: '/receitas' }, { label: category.name }]}
      />

      <section className="container-msm py-10 md:py-14">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-5 py-12">
            <h2 className="font-serif text-h2-m font-semibold">Receitas em publicação</h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              As receitas desta categoria estão sendo publicadas. Entre em contato para informações.
            </p>
            <CommercialCta
              label="Falar com a equipe"
              context={`Receitas — ${category.name}`}
              fallbackPath="/contato#food_service"
              className="inline-flex"
            />
          </div>
        )}
      </section>
    </>
  );
}
