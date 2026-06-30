import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Fale com o time comercial da MSM. Atendimento especializado para Food Service, B2B, Terceirização, Envase e Marcas Próprias.',
  robots: { index: true, follow: true },
};

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
            <span className="eyebrow inline-block">Comercial</span>
            <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
              Fale com a MSM
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-xl text-pretty">
              Selecione o tipo de interesse e nossa equipe entrará em contato pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Formulário único */}
      <section className="container-msm py-10 md:py-14" aria-label="Formulário de contato">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start space-y-6">
            <Mail className="h-8 w-8 text-gold" strokeWidth={1.5} aria-hidden="true" />
            <div className="space-y-3">
              <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-tight">
                Como podemos ajudar?
              </h2>
              <p className="text-base leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                Preencha o formulário e nossa equipe entrará em contato pelo WhatsApp em breve.
              </p>
            </div>
            <div className="space-y-2 text-sm text-[rgb(var(--text-muted))]">
              <p>
                Quer ser representante?{' '}
                <Link href="/representantes" className="text-gold hover:underline font-semibold">
                  Cadastre-se aqui
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-8 p-6 md:p-10 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <ContactForm variant="contato_geral" sourcePage="/contato" />
          </div>
        </div>
      </section>
    </>
  );
}
