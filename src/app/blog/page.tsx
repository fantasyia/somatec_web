import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Blog', robots: { index: false, follow: true } };

export default function BlogPage() {
  return (
    <PlaceholderPage
      eyebrow="Blog MSM"
      title="Em breve"
      description="Conteúdos sobre indústria, food service, produtos, receitas, soluções B2B, terceirização, envase e novidades das nossas marcas."
      breadcrumbs={[{ label: 'Blog' }]}
      comingSoonNote="O blog institucional MSM será lançado em breve. Acompanhe novidades, tendências e análises de mercado pelos nossos canais."
    />
  );
}
