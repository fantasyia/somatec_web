import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function HomeBlogTeaser() {
  return (
    <section className="container-msm py-8 md:py-12" aria-label="Blog Somatec">
      <div
        className="relative overflow-hidden rounded-card-lg border border-[rgb(var(--border))]"
        style={{
          background:
            'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
        }}
      >
        {/* Pattern sutil */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 16px)',
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 md:p-12 lg:p-14 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="eyebrow inline-block">Conteúdo técnico</span>
            <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-text_light text-balance leading-tight">
              Proteção contra surtos, qualidade de energia e NBR 5410.
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-white/75 max-w-2xl text-pretty">
              Estamos preparando artigos técnicos sobre proteção contra surtos, transientes de alta frequência, aterramento e casos reais de equipamentos protegidos pelo MasterBlock.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-gold hover:text-gold-soft transition-colors group whitespace-nowrap"
            >
              Saiba mais
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
