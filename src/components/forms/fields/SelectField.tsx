'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, Props>(function SelectField(
  { label, options, error, hint, required, placeholder, className, id, ...rest },
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
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'block w-full appearance-none px-4 py-3 pr-10 rounded-btn bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--text))] transition-colors duration-200 ease-premium cursor-pointer',
            'focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))] pointer-events-none"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
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
