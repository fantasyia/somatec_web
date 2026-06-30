import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { RecipeCard, type RecipeCardData } from '@/components/recipes/RecipeCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { RecipeIngredient } from '@/types/database';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type ProductMeta = { name: string; seo_title: string | null };
type ProductRow = { id: string; name: string; slug: string };
type RawRecipe = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  image_url: string | null;
  total_time: string | null;
  ingredients: RecipeIngredient[];
  recipe_categories: { name: string } | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db.from('products').select('name, seo_title').eq('slug', slug).single();
  const row = data as unknown as ProductMeta | null;
  if (!row) return { title: 'Produto não encontrado' };
  return { title: row.seo_title ?? `Receitas com ${row.name} — MSM`, robots: { index: false, follow: true } };
}

export default async function ReceitasPorProdutoPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const [{ data: rawProduct }, { data: rawRecipes }] = await Promise.all([
    db.from('products').select('id, name, slug').eq('slug', slug).eq('status', 'published').single(),
    db.from('recipes').select('id, title, slug, short_description, image_url, total_time, ingredients, recipe_categories(name)').eq('status', 'published').order('display_order'),
  ]);

  const product = rawProduct as unknown as ProductRow | null;
  if (!product) notFound();

  const allRecipes = (rawRecipes as unknown as RawRecipe[] | null) ?? [];
  const filtered: RecipeCardData[] = allRecipes
    .filter((r) => Array.isArray(r.ingredients) && r.ingredients.some((i) => i.product_id === product.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      short_description: r.short_description,
      image_url: r.image_url,
      total_time: r.total_time,
      categoryName: r.recipe_categories?.name ?? null,
    }));

  return (
    <>
      <PageHero
        eyebrow="Receitas"
        title={`Receitas com ${product.name}`}
        description={`Sugestões de preparo e aplicação profissional utilizando ${product.name}.`}
        breadcrumbs={[
          { label: 'Receitas', href: '/receitas' },
          { label: product.name, href: `/produtos/${product.slug}` },
          { label: 'Receitas' },
        ]}
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
              As receitas com {product.name} estão sendo publicadas. Fale com nossa equipe para sugestões de aplicação.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <CommercialCta
                label="Falar com a equipe"
                context={`Receitas com ${product.name}`}
                fallbackPath="/contato#food_service"
              />
              <Link href="/receitas" className="btn-secondary text-[rgb(var(--text))]">
                Ver receitas
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
