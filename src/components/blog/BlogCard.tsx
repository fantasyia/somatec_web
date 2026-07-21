import Image from 'next/image';
import Link from 'next/link';
import { Activity, Award, Calculator, ChevronRight, Clock, Factory, FileText, Home, ShieldCheck, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BlogPost } from '@/lib/constants/blog';

const CLUSTER_ICON: Record<string, LucideIcon> = {
  'Custo & ROI': Calculator,
  'Proteção Elétrica': ShieldCheck,
  'Auto-Diagnóstico': Activity,
  Cases: Award,
  Setores: Factory,
  Residencial: Home,
  Comércio: Store,
};

function ClusterPill({ cluster }: { cluster: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-cyan/10 px-2.5 py-1 font-sans text-[11px] font-semibold text-cyan">
      {cluster}
    </span>
  );
}

/** Placeholder quando não há hero real: gradiente navy→ciano + ícone do cluster. */
function HeroPlaceholder({ cluster }: { cluster: string }) {
  const Icon = CLUSTER_ICON[cluster] ?? FileText;
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: 'linear-gradient(135deg, rgb(0,65,110) 0%, rgb(0,140,200) 100%)' }}
      aria-hidden="true"
    >
      <Icon className="h-10 w-10 text-white/85" strokeWidth={1.5} />
    </div>
  );
}

type BlogCardProps = {
  post: BlogPost;
  /** 'featured' = card grande (hero maior, excerpt visível, CTA interno). */
  variant?: 'featured' | 'default';
  /** 'horizontal' = hero à esquerda + texto à direita (destaque largo da /blog). */
  orientation?: 'vertical' | 'horizontal';
  /** Prioriza o carregamento da imagem (hero acima da dobra). */
  priority?: boolean;
};

export function BlogCard({
  post,
  variant = 'default',
  orientation = 'vertical',
  priority = false,
}: BlogCardProps) {
  const featured = variant === 'featured';
  const horizontal = orientation === 'horizontal';

  return (
    <article
      className={`group relative flex h-full overflow-hidden card-elevated ${
        horizontal ? 'flex-col md:flex-row' : 'flex-col'
      }`}
    >
      {/* Hero 16:9 */}
      <div
        className={`relative aspect-video w-full overflow-hidden ${
          horizontal ? 'md:aspect-auto md:w-1/2 md:min-h-[300px] md:self-stretch' : ''
        }`}
      >
        {post.heroUrl ? (
          <Image
            src={post.heroUrl}
            alt={post.titulo}
            fill
            priority={priority}
            sizes={featured ? '(max-width: 1024px) 100vw, 620px' : '(max-width: 1024px) 100vw, 300px'}
            className="object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.03]"
          />
        ) : (
          <HeroPlaceholder cluster={post.cluster} />
        )}
      </div>

      {/* Corpo */}
      <div
        className={`flex flex-1 flex-col ${featured ? 'gap-3 p-6 md:p-7' : 'gap-2.5 p-5'} ${
          horizontal ? 'md:w-1/2 md:justify-center' : ''
        }`}
      >
        <div>
          <ClusterPill cluster={post.cluster} />
        </div>

        <h3
          className={`font-serif font-bold leading-snug text-[rgb(var(--text))] ${
            featured ? 'text-2xl md:text-[26px]' : 'text-lg'
          }`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors after:absolute after:inset-0 group-hover:text-cyan"
          >
            {post.titulo}
          </Link>
        </h3>

        <p
          className={`text-[rgb(var(--text-muted))] ${
            featured ? 'text-[15px] leading-relaxed' : 'line-clamp-2 text-sm leading-relaxed'
          }`}
        >
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className={`flex items-center gap-1.5 pt-1 font-sans text-xs text-[rgb(var(--text-muted))] ${featured ? '' : 'mt-auto'}`}>
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span>{post.tempoLeitura} min de leitura</span>
        </div>

        {/* CTA interno (dupla conversão) — z-10 fica acima do stretched link
            do card. Renderiza sempre que o post define ctaInterno (destaque e
            cards NI). */}
        {post.ctaInterno && (
          <Link
            href={post.ctaInterno.href}
            className={`relative z-10 inline-flex w-fit items-center gap-1 font-sans font-semibold text-cyan transition-colors hover:text-cyan/80 ${
              featured ? 'mt-2 text-sm' : 'mt-1 text-[13px]'
            }`}
          >
            {post.ctaInterno.label}
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
