import { cn } from '@/lib/utils';

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea'; rows?: number };
type SelectProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  as: 'select';
  options: { value: string; label: string }[];
  placeholder?: string;
};

type Props = InputProps | TextareaProps | SelectProps;

const INPUT_CLS =
  'w-full rounded-lg border border-white/12 bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 text-sm text-[rgb(var(--text))] placeholder-white/25 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors disabled:opacity-50';

export function AdminField(props: Props) {
  const { label, name, error, hint, required, className, as = 'input', ...rest } = props;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-[0.07em]">
        {label}
        {required && <span className="text-gold ml-0.5">*</span>}
      </label>

      {as === 'textarea' ? (
        <textarea
          name={name}
          required={required}
          className={cn(INPUT_CLS, 'resize-y min-h-[80px]')}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === 'select' ? (
        <select
          name={name}
          required={required}
          className={cn(INPUT_CLS, 'cursor-pointer')}
          {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(props as SelectProps).placeholder && (
            <option value="">{(props as SelectProps).placeholder}</option>
          )}
          {(props as SelectProps).options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          required={required}
          className={INPUT_CLS}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {hint && !error && <p className="text-[11px] text-[rgb(var(--text-muted))]/70">{hint}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
