import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Quem somos — Somatec Blocking',
  description:
    'Fundada em 1999 em Dracena-SP, a Somatec Blocking é especialista em eficiência energética e qualidade de energia. 26 anos de atuação técnica, sem nenhum acidente.',
  alternates: { canonical: '/a-somatec/quem-somos' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const values = [
  { title: 'Ética', description: 'Estabelecemos uma conversa sincera desde a prospecção até a comprovação de resultados.' },
  { title: 'Inovação', description: 'Acompanhamos a evolução do setor e trazemos tecnologia no desenvolvimento de soluções em eficiência energética.' },
  { title: 'Compromisso', description: 'Estamos comprometidos com a entrega final e a resolução das dores dos nossos clientes.' },
  { title: 'Sustentabilidade', description: 'Ao promover economia e segurança elétrica, reduzimos o descarte de lixo eletrônico e o desperdício de recursos.' },
];

export default function QuemSomosPage() {
  return (
    <>
      <PageHero
        eyebrow="A Somatec Blocking"
        title="Quem somos"
        description="Uma empresa nacional construída sobre excelência técnica, comprovação científica e parcerias de longo prazo com quem mantém a indústria funcionando."
        breadcrumbs={[{ label: 'A Somatec', href: '/a-somatec' }, { label: 'Quem somos' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* História */}
        <div className="max-w-3xl mx-auto space-y-5">
          <span className="eyebrow">Desde 1999</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Autoridade é entender a planta antes de propor a solução
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fundada em 1999 em Dracena, interior de São Paulo, a Somatec Blocking nasceu voltada
            à criação de produtos inovadores de alta performance e a serviços prestados com
            excelência técnica. Ao longo dos anos, nos tornamos especialistas em projetos de
            gestão da eficiência energética, trabalhando na melhoria da qualidade de energia das
            empresas — com benefícios que superam os custos das soluções.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Cada projeto é criado de forma única, considerando as necessidades da planta elétrica
            de cada cliente. Não abordamos pelos problemas — abordamos pelas necessidades reais de
            cada operação, comprovando nossa eficácia por meio de laudos e confirmações
            laboratoriais. Em <strong className="text-[rgb(var(--text))]">26 anos de atuação, não
            registramos nenhum acidente</strong>: nossas instalações são feitas com a rede
            desligada e nossos produtos atuam de forma passiva, em paralelo ao circuito.
          </p>
        </div>

        {/* Missão / Posicionamento */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
          <div className="space-y-4">
            <span className="eyebrow">O que fazemos</span>
            <h3 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
              Melhorar a qualidade da energia da indústria
            </h3>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Desenvolvemos produtos e serviços em eficiência energética para melhorar a qualidade
              da energia elétrica em empresas e indústrias, por meio de soluções personalizadas para
              cada necessidade de negócio.
            </p>
          </div>
          <div className="space-y-4">
            <span className="eyebrow">Por que fazemos</span>
            <h3 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
              Transformar o setor e o país
            </h3>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Para gerar transformação no segmento de eficiência energética e contribuir com o
              desenvolvimento sustentável — reduzindo perdas, queimas de equipamentos, paradas de
              produção e a geração de lixo eletrônico.
            </p>
          </div>
        </div>

        <div className="divider-gradient" />

        {/* Valores */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Nossos valores</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que guia cada decisão
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ title, description }) => (
              <div
                key={title}
                className="p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
              >
                <h3 className="font-sans font-semibold text-lg mb-2 text-[rgb(var(--text))]">{title}</h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Pronto para proteger a sua operação?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com a engenharia da Somatec Blocking e descubra como o Sistema Master Block IoT
            pode reduzir paradas e danos elétricos na sua planta.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Falar com a engenharia"
              context="Página Quem somos"
              fallbackPath="/contato"
            />
            <Link href="/produtos" className="btn-secondary text-[rgb(var(--text))]">
              Conheça o Master Block
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
