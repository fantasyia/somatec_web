import Link from 'next/link';
import { SectionHeading } from './SectionHeading';
import { SOLUTIONS_FALLBACK } from '@/lib/constants/home-fallback';
import type { Solution } from '@/types/database';
import {
  ChefHat,
  Building2,
  Factory,
  Package,
  Tag,
  Truck,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  'food-service': ChefHat,
  b2b: Building2,
  terceirizacao: Factory,
  'terceirizacao-de-producao': Factory,
  envase: Package,
  'marcas-proprias': Tag,
  distribuicao: Truck,
};

type Card = {
  slug: string;
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
};

function normalize(real: Solution[]): Card[] {
  if (real.length > 0) {
    return real.map((s) => ({
      slug: s.slug,
      title: s.title,
      description: s.short_description ?? '',
      href: s.route_path,
      Icon: ICON_BY_SLUG[s.slug] ?? Layers,
    }));
  }
  return SOLUTIONS_FALLBACK.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    href: s.href,
    Icon: s.Icon,
  }));
}

type Props = { solutions: Solution[] };

export function HomeSolutions({ solutions }: Props) {
  const cards = normalize(solutions);

  return (
    <section
      className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]"
      aria-label="Nossas soluções"
    >
      <div className="container-msm py-10 md:py-14">
        <SectionHeading
          eyebrow="Nossas soluções"
          title="Soluções completas para o seu negócio"
          viewAllHref="/solucoes"
          viewAllLabel="Ver todas"
        />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {cards.map(({ slug, title, description, href, Icon }) => (
            <Link
              key={slug}
              href={href}
              className="group flex flex-col gap-3 p-5 md:p-7 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--bg))] transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light"
            >
              <Icon
                className="h-6 w-6 text-[rgb(var(--text-muted))] group-hover:text-gold transition-colors duration-[250ms]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="space-y-1.5 flex-1">
                <h3 className="font-sans font-semibold text-sm md:text-base text-[rgb(var(--text))]">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))] line-clamp-3 hidden sm:block">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
