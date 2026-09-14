import type { Metadata } from 'next';
import { comOpenGraph } from '@/lib/seo/metadata-pagina';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { RevisarConsentimento } from '@/components/layout/RevisarConsentimento';
import { COOKIES_DO_SITE, COOKIES_ATUALIZADO_EM } from '@/lib/constants/cookies';
import { CONTACT } from '@/lib/constants/site';

// =============================================================================
// F2-M6 DA AUDITORIA 13/09 — A PÁGINA DESCREVIA OUTRO SITE.
//
// O texto anterior afirmava "exclusivamente cookies técnicos e essenciais" e
// "não utilizamos cookies de rastreamento ou publicidade de terceiros", com o
// GTM carregando GA4 e Pixel do Meta logo ali. Citava uma preferência de tema
// que não existe, e estava datado de maio de 2025.
//
// Ninguém mentiu: a página foi escrita uma vez e o código andou sozinho depois.
//
// Copy da sessão master (`clients/somatec/reports/site/copy-cookies.md`,
// 14/09/2026). A TABELA é gerada de `COOKIES_DO_SITE` de propósito — repetir o
// inventário em prosa é exatamente como esta página envelheceu da primeira vez.
//
// ⚠️ Página de efeito jurídico. A master recomendou leitura de advogado antes
// de o NOINDEX sair.
// =============================================================================

