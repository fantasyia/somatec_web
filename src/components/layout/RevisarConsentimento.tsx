'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { lerConsentimento, pedirParaRever, type ConsentRegistro } from '@/lib/consent';

// =============================================================================
// "REVER MINHA ESCOLHA DE COOKIES" — o caminho de volta (14/09/2026).
//
// ⚖️ Até aqui a primeira resposta era definitiva. O banner só aparece pra quem
// nunca respondeu, e nada mais no site chamava a aplicação do consentimento —
// o comentário do próprio `consent.ts` já admitia: "e ele não reaparece".
// Enquanto isso `/politica-de-privacidade` promete o direito de revogar, e a
// LGPD pede que retirar seja tão fácil quanto dar. O único caminho era limpar
// o navegador na mão, que não é "tão fácil quanto".
//
// Mostrar O ESTADO ATUAL acima do botão é metade do valor: a pessoa não
// lembra o que clicou meses atrás, e a linha também serve de prova do
// consentimento pra quem precisar demonstrar.
// =============================================================================

function rotulo(escolha: ConsentRegistro['escolha']): string {
  return escolha === 'accepted' ? 'Aceitar todos' : 'Apenas essenciais';
}

function dataLegivel(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function RevisarConsentimento() {
  // `null` = ainda não li (servidor / antes do mount). `false` = li e não há
  // registro. O estado de três valores evita piscar "você ainda não respondeu"
  // pra quem já respondeu.
  const [registro, setRegistro] = useState<ConsentRegistro | null | false>(null);
  const [confirmacao, setConfirmacao] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe depois do mount
    setRegistro(lerConsentimento() ?? false);
  }, []);

  // Relê quando o banner fecha: a escolha pode ter acabado de mudar, e a linha
  // de estado tem de refletir a resposta nova sem recarregar a página.
  useEffect(() => {
    const aoVoltarFoco = () => {
      const atual = lerConsentimento() ?? false;
      setRegistro((anterior) => {
        const mudou =
          anterior !== null &&
          (anterior === false ? atual !== false : atual !== false && atual.em !== anterior.em);
        if (mudou) setConfirmacao('Pronto. Sua escolha foi atualizada.');
        return atual;
      });
    };
    window.addEventListener('focus', aoVoltarFoco);
    document.addEventListener('visibilitychange', aoVoltarFoco);
    const t = setInterval(aoVoltarFoco, 1000);
    return () => {
      window.removeEventListener('focus', aoVoltarFoco);
      document.removeEventListener('visibilitychange', aoVoltarFoco);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-[rgb(var(--text-muted))]">
        {registro === null ? (
          <span className="opacity-0">Lendo sua escolha…</span>
        ) : registro === false ? (
          'Você ainda não respondeu ao banner de cookies.'
        ) : (
          <>
            Sua escolha atual:{' '}
            <strong className="text-[rgb(var(--text))]">{rotulo(registro.escolha)}</strong>
            {dataLegivel(registro.em) && <> · registrada em {dataLegivel(registro.em)}</>}
          </>
        )}
      </p>

      <button
        type="button"
        onClick={() => {
          setConfirmacao('');
          pedirParaRever();
        }}
        className="btn-secondary text-[rgb(var(--text))]"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Rever minha escolha de cookies
      </button>

      {/* Região viva sempre montada: região que nasce junto com o texto
          costuma não ser anunciada, porque o leitor de tela precisa já estar
          observando o elemento quando o conteúdo muda. */}
      <p role="status" aria-live="polite" className="text-sm text-[rgb(var(--text-muted))]">
        {confirmacao}
      </p>
    </div>
  );
}
