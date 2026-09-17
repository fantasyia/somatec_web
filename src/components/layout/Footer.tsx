import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { FOOTER_COLUMNS } from '@/lib/constants/navigation';
import { SITE, CONTACT, EMPRESA, SOCIALS } from '@/lib/constants/site';
import { type Certification } from '@/lib/data/site-settings';
import { PROOFS } from '@/components/ui/ProofBadges';
import { FooterColumns } from '@/components/layout/FooterColumns';

type FooterLink = { label: string; href: string };
type FooterColumnData = { title: string; links: FooterLink[] };

type Props = {
  columns?: FooterColumnData[];
  /** Vem de site_settings.certifications (admin). Cai no fallback se vazio. */
  certifications?: Certification[];
  /** Rotas /blog/... do público não-industrial, resolvidas no servidor. */
  slugsNi?: string[];
};

export function Footer({ columns = FOOTER_COLUMNS, slugsNi = [] }: Props) {
  const year = new Date().getFullYear();

  // Fonte única: `SOCIALS` em lib/constants/site.ts. Até 17/09 isto vinha de
  // `site_settings.socials` com fallback pra env, e o JSON-LD lia a env direto
  // — dois caminhos, e arrumar um deixava o outro errado em silêncio.
  const SOCIAL_LINKS = [
    { label: 'LinkedIn', href: SOCIALS.linkedin, Icon: Linkedin },
    { label: 'Instagram', href: SOCIALS.instagram, Icon: Instagram },
    { label: 'YouTube', href: SOCIALS.youtube, Icon: Youtube },
    // ⚠️ Só `https:` (B11 da auditoria 13/09). A guarda fica mesmo agora que o
    // valor é constante: é uma linha, e ela é o que impede um `javascript:`
    // virar link executável no rodapé de TODA página se a fonte mudar de novo.
  ].filter((s) => s.href && /^https:\/\//i.test(s.href));

  return (
    <footer className="relative bg-[rgb(var(--navy-end))] texture-dark text-text_light mt-10 md:mt-20">
      <div className="container-msm pt-10 md:pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4 space-y-6">
            <Image
              src="/logo-somatec-white.png"
              alt="Somatec Blocking"
              width={792}
              height={248}
              className="h-10 w-auto"
            />
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              {SITE.tagline}
            </p>

            {SOCIAL_LINKS.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-gold hover:border-gold transition-colors duration-200 ease-premium"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Client: precisa da rota pra esconder as ferramentas industriais
                nas páginas NI. O resto do rodapé segue no servidor. */}
            <FooterColumns columns={columns} slugsNi={slugsNi} />
          </div>
        </div>

        {/* Faixa de TRUST compacta (despacho): os 4 selos + clientes atendidos
            vivem SÓ aqui — selos menores/discretos, não os cards grandes. */}
        <div className="mt-14 space-y-4">
          <ul
            aria-label="Provas e reconhecimentos da Somatec"
            className="flex flex-wrap items-center gap-x-7 gap-y-2.5"
          >
            {PROOFS.map(({ Icon, main, sub }) => (
              <li key={main} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[rgb(var(--gold-soft))]" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-sans text-xs leading-snug text-white/75">
                  <span className="font-semibold text-white/90">{main}</span>
                  <span className="text-white/50"> · {sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Identificação legal do fornecedor — Decreto 7.962/2013 (o site vende
            direto): razão social, CNPJ, endereço físico e e-mail em TODA página.
            Texto de EMPRESA/CONTACT (fonte única), nunca escrito aqui. */}
        <address className="mt-8 space-y-1 text-xs not-italic leading-relaxed text-white/50">
          <div>{EMPRESA.linha}</div>
          <div>{CONTACT.address}</div>
          <div>
            <a href={`mailto:${CONTACT.email}`} className="hover:text-gold transition-colors">
              {CONTACT.email}
            </a>
          </div>
        </address>

        {/* Copyright */}
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/50">
          <div>© {year} {SITE.fullName}. Todos os direitos reservados.</div>
          <div className="flex items-center gap-6">
            <Link href="/politica-de-privacidade" className="hover:text-gold transition-colors">
              Política de privacidade
            </Link>
            <Link href="/termos-de-uso" className="hover:text-gold transition-colors">
              Termos de uso
            </Link>
            <Link href="/cookies" className="hover:text-gold transition-colors">
              Cookies
            </Link>
            {/* "Preferências de cookies" e não "Rever minha escolha" porque é o
                rótulo que a pessoa VARRE procurando num rodapé (decisão da
                master, 14/09). Dentro da página o botão fala em primeira
                pessoa, e a diferença é de propósito.

                Leva à ÂNCORA, não abre o banner: a pessoa chega na seção, vê
                qual é a escolha dela hoje e por que aquilo importa, e só então
                decide. Um clique a mais e muito menos confusão — e mantém um
                lugar só onde o consentimento se administra, que é pra onde a
                política de privacidade já aponta. */}
            <Link href="/cookies#preferencias" className="hover:text-gold transition-colors">
              Preferências de cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
