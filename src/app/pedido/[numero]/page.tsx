import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Check, Truck, MessageCircle, PackageX } from 'lucide-react';
import { consultarPedido } from '@/lib/pedidos/servidor';
import {
  ROTULO_STATUS,
  PASSOS_DO_PEDIDO,
  formatarBRL,
  normalizarNumero,
  type StatusPedido,
} from '@/lib/pedidos/tipos';
import { AcompanharPedido } from '@/components/pedidos/AcompanharPedido';
import { whatsappHref } from '@/lib/constants/site';

// =============================================================================
// A página do pedido.
//
// Sempre dinâmica e NUNCA cacheada: status de pedido tem de refletir o banco
// no instante da visita. Uma página de pedido servida de cache mostraria "em
// separação" pra quem já recebeu.
//
// `noindex, nofollow` de verdade aqui — não é a trava de pré-lançamento, é
// permanente: página de pedido de cliente não entra em buscador nunca.
// =============================================================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Seu pedido | Somatec Blocking',
  robots: { index: false, follow: false, nocache: true },
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatarDataCurta(valor: string): string {
  // O histórico vem sem fuso (já convertido pra São Paulo no banco).
  const d = new Date(valor.includes('T') ? valor : `${valor}T12:00:00`);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Régua de progresso. `cancelado` não é um passo — é uma saída, e por isso
 *  troca a régua inteira por um aviso. */
function Regua({ status }: { status: StatusPedido }) {
  const atual = PASSOS_DO_PEDIDO.indexOf(status);

  return (
    <ol className="mt-6 space-y-0">
      {PASSOS_DO_PEDIDO.map((passo, i) => {
        const feito = i < atual;
        const agora = i === atual;
        const ultimo = i === PASSOS_DO_PEDIDO.length - 1;
        return (
          <li key={passo} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  feito
                    ? 'border-cyan bg-cyan text-white'
                    : agora
                      ? 'border-cyan bg-[rgb(var(--surface))] text-cyan'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-muted))]'
                }`}
              >
                {feito ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              {!ultimo && (
                <span
                  aria-hidden="true"
                  className={`w-0.5 flex-1 ${feito ? 'bg-cyan' : 'bg-[rgb(var(--border))]'}`}
                  style={{ minHeight: '2rem' }}
                />
              )}
            </div>
            <div className={`pb-8 ${agora ? '' : 'opacity-70'}`}>
              <p
                className={`font-sans font-semibold ${
                  agora ? 'text-cyan' : 'text-[rgb(var(--text))]'
                }`}
              >
                {ROTULO_STATUS[passo].titulo}
                {agora && <span className="ml-2 text-xs font-normal">— etapa atual</span>}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                {ROTULO_STATUS[passo].explica}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const pedido = await consultarPedido(decodeURIComponent(numero));

  // ── Não achou ────────────────────────────────────────────────────────
  // Não é 404: a pessoa pode ter digitado errado, e mandar ela pra uma
  // página de erro genérica não ajuda em nada. Mostra o campo de novo.
  if (!pedido) {
    return (
      <section className="container-msm pt-28 pb-20 md:pt-32">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-sans text-xs font-semibold text-[rgb(var(--text-muted))]">
            <PackageX className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Pedido não encontrado
          </span>
          <h1 className="mt-4 font-serif text-h2-m md:text-h2-d font-semibold leading-tight">
            Não achamos esse número
          </h1>
          <p className="mt-4 text-[17px] leading-[1.8] text-[rgb(var(--text-muted))]">
            Confira se o número está igual ao do e-mail de confirmação — são 12 caracteres,
            começando com <span className="font-semibold text-[rgb(var(--text))]">SB</span>, sem
            espaço nem traço. Você digitou{' '}
            <span className="font-semibold text-[rgb(var(--text))]">
              {normalizarNumero(decodeURIComponent(numero))}
            </span>
            .
          </p>

          <div className="mt-8">
            <AcompanharPedido inicial="" />
          </div>

          <a
            href={whatsappHref('Olá! Não estou conseguindo localizar meu pedido pelo número no site.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 font-sans text-sm font-semibold text-cyan transition-opacity hover:opacity-80"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </div>
      </section>
    );
  }

  const cancelado = pedido.status === 'cancelado';
  const subtotal = pedido.totalCentavos - pedido.freteCentavos;

  return (
    <>
      <section className="container-msm pt-28 pb-8 md:pt-32">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            <li>
              <Link href="/" className="transition-colors hover:text-cyan">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <Link href="/pedido" className="transition-colors hover:text-cyan">
                Acompanhar pedido
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <span className="text-[rgb(var(--text))]">{pedido.numero}</span>
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          {pedido.primeiroNome && (
            <p className="font-sans text-sm text-[rgb(var(--text-muted))]">
              Olá, {pedido.primeiroNome}
            </p>
          )}
          <h1 className="mt-1 font-serif text-h2-m md:text-h2-d font-semibold leading-tight">
            Pedido {pedido.numero}
          </h1>
          <p className="mt-2 font-sans text-sm text-[rgb(var(--text-muted))]">
            Feito em {formatarData(pedido.criadoEm)}
            {pedido.cidade && pedido.uf ? ` · entrega em ${pedido.cidade}/${pedido.uf}` : ''}
          </p>
        </div>
      </section>

      <div className="tone-surface">
        <section className="container-msm section-y">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* ── Andamento ─────────────────────────────────────── */}
            <div className="lg:col-span-7">
              <h2 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                Andamento
              </h2>

              {cancelado ? (
                <div className="mt-4 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5">
                  <p className="font-sans font-semibold text-[rgb(var(--text))]">
                    {ROTULO_STATUS.cancelado.titulo}
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                    {ROTULO_STATUS.cancelado.explica}
                  </p>
                </div>
              ) : (
                <Regua status={pedido.status} />
              )}

              {/* ── Rastreio ────────────────────────────────────── */}
              {pedido.rastreioCodigo && (
                <div className="mt-2 rounded-card-lg border border-cyan/30 bg-cyan/5 p-5">
                  <p className="flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
                    <Truck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Rastreio
                  </p>
                  <p className="mt-2 font-sans text-lg font-semibold tracking-wider text-[rgb(var(--text))]">
                    {pedido.rastreioCodigo}
                  </p>
                  {pedido.transportadora && (
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      via {pedido.transportadora}
                    </p>
                  )}
                  {pedido.rastreioUrl && (
                    <a
                      href={pedido.rastreioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 font-sans text-sm font-semibold text-cyan transition-opacity hover:opacity-80"
                    >
                      Rastrear na transportadora →
                    </a>
                  )}
                </div>
              )}

              {/* ── Linha do tempo ──────────────────────────────── */}
              {pedido.historico.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-sans text-sm font-semibold text-[rgb(var(--text))]">
                    Histórico
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {[...pedido.historico].reverse().map((ev, i) => (
                      <li key={`${ev.status}-${i}`} className="flex flex-wrap gap-x-3 text-sm">
                        <span className="font-mono text-xs text-[rgb(var(--text-muted))]">
                          {formatarDataCurta(ev.em)}
                        </span>
                        <span className="font-semibold text-[rgb(var(--text))]">
                          {ROTULO_STATUS[ev.status]?.titulo ?? ev.status}
                        </span>
                        {ev.nota && (
                          <span className="text-[rgb(var(--text-muted))]">— {ev.nota}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ── Resumo ────────────────────────────────────────── */}
            <div className="lg:col-span-5">
              <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 md:p-6 lg:sticky lg:top-28">
                <h2 className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
                  Resumo
                </h2>

                {pedido.itens.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {pedido.itens.map((item, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm">
                        <span className="text-[rgb(var(--text))]">
                          {item.quantidade > 1 && `${item.quantidade}× `}
                          {item.descricao}
                          {item.modelo && (
                            <span className="block text-xs text-[rgb(var(--text-muted))]">
                              {item.modelo}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold text-[rgb(var(--text))]">
                          {formatarBRL(item.precoCentavos * (item.quantidade || 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
                    Os itens estão sendo confirmados pela nossa equipe.
                  </p>
                )}

                <dl className="mt-5 space-y-2 border-t border-[rgb(var(--border))] pt-4 text-sm">
                  {pedido.itens.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[rgb(var(--text-muted))]">Subtotal</dt>
                      <dd className="text-[rgb(var(--text))]">{formatarBRL(subtotal)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--text-muted))]">Frete</dt>
                    <dd className="text-[rgb(var(--text))]">
                      {pedido.freteCentavos === 0 ? 'Grátis' : formatarBRL(pedido.freteCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-[rgb(var(--border))] pt-2">
                    <dt className="font-semibold text-[rgb(var(--text))]">Total</dt>
                    <dd className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
                      {formatarBRL(pedido.totalCentavos)}
                    </dd>
                  </div>
                  {pedido.formaPagamento && (
                    <div className="flex justify-between pt-1">
                      <dt className="text-[rgb(var(--text-muted))]">Pagamento</dt>
                      <dd className="text-[rgb(var(--text))]">{pedido.formaPagamento}</dd>
                    </div>
                  )}
                </dl>

                <a
                  href={whatsappHref(`Olá! Quero falar sobre o pedido ${pedido.numero}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-btn border border-[rgb(var(--border))] px-4 py-3 font-sans text-sm font-semibold text-[rgb(var(--text))] transition-colors hover:border-cyan hover:text-cyan"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Falar sobre este pedido
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
