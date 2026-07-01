import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Política de Cookies da Somatec Blocking — utilizamos apenas cookies técnicos e essenciais ao funcionamento do site, sem rastreamento ou publicidade de terceiros.',
  alternates: { canonical: '/cookies' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const sections = [
  {
    title: 'O que são cookies?',
    body: 'Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site reconheça seu dispositivo e lembre informações sobre sua visita, como preferências de idioma e configurações.',
  },
  {
    title: 'Cookies que utilizamos',
    body: 'Este site utiliza exclusivamente cookies técnicos e essenciais, necessários para o funcionamento correto das páginas, incluindo autenticação de área restrita, preferências de tema (claro/escuro) e segurança de formulários. Não utilizamos cookies de rastreamento ou publicidade de terceiros.',
  },
  {
    title: 'Cookies de sessão e persistentes',
    body: 'Cookies de sessão são temporários e expiram quando você fecha o navegador. Cookies persistentes permanecem no seu dispositivo por um período determinado ou até que sejam excluídos manualmente. As preferências de tema e consentimento LGPD são armazenadas localmente no seu dispositivo.',
  },
  {
    title: 'Como gerenciar cookies',
    body: 'Você pode configurar seu navegador para recusar todos os cookies ou ser notificado quando um cookie for enviado. Observe que, ao desativar cookies essenciais, algumas funcionalidades do site podem não operar corretamente. Consulte as instruções do seu navegador para gerenciamento de cookies.',
  },
  {
    title: 'Alterações nesta política',
    body: 'Esta política pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou por exigências legais. Recomendamos que você a consulte regularmente. A data da última atualização será sempre indicada no topo desta página.',
  },
];

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Política de Cookies"
        description="Como o site da Somatec Blocking utiliza cookies e tecnologias de armazenamento local."
        breadcrumbs={[{ label: 'Cookies' }]}
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
              Para dúvidas sobre o uso de cookies neste site, entre em{' '}
              <Link href="/contato" className="text-gold hover:underline underline-offset-2">
                contato
              </Link>{' '}
              com nossa equipe.
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
