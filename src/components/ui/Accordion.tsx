'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Accordion acessível (Adendo v1.1 §1.1 type accordion + §20).
// Cada item: <button aria-expanded> controla um painel (role=region, aria-hidden).
// allowMultiple (default true) — permite vários abertos. Animação max-height +
// opacity. Chevron rotaciona 180° quando aberto. Reutilizável.
// =============================================================================

export type AccordionItem = {
  question: string;
  answer: string;
};

type Props = {
  items: AccordionItem[];
  /** Permite múltiplos itens abertos ao mesmo tempo. Default true. */
  allowMultiple?: boolean;
  /** Prefixo de id p/ acessibilidade (evita colisão se houver 2 accordions). */
  idPrefix?: string;
};

export function Accordion({ items, allowMultiple = true, idPrefix = 'faq' }: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="border-y border-[rgb(var(--border))]">
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const btnId = `${idPrefix}-btn-${i}`;
        const panelId = `${idPrefix}-panel-${i}`;
        return (
          <div key={i} className={cn(i > 0 && 'border-t border-[rgb(var(--border))]')}>
            <h3>
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="group flex w-full items-center justify-between gap-4 py-5 md:py-6 text-left"
              >
                <span className="font-sans font-semibold text-base md:text-lg text-[rgb(var(--text))] group-hover:text-gold transition-colors">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 text-gold transition-transform duration-200 ease-premium',
                    isOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              aria-hidden={!isOpen}
              className={cn(
                'overflow-hidden transition-all ease-out',
                isOpen ? 'max-h-[600px] opacity-100 duration-300' : 'max-h-0 opacity-0 duration-200',
              )}
            >
              <p className="pb-5 md:pb-6 text-[15px] md:text-base leading-relaxed text-[rgb(var(--text-muted))] max-w-3xl text-pretty">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
