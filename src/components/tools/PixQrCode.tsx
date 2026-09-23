'use client';

import { useState } from 'react';

// =============================================================================
// QR do PIX na PRÓPRIA página — decisão do Léo, 23/09/2026.
//
// Antes, quem escolhia PIX recebia um botão "Pagar agora" que levava pra página
// do Asaas. Redirecionar aí é atrito sem contrapartida: no PIX o momento de
// confiança acontece DENTRO do app do banco, onde a pessoa confere recebedor e
// valor. Não há dado sensível vindo pra nós, então não há o que a página de
// terceiro proteja.
//
// ⛔ O CARTÃO continua fora. Lá o número é digitado, e trazer isso pra dentro
// colocaria o site em escopo de PCI-DSS — ver o cabeçalho de `lib/pagamento/asaas`.
//
// 🔑 O COPIA-E-COLA É O CAMINHO PRINCIPAL, não um extra. Quem compra no
// computador não escaneia a própria tela: abre o app no celular e cola o código.
// Por isso o botão de copiar tem o mesmo peso visual do QR, e o código fica
// selecionável — se a área de transferência falhar (navegador antigo, permissão
// negada, página sem HTTPS), ainda dá pra marcar com o mouse.
// =============================================================================

type Props = {
  /** PNG em base64, sem o prefixo `data:`. */
  imagemBase64: string;
  /** O copia-e-cola do PIX. */
  codigo: string;
  /** ISO. `null` = o gateway não informou; aí não se promete prazo. */
  expiraEm?: string | null;
};

function quandoExpira(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function PixQrCode({ imagemBase64, codigo, expiraEm }: Props) {
  const [copiado, setCopiado] = useState(false);
  const validade = quandoExpira(expiraEm);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sem área de transferência o código segue na tela, selecionável — por
      // isso ele é exibido, e não só copiável.
    }
  }

  return (
    <div className="mt-5 rounded-card border border-[rgb(var(--border))] p-5">
      <p className="font-sans text-sm font-semibold text-[rgb(var(--text))]">
        Pague com PIX agora
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element --
            É um data: URI gerado por pedido. O next/image existe pra otimizar
            e cachear arquivo servido; aqui não há URL pra otimizar, e passar
            por loader só adicionaria caminho pra falhar num ponto onde falhar
            significa o cliente sem como pagar. */}
        <img
          src={`data:image/png;base64,${imagemBase64}`}
          alt="QR Code do PIX para pagar este pedido"
          width={180}
          height={180}
          className="h-[180px] w-[180px] shrink-0 rounded bg-white p-2"
        />

        <div className="w-full min-w-0">
          <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
            No celular, abra o app do banco e escaneie. No computador, copie o código e cole
            no seu app.
          </p>

          <p
            className="mt-3 max-h-24 overflow-y-auto break-all rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 font-mono text-[11px] leading-relaxed text-[rgb(var(--text-muted))]"
            // Selecionável de propósito: é o plano B de quando copiar falha.
          >
            {codigo}
          </p>

          <button
            type="button"
            onClick={copiar}
            className="btn-primary mt-3 inline-flex w-full justify-center sm:w-auto"
          >
            {copiado ? 'Código copiado ✓' : 'Copiar código PIX'}
          </button>
          {/* O aviso do resultado precisa chegar a quem não vê o botão mudar. */}
          <span aria-live="polite" className="sr-only">
            {copiado ? 'Código PIX copiado para a área de transferência.' : ''}
          </span>
        </div>
      </div>

      {/* Validade e confirmação: as duas coisas que faltam nesse tipo de tela.
          Sem a validade, quem volta depois encontra um QR morto e conclui que o
          site quebrou. Sem dizer como a confirmação chega, o QR fica mudo — ele
          não avisa nada por conta própria; quem avisa é o webhook. */}
      <p className="mt-4 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
        {validade ? `Este código vale até ${validade}. ` : ''}
        Assim que o pagamento cair, a confirmação chega por e-mail e WhatsApp — você não
        precisa esperar nesta página.
      </p>
    </div>
  );
}
