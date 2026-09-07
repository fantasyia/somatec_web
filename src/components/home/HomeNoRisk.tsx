/**
 * Modelo comercial da locação industrial — o diferencial mais forte do
 * playbook. O texto vem de `@/lib/constants/oferta-industrial`, fonte única.
 *
 * ⛔ MUDOU DUAS VEZES. Em 03/09 acabou o período de avaliação; em 04/09 o
 * modelo foi refinado e três frases viraram proibidas: "não paga nada até a
 * instalação", "instalação sem custo" e "encerra quando quiser".
 *
 * ⛔ E em 07/09 mudou de novo: a JANELA DE SAÍDA (12º mês, 60 dias) SAIU DO
 * SITE por decisão do Léo — "não deve ser usado como propaganda de marketing,
 * a gente não quer que o cliente saia da nossa locação". Entre 04/09 e 07/09
 * ela era o argumento central desta seção, a ponto de o H2 ser "No 12º mês,
 * você decide se continua". A janela continua no CONTRATO; o que acabou foi
 * anunciá-la. Se aparecer em cache, doc ou card, é daquela fase — não volta.
 *
 * O que o site diz agora: cobrança só 45 dias depois da NF, e a instalação é
 * contratada pelo CLIENTE, com empresa homologada. Só isso.
 *
 * 🔒 A duração do contrato é dado INTERNO e não pode aparecer aqui.
 */
import Link from 'next/link';
import { ChevronRight, Network } from 'lucide-react';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { LocacaoTimeline } from '@/components/home/LocacaoTimeline';
import { OFERTA_INDUSTRIAL } from '@/lib/constants/oferta-industrial';

export function HomeNoRisk() {
  return (
    <section aria-label="Como funciona a locação industrial">
      <div className="container-msm section-y">
        {/* O chip "Locação · Indústria" SAIU: eyebrow/kicker não é padrão da
            marca. O público agora é sinalizado pela própria copy — "Na
            indústria…", "na sua planta", "a sua operação" são vocabulário que
            só o industrial usa, e dizem público + oferta como frase, não como
            rótulo. */}
        <div className="max-w-3xl space-y-4">
          {/* ⛔ Terceiro H2 desta seção. O primeiro ("Instalamos na sua planta.
              Se não valer a pena, a gente retira.") ficou falso em 04/09. O
              segundo ("No 12º mês, você decide se continua.") saiu em 07/09
              porque a janela de saída deixou de ir pro site. Este reaproveita
              a frase curta já aprovada da oferta — não é copy nova. Se o
              orquestrador quiser outro título, é decisão dele. */}
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            A cobrança só começa 45 dias depois da nota.
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            {OFERTA_INDUSTRIAL.paragrafo}
          </p>
        </div>

        {/* Timeline conectada (#16-D): linha preenche + nós acendem em sequência. */}
        <div className="mt-12">
          <LocacaoTimeline />
        </div>

        {/* Adendo #16-A: a legenda do saving (30%) saiu daqui — o argumento
            subiu de nível e virou o módulo "Uma hora parada por mês já paga
            a conta" (HomeHoraParada), logo abaixo. */}
        <div className="mt-10">
          {/* ⛔ Era "Quero avaliar na minha planta" — "avaliar" evocava o
              período de avaliação, extinto em 03/09.

              🔒 A master decidiu (03/09 19:06) que este botão viraria "Montar
              o projeto da minha planta", apontando pra /orcamento-industrial.
              NÃO apliquei assim, e o motivo está na tela: o bloco logo abaixo
              JÁ é o self-service, com o rótulo "Montar o projeto" e o mesmo
              destino. Aplicar ao pé da letra criaria dois botões iguais,
              colados.

              Este aqui é WhatsApp (CommercialCta, fallback /contato), então
              cai na OUTRA família do mesmo despacho — a de destino /contato,
              onde a copy aprovada é "Falar com a engenharia". É a regra dela
              aplicada ao destino real do botão. Registrado no card. */}
          <CommercialCta
            label="Falar com a engenharia"
            mensagem="Olá! Vim pelo site e quero o Master Block na minha fábrica."
            fallbackPath="/contato"
          />
        </div>

        {/* Auto-orçamento industrial: ganhou bloco próprio (era um botão
            fantasma que sumia ao lado do CTA laranja). Seção é CLARA
            (tone-surface) — botão navy sólido: alto contraste sem disputar o
            laranja, que já é do CTA de diagnóstico. */}
        <div className="mt-8 flex flex-col gap-4 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-gold/15 text-gold">
              <Network className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <span className="block font-sans text-base font-semibold text-[rgb(var(--text))]">
                Monte o projeto da sua planta em 2 minutos
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                Você já sai com a estimativa de locação na tela — sem esperar representante.
              </span>
            </div>
          </div>
          <Link
            href="/orcamento-industrial"
            className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-btn bg-deep_navy px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-navy-700"
          >
            Montar o projeto
            <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
