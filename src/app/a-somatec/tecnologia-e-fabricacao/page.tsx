import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Gauge, ClipboardCheck, Layers } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Tecnologia e fabricação — Somatec Blocking',
  description:
    'Sistema Master Block IoT: filtro híbrido patenteado que atua em 100 kHz, software de gestão on-line de qualidade de energia e inspeções periódicas. Fabricação exclusiva.',
  alternates: { canonical: '/a-somatec/tecnologia-e-fabricacao' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const capabilities = [
  {
    icon: Layers,
    title: 'Filtro híbrido patenteado',
    description:
      'O Master Block é um supressor com filtro passivo, patenteado e de fabricação exclusiva. Atua em 100 kHz — a faixa dos VTCD e transientes que os DPS comuns não alcançam.',
  },
  {
    icon: Gauge,
    title: 'Software de gestão on-line',
    description:
      'O componente IoT do sistema: monitora em tempo real a eficácia do Master Block, a vida útil e as condições de qualidade de energia da rede (níveis de THDv, idade dos ativos).',
  },
  {
    icon: ClipboardCheck,
    title: 'Inspeções periódicas',
    description:
      'Três visitas técnicas por ano avaliam as condições físicas do Master Block, dos quadros de distribuição e dos equipamentos do processo.',
  },
  {
    icon: Cpu,
    title: 'Proteção em cascata + aterramento',
    description:
      'Instalação em paralelo, em cascata (entrada, quadro e junto ao equipamento sensível), com sistema de aterramento dedicado conforme a NBR 5410.',
  },
];

export default function TecnologiaFabricacaoPage() {
  return (
    <>
      <PageHero
        title="Tecnologia e fabricação"
        description="O Sistema Master Block IoT combina hardware, software e serviço — não é um produto instalado e esquecido, mas uma engenharia que protege e comprova a proteção em dados."
        breadcrumbs={[{ label: 'A Somatec', href: '/a-somatec' }, { label: 'Tecnologia e fabricação' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* Intro editorial */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Engenharia contra os VTCD
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Os VTCD — variações de tensão de curta duração, abaixo de 1 segundo — e os transientes
            na faixa de 100 kHz superam os dispositivos de proteção padrão do mercado e são a causa
            de boa parte das queimas e paradas na indústria. O Master Block é um filtro híbrido que
            atua exatamente nessa faixa: se necessário, ele se sacrifica pela rede, mantendo a
            instalação intacta.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A diferença do sistema está em unir a proteção física a um software de gestão on-line que
            comprova, em tempo real, que a proteção está funcionando — algo que nenhum DPS comum
            oferece.
          </p>
        </div>

        <div className="divider-gradient" />

        {/* Capabilities grid */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que estrutura o Sistema Master Block IoT
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-5 p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
              >
                <Icon
                  className="h-7 w-7 text-gold shrink-0 mt-0.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div className="space-y-1.5">
                  <h3 className="font-sans font-semibold text-[rgb(var(--text))]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Conheça a linha completa
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            São 12 modelos de Master Block, de 8 kA a 100 kA, para do pequeno comércio à indústria pesada.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Falar com a engenharia"
              context="Tecnologia e fabricação"
              fallbackPath="/contato"
            />
            <Link href="/produtos" className="btn-secondary text-[rgb(var(--text))]">
              Ver modelos MB-01 a MB-12
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
