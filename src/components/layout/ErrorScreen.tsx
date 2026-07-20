import type { ReactNode } from 'react';

// =============================================================================
// ErrorScreen — layout premium compartilhado para 404 / 500 (Adendo v1.1 §20.15).
// Hero dark (deep_navy) + pattern diagonal + watermark gigante do código +
// ilustração SVG linear + eyebrow + H1 serif + ações.
// Server-compatible (sem hooks) — usado por not-found (server) e error (client).
// =============================================================================

type Props = {
  /** Código exibido como watermark gigante (ex: "404", "500"). */
  code: string;
  title: string;
  description: string;
  /** Ilustração SVG linear (stroke currentColor). */
  illustration: ReactNode;
  /** Botões/links de ação. */
  actions: ReactNode;
};

export function ErrorScreen({ code, title, description, illustration, actions }: Props) {
  return (
    <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden bg-deep_navy texture-diagonal text-white px-6">
      {/* Watermark gigante do código */}
      <span
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center font-serif font-bold leading-none text-white opacity-[0.04] text-[200px] md:text-[400px]"
        aria-hidden="true"
      >
        {code}
      </span>

      {/* Conteúdo */}
      <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-6 py-20">
        <div className="text-gold" aria-hidden="true">
          {illustration}
        </div>
        <h1 className="font-serif text-h1-m md:text-h1-d font-semibold text-balance">{title}</h1>
        <p className="text-white/75 leading-relaxed text-pretty max-w-md">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">{actions}</div>
      </div>
    </section>
  );
}

/** Ilustração 404 — bússola com agulha quebrada. */
export function CompassIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      role="img"
      aria-label="Bússola com agulha quebrada"
    >
      <circle cx="60" cy="60" r="48" />
      <circle cx="60" cy="60" r="39" strokeOpacity="0.35" />
      {/* marcas cardeais */}
      <path d="M60 12v8M60 100v8M12 60h8M100 60h8" strokeLinecap="round" />
      {/* agulha quebrada (norte torto + sul desconectado) */}
      <path d="M60 60 44 38" strokeLinecap="round" />
      <path d="M70 78 78 90" strokeLinecap="round" strokeOpacity="0.5" />
      <circle cx="60" cy="60" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Ilustração 500 — engrenagem com uma racha. */
export function BrokenGearIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      role="img"
      aria-label="Engrenagem quebrada"
    >
      <circle cx="60" cy="60" r="24" />
      <circle cx="60" cy="60" r="8" />
      {/* dentes */}
      <path
        d="M60 12v14M60 94v14M12 60h14M94 60h14M27 27l10 10M83 83l10 10M93 27 83 37M37 83 27 93"
        strokeLinecap="round"
      />
      {/* racha (zigzag) */}
      <path d="M60 36 53 52 65 60 56 76" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
  );
}
