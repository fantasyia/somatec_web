'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

import {
  CONSENT_VERSAO,
  EVENTO_REVER_CONSENTIMENTO,
  apagarCookiesDeMedicao,
  aplicarConsentimento,
  gravarConsentimento,
  lerConsentimento,
} from '@/lib/consent';

const DEFAULT_BODY =
  'Utilizamos cookies essenciais para o funcionamento do site e, com seu consentimento, cookies analíticos para melhorar sua experiência. Saiba mais em nossa';
const DEFAULT_ACCEPT = 'Aceitar cookies';
const DEFAULT_REJECT = 'Apenas essenciais';

export type CookieBannerText = {
  body?: string;
  accept_label?: string;
  essential_only_label?: string;
};

type Props = { text?: CookieBannerText };

function CookieBannerImpl({ text }: Props) {
  const [visible, setVisible] = useState(false);
  /** Guarda quem pediu pra rever, pra devolver o foco ao fechar. */
  const quemAbriuRef = useRef<HTMLElement | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Pergunta de novo quando o TEXTO mudou de versão (B1 da auditoria).
      //
      // ⚠️ A chave legada da MSM NÃO conta mais como resposta: era outro
      // cliente, outro texto de banner. Quem tiver só ela é perguntado aqui,
      // agora sob o texto da Somatec.
      const registro = lerConsentimento();
      const respondeuEstaVersao = registro?.versao === CONSENT_VERSAO;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decisão de visibilidade depende de localStorage (só disponível no client após mount)
      if (!respondeuEstaVersao) setVisible(true);
    } catch { /* localStorage indisponível (Safari private/etc.) */ }
  }, []);

  // REABERTURA PELO BOTÃO DE `/cookies` (14/09/2026).
  //
  // Até aqui a primeira resposta era definitiva: o banner só aparece pra quem
  // nunca respondeu, e nada mais chamava `aplicarConsentimento`. Agora o botão
  // "Rever minha escolha" dispara este evento.
  //
  // ⚠️ O registro NÃO é apagado ao abrir. Quem abre e fecha sem responder
  // continua com a escolha anterior valendo — apagar no clique transformaria
  // "dar uma olhada" em "revogar sem querer".
  useEffect(() => {
    const aoPedirRevisao = () => {
      quemAbriuRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    };
    window.addEventListener(EVENTO_REVER_CONSENTIMENTO, aoPedirRevisao);
    return () => window.removeEventListener(EVENTO_REVER_CONSENTIMENTO, aoPedirRevisao);
  }, []);

  // Foco entra no banner quando ele aparece — ele é `role="dialog"` e sem isto
  // quem navega por teclado não é levado até a pergunta.
  useEffect(() => {
    if (!visible) return;
    painelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [visible]);

  const dismiss = (value: 'accepted' | 'rejected') => {
    gravarConsentimento(value);
    // Avisa as tags NA HORA — o `wait_for_update` do Consent Mode segura a tag
    // meio segundo esperando isto, então quem aceita é medido sem recarregar.
    aplicarConsentimento(value);
    // ⭐ Rebaixou: apaga de verdade o que Google e Meta já tinham gravado. O
    // `consent update` para de ALIMENTAR, mas não apaga — sem isto a pessoa
    // pede pra não ter identificador e ele fica no navegador por até 2 anos.
    if (value === 'rejected') apagarCookiesDeMedicao();
    setVisible(false);
    // Devolve o foco a quem abriu (o botão de `/cookies`), não ao topo.
    quemAbriuRef.current?.focus();
    quemAbriuRef.current = null;
    fetch('/api/lgpd/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted: value === 'accepted' }),
    }).catch(() => {});
  };

  if (!visible) return null;

  const body = text?.body ?? DEFAULT_BODY;
  const acceptLabel = text?.accept_label ?? DEFAULT_ACCEPT;
  const rejectLabel = text?.essential_only_label ?? DEFAULT_REJECT;

  return (
    <div
      ref={painelRef}
      role="dialog"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-deep_navy/95 backdrop-blur-sm shadow-[0_-4px_32px_rgba(0,0,0,0.4)]"
    >
      <div className="container-msm py-4 md:py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
          <Cookie
            className="hidden md:block h-6 w-6 shrink-0 text-gold"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="flex-1 text-sm leading-relaxed text-white/80">
            {body}{' '}
            <Link
              href="/cookies"
              className="text-gold underline underline-offset-2 hover:text-soft_gold transition-colors"
            >
              Política de Cookies
            </Link>{' '}
            e{' '}
            <Link
              href="/politica-de-privacidade"
              className="text-gold underline underline-offset-2 hover:text-soft_gold transition-colors"
            >
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => dismiss('rejected')}
              className="rounded-btn border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              {rejectLabel}
            </button>
            <button
              type="button"
              onClick={() => dismiss('accepted')}
              className="btn-primary text-sm py-2 px-5"
            >
              {acceptLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CookieBannerDynamic = dynamic(
  () => Promise.resolve(({ text }: Props) => <CookieBannerImpl text={text} />),
  { ssr: false },
);

export function CookieBanner({ text }: Props) {
  return <CookieBannerDynamic text={text} />;
}
