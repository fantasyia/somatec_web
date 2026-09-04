import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import Link from 'next/link';
import { CONTACT, whatsappHref } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Contato — Somatec Blocking',
  description:
    'Fale com a engenharia da Somatec Blocking. Diagnóstico de qualidade de energia e proteção contra surtos (Master Block) para a indústria. São Paulo-SP.',
  alternates: { canonical: '/contato' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

// Tudo sai de lib/constants/site.ts — antes esses valores estavam escritos à
// mão aqui, no JSON-LD e no rodapé, e trocar um deixava os outros mentindo.
const CONTACTS = [
  {
    Icon: MessageCircle,
    label: 'WhatsApp',
    value: CONTACT.whatsappDisplay,
    href: whatsappHref('Olá! Vim pelo site da Somatec Blocking e gostaria de falar com o comercial.'),
  },
  {
    Icon: Mail,
    label: 'E-mail',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
  {
    Icon: MapPin,
    label: 'Endereço',
    value: CONTACT.address,
    href: `https://maps.google.com/?q=${encodeURIComponent(
      `${CONTACT.endereco.logradouro}, ${CONTACT.endereco.bairro}, ${CONTACT.endereco.cidade} - ${CONTACT.endereco.uf}, ${CONTACT.endereco.cep}`,
    )}`,
  },
] as const;

export default function ContatoPage() {
  return (
    <>
      {/* Hero compacto */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-deep_navy texture-dark text-text_light overflow-hidden">
        <div className="container-msm">
          <div className="max-w-3xl space-y-4 animate-fade-up">
            {/* ⛔ Era "Vamos diagnosticar a sua planta" — "diagnosticar" é a
                medição prévia que a Somatec parou de fazer em 20/08.

                🔒 COPY APROVADA pela master (despacho no card, 03/09 19:06).
                O motivo dela: o subtítulo logo abaixo já diz "Conte o que
                acontece na sua operação… e nossa equipe retorna com o próximo
                passo". O H1 prometia uma coisa e o parágrafo descrevia outra;
                agora os dois falam da mesma ação. */}
            <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
              Conte o que está acontecendo na sua planta
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-xl text-pretty">
              Conte o que acontece na sua operação — paradas, queimas, travamentos — e nossa
              equipe retorna com o próximo passo.
            </p>
          </div>
        </div>
      </section>

      {/* Formulário + contatos */}
      <section className="container-msm py-10 md:py-14" aria-label="Formulário de contato">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start space-y-8">
            <div className="space-y-3">
              <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-tight">
                Como podemos ajudar?
              </h2>
              <p className="text-base leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                Preencha o formulário ou fale direto pelos nossos canais. Atendemos indústrias em
                todo o Brasil.
              </p>
            </div>

            <ul className="space-y-4">
              {CONTACTS.map(({ Icon, label, value, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group flex items-start gap-3.5 text-sm"
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-gold/10 text-gold">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="pt-0.5">
                      <span className="block text-[11px] font-semibold text-[rgb(var(--text-muted))]">
                        {label}
                      </span>
                      <span className="block font-semibold text-[rgb(var(--text))] group-hover:text-gold transition-colors">
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-sm text-[rgb(var(--text-muted))]">
              Ainda com dúvidas técnicas?{' '}
              <Link href="/faq" className="text-gold hover:underline font-semibold">
                Veja as perguntas frequentes
              </Link>
              .
            </p>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-8 p-6 md:p-10 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <ContactForm variant="contato_geral" defaultInterestType="b2b" sourcePage="/contato" />
          </div>
        </div>
      </section>
    </>
  );
}