export const metadata: Metadata = comOpenGraph({
  title: 'Política de Cookies',
  description:
    'Quais dados o site da Somatec Blocking guarda no seu navegador, por quanto tempo, e o que só é gravado com a sua autorização.',
  alternates: { canonical: '/cookies' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
});

const ONDE_FICA: Record<string, string> = {
  cookie: 'Cookie',
  localStorage: 'Armazenamento local',
  sessionStorage: 'Só nesta aba',
};

const PRECISA: Record<string, string> = {
  essencial: 'Não — o site precisa dele',
  funcional: 'Não',
  analitico: 'Sim',
  marketing: 'Sim',
};

export default function CookiesPage() {
  return (
    <>
      <PageHero
        title="Política de Cookies"
        description="Quais dados o site guarda no seu navegador, por quanto tempo e o que depende da sua autorização."
        breadcrumbs={[{ label: 'Cookies' }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Última atualização: {COOKIES_ATUALIZADO_EM}
          </p>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">O que esta página cobre</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Quando você visita este site, algumas informações ficam guardadas no seu navegador.
              Parte delas é necessária para o site funcionar. Outra parte só é gravada se você
              autorizar.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Esta página lista <strong className="text-[rgb(var(--text))]">todas</strong> elas, uma
              a uma, e diz qual é qual. A lista é gerada a partir do próprio código do site, e um
              teste automático reprova a publicação se o código passar a gravar algo que não esteja
              aqui.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">
              Sim, este site mede audiência e usa remarketing
            </h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Precisamos ser diretos, porque a versão anterior desta página dizia o contrário.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Com a sua autorização, o site carrega o{' '}
              <strong className="text-[rgb(var(--text))]">Google Analytics 4</strong>, que conta
              visitas e mostra quais páginas levam a um contato, e o{' '}
              <strong className="text-[rgb(var(--text))]">Meta Pixel</strong>, que liga um anúncio ao
              contato que ele gerou. Os dois entram pelo Gerenciador de Tags do Google, e os dois
              ficam desligados até você aceitar no banner.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Se você escolher &ldquo;Apenas essenciais&rdquo;, eles não carregam e nenhum desses
              cookies é gravado.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">Como a sua escolha é pedida</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Na primeira visita aparece um banner com duas opções:
            </p>
            <ul className="space-y-2 text-[rgb(var(--text-muted))]">
              <li className="leading-relaxed">
                <strong className="text-[rgb(var(--text))]">Apenas essenciais</strong> — o site grava
                só o que precisa para funcionar e para lembrar essa sua resposta. Nada de medição,
                nada de anúncio.
              </li>
              <li className="leading-relaxed">
                <strong className="text-[rgb(var(--text))]">Aceitar todos</strong> — além do
                essencial, autoriza medição de audiência e remarketing.
              </li>
            </ul>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Enquanto você não responde, medição e anúncios ficam bloqueados. Não é uma escolha por
              omissão: o bloqueio é o estado inicial, e só muda quando você clica.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-h3-m font-semibold">O que o site guarda</h2>
            {/* Rolagem própria: tabela larga não pode empurrar a página inteira. */}
            <div className="overflow-x-auto rounded-card border border-[rgb(var(--border))]">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="bg-[rgb(var(--surface))]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-sans font-semibold">Nome</th>
                    <th scope="col" className="px-4 py-3 font-sans font-semibold">Onde fica</th>
                    <th scope="col" className="px-4 py-3 font-sans font-semibold">Para quê</th>
                    <th scope="col" className="px-4 py-3 font-sans font-semibold">Quanto tempo</th>
                    <th scope="col" className="px-4 py-3 font-sans font-semibold">
                      Precisa da sua autorização
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES_DO_SITE.map((c) => (
                    <tr key={c.nome} className="border-t border-[rgb(var(--border))] align-top">
                      <td className="px-4 py-3 font-mono text-xs text-[rgb(var(--text))]">
                        {c.nome}
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-muted))]">
                        {ONDE_FICA[c.meio] ?? c.meio}
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{c.finalidade}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{c.retencao}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-muted))]">
                        {PRECISA[c.categoria] ?? (c.exigeConsentimento ? 'Sim' : 'Não')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 text-[rgb(var(--text-muted))]">
              <li className="leading-relaxed">
                <strong className="text-[rgb(var(--text))]">&ldquo;Onde fica&rdquo;</strong> separa
                cookie do resto. Cookie viaja junto com cada pedido que o seu navegador faz ao nosso
                servidor. O que está marcado como armazenamento local nunca sai do seu dispositivo,
                nem para nós, nem para ninguém.
              </li>
              <li className="leading-relaxed">
                <code className="font-mono text-xs">msm-cookie-consent</code> é uma chave antiga,
                herdada do modelo de site de outro cliente nosso. O site apenas lê, para não
                perguntar duas vezes a quem já respondeu. Nada novo é gravado nela.
              </li>
              <li className="leading-relaxed">
                <code className="font-mono text-xs">stc_attrib</code> guarda por qual campanha ou
                canal você chegou, para que um formulário enviado depois chegue com essa origem
                junto. Fica só conosco, não monta perfil e não vai para terceiros. Por isso é
                funcional, e não marketing.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-h3-m font-semibold">Mudar de ideia</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Sua resposta não é definitiva.
            </p>

            <RevisarConsentimento />

            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              O banner reabre e vale a resposta nova. Se você trocar &ldquo;Aceitar todos&rdquo; por
              &ldquo;Apenas essenciais&rdquo;, o site para de carregar as ferramentas de medição na
              hora e apaga os cookies que o Google e a Meta já tinham gravado neste navegador.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Você também pode bloquear cookies direto no navegador. Se bloquear os essenciais,
              partes do site deixam de funcionar, como a área restrita.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">Quem mais recebe esses dados</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Se você aceitar, <strong className="text-[rgb(var(--text))]">Google</strong> e{' '}
              <strong className="text-[rgb(var(--text))]">Meta</strong> recebem dados de navegação e
              os tratam como controladores próprios, sob as políticas de privacidade deles. Isso pode
              incluir transferência e armazenamento fora do Brasil.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Fora esses dois, o site não compartilha o que guarda no seu navegador com mais
              ninguém. Não vendemos dado a ninguém, em nenhuma hipótese.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">Seus direitos</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              A LGPD (Lei nº 13.709/2018) dá a você o direito de confirmar se tratamos seus dados,
              acessá-los, corrigi-los, pedir anonimização ou exclusão, e retirar seu consentimento a
              qualquer momento.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Para exercer qualquer um deles, escreva para{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-gold-text underline underline-offset-2"
              >
                {CONTACT.email}
              </a>
              . Detalhes em{' '}
              <Link
                href="/politica-de-privacidade"
                className="text-gold-text underline underline-offset-2"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-h3-m font-semibold">Quando esta página mudar</h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              Se o site passar a gravar algo novo, a tabela muda junto, porque ela é gerada do
              código. A data no topo indica a última revisão do texto.
            </p>
          </div>

          <div className="divider-gradient" />

          <p className="text-sm text-[rgb(var(--text-muted))]">
            Para dúvidas sobre o uso de cookies neste site, entre em{' '}
            <Link href="/contato" className="text-gold-text underline underline-offset-2">
              contato
            </Link>{' '}
            com nossa equipe.
          </p>
        </div>
      </section>
    </>
  );
}
