import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Users, ChefHat } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { recipeSchema } from '@/lib/seo/structured-data';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Recipe, RecipeIngredient, RecipeInstruction } from '@/types/database';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type RecipeMeta = Pick<Recipe, 'title' | 'seo_title' | 'seo_description' | 'og_title' | 'og_description' | 'og_image_url' | 'canonical_url' | 'robots_index' | 'robots_follow' | 'image_url'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db
    .from('recipes')
    .select('title, seo_title, seo_description, og_title, og_description, og_image_url, canonical_url, robots_index, robots_follow, image_url')
    .eq('slug', slug)
    .single();
  const row = data as unknown as RecipeMeta | null;
  if (!row) return { title: 'Receita não encontrada' };
  const title = row.seo_title ?? `${row.title} — Receitas MSM`;
  const ogImage = row.og_image_url ?? row.image_url;
  return {
    title,
    description: row.seo_description ?? undefined,
    robots: { index: row.robots_index, follow: row.robots_follow },
    ...(row.canonical_url ? { alternates: { canonical: row.canonical_url } } : {}),
    openGraph: {
      title: row.og_title ?? title,
      description: row.og_description ?? row.seo_description ?? undefined,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: 'article',
    },
  };
}

export default async function ReceitaSlugPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data: rawRecipe } = await db
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  const recipe = rawRecipe as unknown as Recipe | null;
  if (!recipe) notFound();

  const ingredients = recipe.ingredients as RecipeIngredient[];
  const instructions = recipe.instructions as RecipeInstruction[];

  // Category name pra JSON-LD
  let categoryName: string | null = null;
  if (recipe.category_id) {
    const { data: c } = await db.from('recipe_categories').select('name').eq('id', recipe.category_id).maybeSingle();
    categoryName = (c as { name: string } | null)?.name ?? null;
  }

  return (
    <>
      <JsonLd
        data={recipeSchema({
          title: recipe.title,
          slug: recipe.slug,
          description: recipe.short_description ?? recipe.introduction,
          image: recipe.image_url,
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          totalTime: recipe.total_time,
          yieldText: recipe.yield_text,
          ingredients,
          instructions,
          categoryName,
        })}
      />

      <PageHero
        eyebrow="Receita"
        title={recipe.title}
        description={recipe.short_description ?? undefined}
        breadcrumbs={[{ label: 'Receitas', href: '/receitas' }, { label: recipe.title }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="flex flex-wrap gap-6 pb-8 border-b border-[rgb(var(--border))]">
            {recipe.prep_time && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                <Clock className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <span><strong className="text-[rgb(var(--text))]">Preparo:</strong> {recipe.prep_time}</span>
              </div>
            )}
            {recipe.cook_time && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                <ChefHat className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <span><strong className="text-[rgb(var(--text))]">Cozimento:</strong> {recipe.cook_time}</span>
              </div>
            )}
            {recipe.total_time && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                <Clock className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <span><strong className="text-[rgb(var(--text))]">Total:</strong> {recipe.total_time}</span>
              </div>
            )}
            {recipe.yield_text && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                <Users className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <span><strong className="text-[rgb(var(--text))]">Rendimento:</strong> {recipe.yield_text}</span>
              </div>
            )}
          </div>

          {recipe.image_url && (
            <div className="aspect-video rounded-card-lg overflow-hidden relative">
              <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
            </div>
          )}

          {recipe.introduction && (
            <div className="space-y-2">
              <span className="eyebrow text-[11px]">Introdução</span>
              <p className="text-[rgb(var(--text-muted))] leading-relaxed">{recipe.introduction}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-12">
            {ingredients.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-h3-m font-semibold">Ingredientes</h2>
                <ul className="space-y-2">
                  {ingredients.map((ing) => (
                    <li key={ing.id} className="flex justify-between gap-4 py-2 border-b border-[rgb(var(--border))] text-sm">
                      <span className="text-[rgb(var(--text))]">{ing.name}</span>
                      <span className="text-[rgb(var(--text-muted))] shrink-0">{ing.quantity} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {instructions.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-h3-m font-semibold">Modo de preparo</h2>
                <ol className="space-y-5">
                  {instructions.map((step) => (
                    <li key={step.step} className="flex gap-4">
                      <span className="font-serif text-[1.75rem] leading-none font-semibold text-gold/30 select-none shrink-0 w-8">
                        {step.step}
                      </span>
                      <div className="space-y-1 pt-1">
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{step.text}</p>
                        {step.tip && (
                          <p className="text-xs text-gold italic">{step.tip}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="divider-gradient" />

          <div className="text-center space-y-5">
            <h2 className="font-serif text-h2-m font-semibold">Precisa dos produtos para esta receita?</h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed max-w-xl mx-auto">
              Entre em contato com nossa equipe para informações sobre fornecimento dos produtos MSM utilizados nesta receita.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <CommercialCta
                label="Solicitar produtos"
                context={`Receita ${recipe.title}`}
                fallbackPath="/contato#food_service"
              />
              <Link href="/receitas" className="btn-secondary text-[rgb(var(--text))]">
                Mais receitas
              </Link>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
