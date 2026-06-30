'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

/**
 * Campo honeypot — invisível para humanos (off-screen), visível para bots no DOM.
 * Bots tendem a preencher TODOS os campos do form. Se vier preenchido → spam.
 *
 * NÃO usar `display: none` (alguns bots ignoram); usar técnica off-screen com aria-hidden.
 */
export const HoneypotField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function HoneypotField(props, ref) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
        }}
      >
        <label htmlFor="hp-website">Website (não preencher)</label>
        <input
          ref={ref}
          id="hp-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          name="website"
          {...props}
        />
      </div>
    );
  },
);
