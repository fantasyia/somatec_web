'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, required, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `f-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
      >
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'block w-full px-4 py-3 rounded-btn bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/60 transition-colors duration-200 ease-premium',
          'focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30',
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-[rgb(var(--text-muted))]">
          {hint}
        </p>
      )}
    </div>
  );
});
