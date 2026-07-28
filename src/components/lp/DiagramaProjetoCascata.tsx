'use client';

import { useEffect, useState } from 'react';
import { PlugZap, LayoutGrid, Cpu, type LucideIcon } from 'lucide-react';
import type { ProjetoLocacao, CamadaId } from '@/lib/constants/locacao';

// =============================================================================
// Diagrama do projeto que o CLIENTE montou (resultado da trilha industrial) —
// o "projeto mastigado": entrada → painéis → equipamentos críticos, com a
// quantidade de Master Block de cada camada e os pontos acendendo em sequência.
//
// Diferente do DiagramaExemploIndustrial (aquele é o exemplo ilustrativo fixo):
// este é 100% data-driven, desenhado sobre o card navy do resultado.
//
// Anima na MONTAGEM (o passo 5 aparece por clique, não por scroll). Se o
// usuário pede menos movimento, já nasce tudo aceso.
// =============================================================================

const ICONES: Record<CamadaId, LucideIcon> = {
  entrada: PlugZap,
  painel: LayoutGrid,
  equipamento: Cpu,
};

export function DiagramaProjetoCascata({ projeto }: { projeto: ProjetoLocacao }) {
  const [aceso, setAceso] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion: nasce aceso, sem sequência
      setAceso(true);
      return;
    }
    const t = setTimeout(() => setAceso(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex items-start gap-2 overflow-x-auto pb-1 sm:gap-3"
      role="img"
      aria-label={`Proteção em cascata do seu projeto: ${projeto.linhas
        .map((l) => `${l.quantidade} Master Block em ${l.camada.nome}`)
        .join(', ')}`}
    >
      {projeto.linhas.map((linha, i) => {
        const Icon = ICONES[linha.camada.id];
        return (
          <div key={linha.camada.id} className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
            <div className="flex min-w-[92px] flex-1 flex-col items-center text-center">
              <span
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500 ease-premium"
                style={{
                  borderColor: aceso ? '#F39200' : 'rgba(255,255,255,0.25)',
                  backgroundColor: aceso ? 'rgba(243,146,0,0.15)' : 'transparent',
                  color: aceso ? '#F39200' : 'rgba(255,255,255,0.4)',
                  transitionDelay: `${i * 0.35}s`,
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span
                className="mt-2 font-serif text-lg font-bold transition-colors duration-500"
                style={{ color: aceso ? '#F39200' : 'rgba(255,255,255,0.4)', transitionDelay: `${i * 0.35}s` }}
              >
                {linha.quantidade}×
              </span>
              <span className="font-sans text-[11px] leading-tight text-white/70">
                {linha.camada.nome}
              </span>
            </div>

            {/* Conector até a próxima camada */}
            {i < projeto.linhas.length - 1 && (
              <span className="mt-6 h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-white/15 sm:w-10">
                <span
                  className="block h-full origin-left bg-gold transition-transform duration-500 ease-premium"
                  style={{ transform: aceso ? 'scaleX(1)' : 'scaleX(0)', transitionDelay: `${i * 0.35 + 0.2}s` }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
