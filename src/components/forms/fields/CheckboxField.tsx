'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  error?: string;
  required?: boolean;
};

export const CheckboxField = forwardRef<HTMLInputElement, Props>(function CheckboxField(
  { label, error, required, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `f-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="flex items-start gap-3 cursor-pointer group"
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn(
            'mt-0.5 h-4 w-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-gold accent-gold cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-gold/30',
            error && 'border-red-500',
            className,
          )}
          {...rest}
        />
        <span className="text-sm text-[rgb(var(--text))] leading-snug">
          {label}
          {required && <span className="text-gold ml-1">*</span>}
        </span>
      </label>
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-red-500 ml-7" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
