import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa simples de aterramento dedicado (despacho #4): o antigo slide do
 * carrossel de soluções vira uma seção enxuta abaixo dos cases — o conteúdo
 * não some do site, só sai do topo. Copy do slide oficial (admin/home).
 */
export function HomeAterramento() {
  return (
    <section aria-label="Aterramento dedicado">
      <div className="container-msm py-10 md:py-14">
        <Reveal>
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="space-y-3 md:col-span-7">
              <h2 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
                Aterramento dedicado, conforme a NBR 5410
              </h2>
              <p className="text-[rgb(var(--text-muted))] leading-relaxed max-w-xl">
                Sistema de aterramento e equipotencialização próprio, conforme a
                NBR 5410 — a base para a proteção funcionar.
              </p>
              <Link
                href="/solucoes/protecao-contra-surtos"
                className="group inline-flex items-center gap-1.5 pt-1 font-sans text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
              >
                Ver solução
                <ChevronRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-card-lg border border-[rgb(var(--border))] md:col-span-5">
              <Image
                src="/home/sol-aterramento.webp"
                alt="Sistema de aterramento dedicado Somatec"
                fill
                loading="lazy"
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
