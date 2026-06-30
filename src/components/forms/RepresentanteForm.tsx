'use client';

import { useState, type FormEvent } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { SelectField } from './fields/SelectField';
import { CheckboxField } from './fields/CheckboxField';
import { HoneypotField } from './fields/HoneypotField';
import { TurnstileWidget } from './fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from './fields/FormStatus';
import { BR_STATES } from '@/lib/constants/form-options';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';

export function RepresentanteForm({ sourcePage = '/representantes' }: { sourcePage?: string }) {
  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      form_type: 'representante' as const,
      interest_type: 'representante' as const,
      name: fd.get('name'),
      email: fd.get('email'),
      whatsapp: fd.get('whatsapp'),
      city: fd.get('city') ?? '',
      state: fd.get('state') ?? '',
      region: fd.get('region') ?? '',
      experience: fd.get('experience') ?? '',
      message: fd.get('message') ?? '',
      lgpd_consent: fd.get('lgpd_consent') === 'on',
      source_page: sourcePage,
      website: fd.get('website') ?? '',
      captcha_token: captchaToken,
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
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
        setMessage(data.message ?? 'Não foi possível enviar.');
      }
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar sua mensagem agora. Tente novamente em instantes.');
    }
  }

  if (status === 'success') {
    return (
      <div className="space-y-6">
        <FormStatus status="success" message={message} />
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setMessage(null);
          }}
          className="text-sm font-sans font-semibold text-gold hover:text-gold-soft transition-colors"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Nome completo" name="name" autoComplete="name" required maxLength={120} />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
        />
      </div>

      <TextField
        label="WhatsApp"
        name="whatsapp"
        type="tel"
        autoComplete="tel"
        required
        placeholder="(11) 99999-9999"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <TextField label="Cidade" name="city" autoComplete="address-level2" maxLength={80} />
        </div>
        <SelectField
          label="UF"
          name="state"
          options={[...BR_STATES]}
          placeholder="—"
          defaultValue=""
        />
      </div>

      <TextField
        label="Região de atuação"
        name="region"
        placeholder="Ex: Sul de Minas, Grande São Paulo, Litoral Norte"
        maxLength={120}
      />

      <TextareaField
        label="Experiência no segmento"
        name="experience"
        rows={3}
        maxLength={500}
        placeholder="Conte brevemente sua experiência com food service, B2B ou distribuição."
      />

      <TextareaField
        label="Mensagem (opcional)"
        name="message"
        rows={3}
        maxLength={2000}
        placeholder="Algum detalhe extra que queira compartilhar."
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

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              Enviando…
            </>
          ) : (
            <>
              Quero ser representante
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
