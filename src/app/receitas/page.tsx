import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { RecipeCard, type RecipeCardData } from '@/components/recipes/RecipeCard';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Receitas — MSM Indústria',
  description:
    'Receitas e aplicações profissionais desenvolvidas com produtos MSM para food service e cozinhas industriais — rendimento, padronização e praticidade.',
  alternates: { canonical: '/receitas' },
  openGraph: {
    title: 'Receitas — MSM Indústria',
    description:
      'Receitas e aplicações profissionais desenvolvidas com produtos MSM para food service e cozinhas industriais — rendimento, padronização e praticidade.',
    url: '/receitas',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

type RawRecipe = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  image_url: string | null;
  total_time: string | null;
  recipe_categories: { name: string } | null;
};
type CatCard = { id: string; name: string; slug: string };

export default async function ReceitasPage() {
  const db = await getSupabaseServerClient();
  const [{ data: rawRecipes }, { data: rawCategories }] = await Promise.all([
    db.from('recipes').select('id, title, slug, short_description, image_url, total_time, recipe_categories(name)').eq('status', 'published').order('display_order'),
    db.from('recipe_categories').select('id, name, slug').eq('status', 'published').order('display_order'),
  ]);

  const list: RecipeCardData[] = ((rawRecipes as unknown as RawRecipe[] | null) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    short_description: r.short_description,
    image_url: r.image_url,
    total_time: r.total_time,
    categoryName: r.recipe_categories?.name ?? null,
  }));
  const cats = (rawCategories as unknown as CatCard[] | null) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Inspiração"
        title="Receitas"
        description="Receitas desenvolvidas para o ambiente profissional — aplicações práticas com produtos MSM para food service, gastronomia e cozinhas industriais."
        breadcrumbs={[{ label: 'Receitas' }]}
      />

      <section className="container-msm py-10 md:py-14">
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/receitas/categoria/${c.slug}`}
                className="px-3 py-1.5 rounded-btn border border-[rgb(var(--border))] text-xs font-sans font-semibold text-[rgb(var(--text-muted))] hover:border-gold hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {list.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
            <span className="eyebrow">Receitas</span>
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Receitas em publicação
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Estamos preparando um acervo de receitas desenvolvidas para aplicação profissional com os produtos MSM. Em breve você poderá explorar sugestões para food service, gastronomia e cozinhas industriais.
            </p>
            <CommercialCta
              label="Falar com a equipe food service"
              fallbackPath="/contato#food_service"
              className="inline-flex mt-2"
            />
          </div>
        )}
      </section>
    </>
  );
}
