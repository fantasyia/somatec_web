import type { Metadata } from 'next';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contato — Somatec Blocking',
  description:
    'Fale com a engenharia da Somatec Blocking. Diagnóstico de qualidade de energia e proteção contra surtos (Master Block) para a indústria. Dracena-SP.',
  alternates: { canonical: '/contato' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const CONTACTS = [
  {
    Icon: MessageCircle,
    label: 'WhatsApp',
    value: '(18) 98138-5088',
    href: 'https://wa.me/5518981385088',
  },
  {
    Icon: Phone,
    label: 'Telefone',
    value: '(11) 91764-4757',
    href: 'tel:+5511917644757',
  },
  {
    Icon: Mail,
    label: 'E-mail',
    value: 'somatec@somatecblocking.com.br',
    href: 'mailto:somatec@somatecblocking.com.br',
  },
  {
    Icon: MapPin,
    label: 'Endereço',
    value: 'Rua XV de Novembro, 743 — Centro, Dracena-SP',
    href: 'https://maps.google.com/?q=Rua+XV+de+Novembro,+743,+Centro,+Dracena-SP',
  },
] as const;

export default function ContatoPage() {
  return (
    <>
      {/* Hero compacto */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-deep_navy text-text_light overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div className="container-msm">
          <div className="max-w-3xl space-y-4 animate-fade-up">
            <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
              Vamos diagnosticar a sua planta
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-xl text-pretty">
              Conte o que acontece na sua operação — paradas, queimas, travamentos — e nossa
              equipe retorna com o próximo passo. O diagnóstico inicial é sem custo.
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
                      <span className="block text-[11px] uppercase tracking-wide font-semibold text-[rgb(var(--text-muted))]">
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
