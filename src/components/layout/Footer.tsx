import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { FOOTER_COLUMNS } from '@/lib/constants/navigation';
import { SITE, SOCIALS as ENV_SOCIALS } from '@/lib/constants/site';
import { type Socials, type Certification } from '@/lib/data/site-settings';
import { ProofBadges } from '@/components/ui/ProofBadges';

type FooterLink = { label: string; href: string };
type FooterColumnData = { title: string; links: FooterLink[] };

type Props = {
  columns?: FooterColumnData[];
  /** Vem de site_settings.socials (admin). Cai pras env vars se null. */
  socials?: Socials;
  /** Vem de site_settings.certifications (admin). Cai no fallback se vazio. */
  certifications?: Certification[];
};

export function Footer({ columns = FOOTER_COLUMNS, socials }: Props) {
  const year = new Date().getFullYear();

  // Prioridade: prop (site_settings) → env var → vazio
  const linkedin = socials?.linkedin ?? ENV_SOCIALS.linkedin ?? '';
  const instagram = socials?.instagram ?? ENV_SOCIALS.instagram ?? '';
  const youtube = socials?.youtube ?? ENV_SOCIALS.youtube ?? '';

  const SOCIAL_LINKS = [
    { label: 'LinkedIn', href: linkedin, Icon: Linkedin },
    { label: 'Instagram', href: instagram, Icon: Instagram },
    { label: 'YouTube', href: youtube, Icon: Youtube },
  ].filter((s) => s.href && s.href.length > 0);

  return (
    <footer className="relative bg-deep_navy texture-diagonal text-text_light mt-10 md:mt-20">
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
              {SITE.description}
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
            {columns.map((col) => (
              <div key={col.title}>
                {/* Marca: laranja é exclusivo de CTA/Master Block — cabeçalho de
                    coluna usa branco. */}
                <h3 className="text-sm font-semibold text-white mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Provas reais da Somatec (substitui os shields placeholder) */}
        <div className="mt-16 max-w-3xl">
          <ProofBadges variant="dark" />
        </div>

        {/* Divider */}
        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Copyright */}
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/50">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
