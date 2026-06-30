import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos de Uso do site institucional da MSM Indústria — condições de acesso e utilização do conteúdo, destinado a profissionais do mercado alimentício (food service e B2B).',
  alternates: { canonical: '/termos-de-uso' },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: 'Aceitação dos termos',
    body: 'Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Se não concordar com qualquer disposição aqui contida, não utilize o site. O uso continuado após alterações nos termos implica aceitação das condições atualizadas.',
  },
  {
    title: 'Natureza do site',
    body: 'Este site tem caráter exclusivamente institucional e informativo. As informações apresentadas sobre produtos, marcas e serviços são destinadas a profissionais do mercado alimentício (food service e B2B). O site não realiza vendas diretas ao consumidor final.',
  },
  {
    title: 'Propriedade intelectual',
    body: 'Todo o conteúdo deste site — incluindo textos, imagens, logotipos, marcas e layout — é de propriedade da MSM Alimentos ou de seus licenciantes, e está protegido pela legislação brasileira de direitos autorais e propriedade intelectual. É vedada a reprodução sem autorização expressa.',
  },
  {
    title: 'Uso permitido',
    body: 'Você pode navegar pelo site para fins informativos e de contato comercial. É vedado copiar, reproduzir, distribuir ou modificar qualquer conteúdo para fins comerciais sem autorização prévia por escrito, utilizar tecnologias de scraping ou automação para extrair dados, e tentar acessar áreas restritas sem credenciais válidas.',
  },
  {
    title: 'Limitação de responsabilidade',
    body: 'As informações deste site são fornecidas "no estado em que se encontram", sem garantias de completude ou adequação a fins específicos. A MSM Alimentos não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo deste site. Para informações comerciais detalhadas, utilize os canais de contato.',
  },
  {
    title: 'Links externos',
    body: 'Este site pode conter links para sites de terceiros. A MSM Alimentos não controla e não se responsabiliza pelo conteúdo, práticas de privacidade ou disponibilidade desses sites externos.',
  },
  {
    title: 'Alterações',
    body: 'Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas nesta página com atualização da data de revisão.',
  },
  {
    title: 'Lei aplicável',
    body: 'Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da MSM Alimentos para dirimir eventuais controvérsias.',
  },
];

export default function TermosPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Termos de Uso"
        description="Condições de uso do site institucional da MSM Alimentos."
        breadcrumbs={[{ label: 'Termos de Uso' }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-12">
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Última atualização: maio de 2025
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
              Dúvidas sobre estes termos?{' '}
              <Link href="/contato" className="text-gold hover:underline underline-offset-2">
                Fale conosco
              </Link>
              .
            </p>
            <p>
              Veja também nossa{' '}
              <Link href="/politica-de-privacidade" className="text-gold hover:underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
