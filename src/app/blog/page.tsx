import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Conteúdo técnico', robots: { index: false, follow: true } };

export default function BlogPage() {
  return (
    <PlaceholderPage
      eyebrow="Conteúdo Somatec"
      title="Em breve"
      description="Artigos técnicos sobre qualidade de energia, VTCD, proteção contra surtos e cases reais da indústria."
      breadcrumbs={[{ label: 'Conteúdo' }]}
      comingSoonNote="Estamos preparando o nosso espaço de conteúdo técnico e cases. Acompanhe novidades pelo LinkedIn e YouTube da Somatec Blocking."
    />
  );
}
