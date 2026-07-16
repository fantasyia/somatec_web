import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Perguntas frequentes — Somatec Blocking',
  description:
    'Dúvidas sobre o Master Block, VTCD, qualidade de energia e o modelo de investimento sem risco da Somatec Blocking. Respostas técnicas para a indústria.',
  alternates: { canonical: '/faq' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

type QA = { q: string; a: string };

// Perguntas técnicas + objeções do playbook de vendas Somatec.
const FAQS: readonly QA[] = [
  {
    q: 'O que é o Master Block?',
    a: 'O Master Block é um filtro híbrido — supressor e protetor contra surtos elétricos — que atua em 100 kHz, fabricado e patenteado pela Somatec Blocking. Faz parte do Sistema Master Block IoT, que reúne o filtro, um software de gestão on-line de qualidade de energia e inspeções periódicas. Protege equipamentos e sistemas de automação contra os picos de tensão que causam queimas e paradas.',
  },
  {
    q: 'O que é VTCD e por que ele danifica meus equipamentos?',
    a: 'VTCD é a Variação de Tensão de Curta Duração: um pico de tensão que dura menos de 1 segundo — por exemplo, uma rede de 220 V que sobe a 400 V numa fração de segundo e queima a placa de um robô. Esses eventos, junto com transientes na faixa de 100 kHz, superam a atuação dos dispositivos de proteção padrão do mercado e travam ou danificam equipamentos automatizados.',
  },
  {
    q: 'Qual a diferença do Master Block para um DPS comum?',
    a: 'O DPS comum atua em frequências abaixo de 10 kHz. O Master Block atua em 100 kHz — a faixa onde estão os transientes de alta frequência que mais danificam CLPs, servos, inversores e placas eletrônicas. Ele complementa (não substitui) DPS, no-break, estabilizador e aterramento.',
  },
  {
    q: 'Já tenho aterramento, DPS, no-break e estou dentro das normas. Ainda faz sentido?',
    a: 'Sim. Todas essas proteções são recomendáveis, mas nenhuma é eficaz contra os VTCD e os surtos de descargas atmosféricas no nível que o Master Block protege. Em uma planta com instalações modernas e até subestação de 138 kV, ainda detectamos VTCD em níveis que colocavam a operação em risco. As normas não consideram a idade e as condições reais dos ativos.',
  },
  {
    q: 'Já tenho geração solar. Preciso mesmo disso?',
    a: 'Geração solar é fonte de energia, não melhora a qualidade da energia que circula na rede. A operação — e até os próprios inversores solares — continuam sujeitos aos efeitos das perturbações de qualidade de energia. Temos cases exatamente nesse cenário.',
  },
  {
    q: 'Estou implementando Indústria 4.0. Faz sentido investir agora?',
    a: 'Faz total sentido. A base da Indústria 4.0 são equipamentos eletrônicos inteligentes, com centrais de comando altamente sensíveis a perturbações de energia. VTCD causam desprogramações, mau funcionamento e danos permanentes. Qualidade de energia é pré-requisito para a 4.0 funcionar bem.',
  },
  {
    q: 'Como vou saber que o problema é qualidade de energia — e que o Master Block resolveu?',
    a: 'Durante o período de aprovação do projeto, medimos a rede e mostramos a presença das perturbações às quais as falhas podem ser atribuídas. Depois da instalação, as falhas caem (em alguns casos são eliminadas) e você acompanha essa atuação em tempo real pelo software de gestão de qualidade de energia.',
  },
  {
    q: 'A instalação pode causar algum acidente na minha rede?',
    a: 'Não. Em 26 anos de atuação não registramos nenhum acidente. As instalações são sempre feitas com a rede desligada, e os produtos são instalados em paralelo, atuando de forma passiva em relação ao circuito.',
  },
  {
    q: 'Como funciona o investimento sem risco?',
    a: 'Os primeiros passos — estudo da rede, projeto, proposta, instalação e período de avaliação (60 a 90 dias) — são sem custo. Você só passa a pagar a mensalidade se, ao final do teste, aprovar o resultado na sua operação. Se não houver resultado aprovado, a Somatec retira os equipamentos sem custo.',
  },
  {
    q: 'O Master Block funciona mesmo? Quem já usa?',
    a: 'Sim, com resultados medidos: Cinpal (92% de supressão de VTCD e ~R$120 mil/mês em prejuízos cessados), Nissin Foods (~R$1 milhão/ano), Stampline (R$560 mil/ano) e Grow Up, entre outras. A Somatec foi premiada no Concurso Acelera Startup da FIESP (2015) e atende marcas como BASF, Akzo Nobel/Tintas Coral e Acrilex.',
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />

      <PageHero
        title="Dúvidas sobre proteção e qualidade de energia"
        description="Reunimos as perguntas mais comuns de engenheiros e gestores de manutenção sobre o Master Block, os VTCD e o nosso modelo de investimento sem risco."
        breadcrumbs={[{ label: 'FAQ' }]}
      />

      <section className="container-msm py-12 md:py-16">
        <div className="max-w-3xl mx-auto divide-y divide-[rgb(var(--border))] border-y border-[rgb(var(--border))]">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <h2 className="font-sans font-semibold text-base md:text-lg text-[rgb(var(--text))]">
                  {f.q}
                </h2>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-[rgb(var(--text-muted))] leading-relaxed text-pretty">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 text-center space-y-5">
          <h2 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
            Não encontrou a sua dúvida?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com a engenharia da Somatec Blocking e receba um diagnóstico da sua planta, sem custo.
          </p>
          <CommercialCta
            label="Falar com a engenharia"
            context="Página FAQ"
            fallbackPath="/contato"
            className="inline-flex"
          />
        </div>
      </section>
    </>
  );
}
