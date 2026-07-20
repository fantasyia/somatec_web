import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Zap, ShieldCheck, Cpu, Factory, Server, Layers } from 'lucide-react';
import { CTA_CARDS_FALLBACK } from '@/lib/constants/home-fallback';
import {
  buildCommercialCtaHref,
  getWhatsAppButtonConfig,
  isExternalCtaHref,
  type WhatsAppButtonConfig,
} from '@/lib/whatsapp-button';
import type { HomeCtaCard } from '@/types/database';
import type { LucideIcon } from 'lucide-react';

/**
 * Foto por card de segmento (Estúdio, aprovadas). Slot 16:9 fixo + object-cover
 * → sem layout shift. Card sem foto cai no placeholder neutro (mesmo formato).
 */
const PHOTO_BY_TITLE: Record<string, string> = {
  Alimentícia: '/home/seg-frigorifico.webp',
  Metalurgia: '/home/seg-metalurgia.webp',
  // Autopeças e Têxtil: fotos em produção no Estúdio — caem no placeholder neutro.
};

const ICON_BY_INTEREST: Record<string, LucideIcon> = {
  representante: ShieldCheck,
  food_service: Factory,
  b2b: Zap,
  terceirizacao: Cpu,
  envase: Server,
};

// Label legível (com acento) pro eyebrow "Para …". interest_type é um slug sem
// acentuação (ex: "terceirizacao"), então mapeamos pro nome correto.
const EYEBROW_BY_INTEREST: Record<string, string> = {
  representante: 'Representante',
  food_service: 'Food Service',
  b2b: 'B2B',
  terceirizacao: 'Terceirização',
  envase: 'Envase',
  marcas_proprias: 'Marcas Próprias',
  distribuicao: 'Distribuição',
};

// Interests que viram lead comercial (cliente final) — vão direto pro zap.
// Representante e outros perfis formais ficam no formulário.
const COMMERCIAL_INTERESTS = new Set([
  'food_service',
  'b2b',
  'terceirizacao',
  'envase',
  'marcas_proprias',
  'distribuicao',
]);

type CardItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  buttonLabel: string;
  Icon: LucideIcon;
};

function resolveCardHref(
  config: WhatsAppButtonConfig,
  interestType: string | null,
  title: string,
  fallback: string,
): { href: string; external: boolean } {
  if (interestType && COMMERCIAL_INTERESTS.has(interestType)) {
    const href = buildCommercialCtaHref(config, { context: title, fallbackPath: fallback });
    return { href, external: isExternalCtaHref(href) };
  }
  return { href: fallback, external: false };
}

function normalize(real: HomeCtaCard[], config: WhatsAppButtonConfig): CardItem[] {
  if (real.length > 0) {
    return real.map((c) => {
      const fallback = c.button_url ?? '/contato';
      const { href, external } = resolveCardHref(config, c.interest_type, c.title, fallback);
      return {
        id: c.id,
        eyebrow: 'Segmento',
        title: c.title,
        description: c.description ?? '',
        href,
        external,
        buttonLabel: c.button_label ?? 'Falar com o time',
        Icon: c.interest_type ? (ICON_BY_INTEREST[c.interest_type] ?? Layers) : Layers,
      };
    });
  }
  return CTA_CARDS_FALLBACK.map((c) => {
    const { href, external } = resolveCardHref(config, c.interest_type ?? null, c.title, c.cta.href);
    return {
      id: c.id,
      eyebrow: c.eyebrow,
      title: c.title,
      description: c.description,
      href,
      external,
      buttonLabel: c.cta.label,
      Icon: c.Icon,
    };
  });
}

type Props = { cards: HomeCtaCard[] };

// Mostra no máximo 3 cards na home (em grid lg:grid-cols-3 fica sem buraco).
// Para listar todas as segmentações, /contato tem a lista completa.
const MAX_CARDS = 4;

export async function HomeCta({ cards }: Props) {
  const config = await getWhatsAppButtonConfig();
  const items = normalize(cards, config).slice(0, MAX_CARDS);
  const headerCta = buildCommercialCtaHref(config, { fallbackPath: '/contato' });
  const headerExternal = isExternalCtaHref(headerCta);

  return (
    <section
      className="relative band-navy text-text_light overflow-hidden"
      aria-label="Fale conosco"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 16px)',
        }}
      />

      <div className="relative container-msm section-y-lg">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div className="space-y-3 max-w-xl">
            <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-tight">
              Como podemos ajudar você
            </h2>
          </div>
          {headerExternal ? (
            <a
              href={headerCta}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary self-start md:self-auto shrink-0 group"
            >
              Enviar mensagem
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </a>
          ) : (
            <Link
              href={headerCta}
              className="btn-primary self-start md:self-auto shrink-0 group"
            >
              Enviar mensagem
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08] rounded-card overflow-hidden border border-white/[0.08]">
          {items.map(({ id, title, description, href, external }) => {
            const cardClass = 'group flex flex-col overflow-hidden bg-deep_navy hover:bg-white/[0.05] transition-colors duration-[250ms] ease-premium';
            const photo = PHOTO_BY_TITLE[title];
            const body = (
              <>
                {/* Slot de foto 16:9 fixo — sem layout shift quando a imagem carrega */}
                <div className="relative aspect-video w-full overflow-hidden bg-navy-700">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(3,17,31) 100%)',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
                <h3 className="font-sans font-semibold text-base text-text_light group-hover:text-gold transition-colors duration-[250ms] text-balance">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-white/55 text-pretty flex-1">
                  {description}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-gold/60 group-hover:text-gold group-hover:gap-2 transition-all duration-200">
                  Saiba mais
                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                </span>
                </div>
              </>
            );
            return external ? (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {body}
              </a>
            ) : (
              <Link key={id} href={href} className={cardClass}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
