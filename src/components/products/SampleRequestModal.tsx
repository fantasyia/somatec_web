'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FlaskConical, Loader2, X, ChevronRight } from 'lucide-react';
import { TextField } from '@/components/forms/fields/TextField';
import { TextareaField } from '@/components/forms/fields/TextareaField';
import { SelectField } from '@/components/forms/fields/SelectField';
import { CheckboxField } from '@/components/forms/fields/CheckboxField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { BR_STATES } from '@/lib/constants/form-options';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';

type Props = {
  productId: string;
  productName: string;
  productSku?: string;
};

export function SampleRequestModal({ productId, productName, productSku }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Trava o scroll do body + foca o primeiro campo ao abrir; ESC fecha.
  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // Focus trap no Tab
      if (e.key === 'Tab' && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousActive?.focus?.();
    };
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      form_type: 'amostra',
      interest_type: 'b2b',
      name: fd.get('name'),
      email: fd.get('email'),
      whatsapp: fd.get('whatsapp'),
      company: fd.get('company'),
      cnpj: fd.get('cnpj'),
      city: fd.get('city'),
      state: fd.get('state'),
      quantity_estimate: fd.get('quantity_estimate'),
      application: fd.get('application') ?? '',
      message: fd.get('application') ?? '',
      product_id: productId,
      product_name: productName,
      product_sku: productSku ?? '',
      source_page: `/produtos`,
      website: fd.get('website') ?? '',
      captcha_token: captchaToken,
      lgpd_consent: fd.get('lgpd_consent') === 'on',
    };

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message ?? 'Não foi possível enviar agora.');
      }
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar agora. Tente novamente em instantes.');
    }
  }

  function close() {
    setOpen(false);
    // reseta o estado para a próxima abertura
    setTimeout(() => {
      setStatus('idle');
      setMessage(null);
    }, 200);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary text-[rgb(var(--text))] inline-flex items-center gap-2"
      >
        <FlaskConical className="h-4 w-4" strokeWidth={1.75} />
        Solicitar amostra
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-modal-title"
        >
          {/* Overlay */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="absolute inset-0 bg-deep_navy/70 backdrop-blur-sm"
            tabIndex={-1}
          />

          {/* Dialog */}
          <div
            ref={dialogRef}
            className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-card-lg sm:rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-premium-light dark:shadow-premium-dark"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 px-6 pt-6 pb-4 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
              <div>
                <h2 id="sample-modal-title" className="font-serif text-xl md:text-2xl font-semibold text-[rgb(var(--text))]">
                  Solicitar amostra
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{productName}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-elevated))] transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="px-6 py-5">
              {status === 'success' ? (
                <div className="space-y-5 py-4">
                  <FormStatus status="success" message={message} />
                  <button type="button" onClick={close} className="btn-primary">
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Nome completo" name="name" autoComplete="name" required maxLength={120} />
                    <TextField label="E-mail" name="email" type="email" autoComplete="email" required maxLength={120} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Empresa" name="company" autoComplete="organization" required maxLength={160} />
                    <TextField label="CNPJ" name="cnpj" required placeholder="00.000.000/0000-00" maxLength={18} hint="Com ou sem máscara." />
                  </div>
                  <TextField label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" required hint="Inclua DDD." />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <TextField label="Cidade" name="city" autoComplete="address-level2" required maxLength={80} />
                    </div>
                    <SelectField label="UF" name="state" options={[...BR_STATES]} placeholder="—" defaultValue="" required />
                  </div>
                  <TextField
                    label="Quantidade aproximada"
                    name="quantity_estimate"
                    required
                    placeholder="Ex: 5 kg · 1 caixa · 10 unidades"
                    maxLength={80}
                    hint="Volume estimado da amostra que precisa avaliar."
                  />
                  <TextareaField
                    label="Aplicação pretendida (opcional)"
                    name="application"
                    rows={3}
                    maxLength={500}
                    placeholder="Onde/como pretende usar o produto."
                  />

                  <HoneypotField />

                  <CheckboxField
                    name="lgpd_consent"
                    required
                    label={
                      <>
                        {LGPD_PUBLIC_DEFAULT.text}{' '}
                        <Link href="/politica-de-privacidade" className="text-gold hover:underline">
                          Leia a Política de Privacidade
                        </Link>
                        .
                      </>
                    }
                  />

                  <TurnstileWidget onToken={setCaptchaToken} />

                  {status === 'error' && <FormStatus status="error" message={message} />}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="btn-primary group w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                          Enviando…
                        </>
                      ) : (
                        <>
                          Enviar solicitação
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
