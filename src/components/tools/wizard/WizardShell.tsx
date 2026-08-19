'use client';

import { useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';

// =============================================================================
// Casca compartilhada dos wizards de orçamento — o "motor" comum entre a trilha
// NI (compra) e a industrial (locação). O que muda entre as duas é só o miolo
// (os passos) e o desfecho; barra de progresso, navegação e estado de sucesso
// são iguais e vivem aqui.
//
// Ver: CheckoutNI (modo NI) · OrcamentoIndustrial (modo industrial).
// =============================================================================

type Props = {
  /** Passo atual (1-based) e total — alimentam a barra de progresso. */
  passo: number;
  totalPassos: number;
  /** Texto curto à direita do cabeçalho (ex.: "2 minutos · sem vendedor"). */
  nota: string;
  /** Rótulo do cabeçalho quando o lead já foi enviado. */
  rotuloSucesso: string;
  status: FormStatusKind;
  mensagem: string | null;
  /** Habilita o botão Continuar. */
  podeAvancar: boolean;
  /** Por que o Continuar está travado. Botão desabilitado sem explicação faz o
   *  usuário achar que a página quebrou — REGRA de todos os wizards: se trava,
   *  diz o motivo. */
  motivoBloqueio?: string | null;
  onVoltar: () => void;
  onContinuar: () => void;
  /** Miolo do passo atual. */
  children: ReactNode;
  /** id da âncora (deep-link dos CTAs). */
  id?: string;
  /** Linha discreta abaixo da navegação, visível em TODOS os passos (ex.: a
   *  saída pro WhatsApp de quem não quer montar o projeto sozinho). */
  rodape?: ReactNode;
  /** Conteúdo extra depois da mensagem de sucesso (ex.: baixar o PDF, que só
   *  é liberado após o cadastro). */
  sucessoExtra?: ReactNode;
};

export function WizardShell({
  passo,
  totalPassos,
  nota,
  rotuloSucesso,
  status,
  mensagem,
  podeAvancar,
  motivoBloqueio,
  onVoltar,
  onContinuar,
  children,
  id = 'calculadora',
  rodape,
  sucessoExtra,
}: Props) {
  const concluido = status === 'success';
  const ultimoPasso = passo >= totalPassos;

  // Link EXTERNO com âncora (ex.: o que a IA manda no WhatsApp,
  // `/protecao-comercial#calculadora`) não estava rolando até aqui: o
  // `scroll-behavior: smooth` global faz o navegador ANIMAR o salto inicial, e
  // a animação é atropelada pela hidratação — a página termina no topo, com a
  // pessoa tendo que rolar a LP inteira depois de já ter pedido pra comprar.
  // Clique em CTA interno sempre funcionou, então o defeito só aparecia em
  // quem chega de fora, que é justamente o caso do link do WhatsApp.
  //
  // Rola à mão, sem animação. `scrollIntoView` respeita o scroll-margin-top da
  // casca, então não fica embaixo do header fixo. Repetimos no 'load' porque
  // imagem que ainda não chegou muda a altura acima da calculadora.
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    const rolar = () => document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    // 2 rAF: espera o layout assentar antes de medir.
    const raf = requestAnimationFrame(() => requestAnimationFrame(rolar));
    window.addEventListener('load', rolar, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('load', rolar);
    };
  }, [id]);

  return (
    <div
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
    >
      {/* Cabeçalho + progresso */}
      <div className="border-b border-[rgb(var(--border))] px-6 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-xs font-bold text-[rgb(var(--text-muted))]">
            {concluido ? rotuloSucesso : `Passo ${passo} de ${totalPassos}`}
          </span>
          <span className="text-right font-sans text-xs text-[rgb(var(--text-muted))]">{nota}</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[rgb(var(--border))]">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-300 ease-premium"
            style={{ width: `${((concluido ? totalPassos : passo) / totalPassos) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6 md:p-8">
        {concluido ? (
          <>
            <FormStatus status="success" message={mensagem} />
            {sucessoExtra && <div className="mt-6">{sucessoExtra}</div>}
          </>
        ) : (
          <>
            {children}

            {/* Navegação */}
            <div className="mt-8 flex items-center justify-between">
              {passo > 1 ? (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-[rgb(var(--border))] px-4 py-2 font-sans text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Voltar
                </button>
              ) : (
                <span />
              )}
              {!ultimoPasso && (
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={onContinuar}
                    disabled={!podeAvancar}
                    className="btn-primary group disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar
                    <ChevronRight
                      className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </button>
                  {!podeAvancar && motivoBloqueio && (
                    <p role="status" className="max-w-[26rem] text-right text-xs text-[rgb(var(--text-muted))]">
                      {motivoBloqueio}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Saída sempre disponível — quem não quer montar nada fala direto. */}
            {rodape && (
              <div className="mt-6 border-t border-[rgb(var(--border))] pt-4">{rodape}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
