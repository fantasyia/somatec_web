import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da Somatec Blocking — como tratamos os dados informados nos formulários de contato, em conformidade com a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const sections = [
  {
    title: 'Quem somos',
    body: 'A Somatec Blocking (Somatecblocking UF Eletroeletrônicos LTDA, CNPJ 16.774.052/0001-55) é uma empresa nacional do setor eletroeletrônico, especializada em eficiência energética e proteção elétrica para a indústria. Este site tem caráter exclusivamente institucional e comercial.',
  },
  {
    title: 'Dados coletados',
    body: 'Coletamos apenas os dados fornecidos voluntariamente por você por meio dos formulários de contato: nome, e-mail, telefone, empresa, cargo e mensagem. Não coletamos dados sensíveis conforme definição da LGPD, nem realizamos rastreamento comportamental.',
  },
  {
    title: 'Finalidade do tratamento',
    body: 'Os dados coletados são utilizados exclusivamente para responder às suas solicitações comerciais e de contato, encaminhar propostas e informações sobre produtos e serviços da Somatec Blocking, e cumprir obrigações legais quando aplicável.',
  },
  {
    title: 'Base legal',
    body: 'O tratamento de dados é realizado com base no legítimo interesse comercial (Art. 7º, IX da LGPD) e no consentimento expresso do titular, conforme indicado nos formulários. Você pode retirar seu consentimento a qualquer momento.',
  },
  {
    title: 'Compartilhamento de dados',
    body: 'Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins publicitários. Os dados podem ser compartilhados com prestadores de serviço tecnológico que nos auxiliam na operação do site, sempre sob obrigação contratual de confidencialidade.',
  },
  {
    title: 'Retenção de dados',
    body: 'Mantemos seus dados pelo tempo necessário para atender à finalidade da coleta ou para cumprir obrigações legais. Dados de formulários de contato são retidos pelo período comercialmente razoável para acompanhamento da solicitação.',
  },
  {
    title: 'Seus direitos',
    body: 'Nos termos da LGPD (Lei nº 13.709/2018), você tem direito a confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou desatualizados, solicitar anonimização ou exclusão, revogar consentimento e obter informações sobre compartilhamentos. Para exercer seus direitos, entre em contato conosco.',
  },
  {
    title: 'Segurança',
    body: 'Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, destruição ou divulgação indevida, em conformidade com as melhores práticas de segurança da informação.',
  },
  {
    title: 'Contato do encarregado (DPO)',
    body: 'Para questões relacionadas à proteção de dados, entre em contato com nossa equipe pelo e-mail comercial indicado na página de contato do site.',
  },
];

export default function PoliticaPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Política de Privacidade"
        description="Como tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD)."
        breadcrumbs={[{ label: 'Política de Privacidade' }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-12">
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Última atualização: maio de 2025 — versão v1.0
          </p>

          {sections.map((s) => (
            <div key={s.title} className="space-y-3">
              <h2 className="font-serif text-h3-m font-semibold">{s.title}</h2>
              <p className="text-[rgb(var(--text-muted))] leading-relaxed">{s.body}</p>
            </div>
          ))}

          <div className="divider-gradient" />

          <div className="space-y-3 text-sm text-[rgb(var(--text-muted))]">
            <p>
              Dúvidas ou solicitações relacionadas à privacidade?{' '}
              <Link href="/contato" className="text-gold hover:underline underline-offset-2">
                Entre em contato
              </Link>
              .
            </p>
            <p>
              Veja também nossa{' '}
              <Link href="/cookies" className="text-gold hover:underline underline-offset-2">
                Política de Cookies
              </Link>{' '}
              e{' '}
              <Link href="/termos-de-uso" className="text-gold hover:underline underline-offset-2">
                Termos de Uso
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
