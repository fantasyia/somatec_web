import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { RepresentanteForm } from '@/components/forms/RepresentanteForm';

export const metadata: Metadata = {
  title: 'Seja um representante',
  description:
    'Cadastre-se para receber informações sobre representação comercial da MSM.',
  robots: { index: true, follow: true },
};

export default function RepresentantesPage() {
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
            <span className="eyebrow inline-block">Trabalhe com a MSM</span>
            <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
              Seja um representante
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-2xl text-pretty">
              Cadastre-se para receber informações sobre representação comercial da MSM.
              Nossa equipe entrará em contato pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="container-msm py-10 md:py-14" aria-label="Cadastro de representante">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start space-y-5">
            <Users className="h-8 w-8 text-gold" strokeWidth={1.5} aria-hidden="true" />
            <span className="eyebrow inline-block">Para representantes</span>
            <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-tight">
              Atuação comercial em todo o Brasil
            </h2>
            <p className="text-base leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
              Buscamos representantes com experiência em Food Service, B2B e distribuição que
              compartilhem os valores de qualidade, parceria e crescimento mútuo da MSM.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[rgb(var(--text-muted))]">
              <li className="flex gap-2">
                <span className="text-gold mt-1">·</span>
                <span>Portfólio completo de marcas e produtos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold mt-1">·</span>
                <span>Suporte comercial e materiais de venda.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold mt-1">·</span>
                <span>Atendimento estruturado para Food Service e B2B.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7 p-6 md:p-8 lg:p-10 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <RepresentanteForm />
          </div>
        </div>
      </section>
    </>
  );
}
