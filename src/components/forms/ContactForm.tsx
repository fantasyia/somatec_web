'use client';

import { useState, type FormEvent } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { SelectField } from './fields/SelectField';
import { CheckboxField } from './fields/CheckboxField';
import { HoneypotField } from './fields/HoneypotField';
import { TurnstileWidget } from './fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from './fields/FormStatus';
import {
  BR_STATES,
  INTEREST_TYPE_OPTIONS,
  OPERATION_TYPE_OPTIONS,
} from '@/lib/constants/form-options';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import { getAtribuicao } from '@/lib/attribution';
import Link from 'next/link';

export type ContactFormVariant =
  | 'contato_geral'
  | 'food_service'
  | 'b2b'
  | 'terceirizacao'
  | 'envase';

type Props = {
  variant: ContactFormVariant;
  sourcePage?: string;
  defaultInterestType?:
    | 'food_service'
    | 'b2b'
    | 'terceirizacao'
    | 'envase'
    | 'marcas_proprias'
    | 'distribuicao'
    | 'representante';
};

export function ContactForm({ variant, sourcePage = '/contato', defaultInterestType }: Props) {
  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');

  const showCompany = variant !== 'contato_geral'; // todos os segmentados têm empresa
  const showCityState = variant === 'food_service';
  const showOperationType = variant === 'food_service';
  const showSegment = variant === 'b2b';
  const showProductInterest = variant === 'terceirizacao';
  const showProductType = variant === 'envase';
  const showPackagingType = variant === 'envase';
  const showVolume = variant === 'b2b' || variant === 'terceirizacao' || variant === 'envase';
  const showInterestSelect = variant === 'contato_geral';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      form_type: variant,
      name: fd.get('name'),
      email: fd.get('email'),
      whatsapp: fd.get('whatsapp'),
      message: fd.get('message') ?? '',
      lgpd_consent: fd.get('lgpd_consent') === 'on',
      source_page: sourcePage,
      website: fd.get('website') ?? '',
      captcha_token: captchaToken,
      formulario: 'contato',
    };

    const atribuicao = getAtribuicao();
    if (atribuicao) payload.atribuicao = atribuicao;

    // Interest type — variant segmentado já define
    if (variant === 'contato_geral') {
      payload.interest_type = fd.get('interest_type') ?? defaultInterestType ?? 'food_service';
    } else {
      payload.interest_type = variant;
    }

    if (showCompany) payload.company = fd.get('company') ?? '';
    if (showCityState) {
      payload.city = fd.get('city') ?? '';
      payload.state = fd.get('state') ?? '';
    }
    if (showOperationType) payload.operation_type = fd.get('operation_type') ?? '';
    if (showSegment) payload.segment = fd.get('segment') ?? '';
    if (showProductInterest) payload.product_interest = fd.get('product_interest') ?? '';
    if (showProductType) payload.product_type = fd.get('product_type') ?? '';
    if (showPackagingType) payload.packaging_type = fd.get('packaging_type') ?? '';
    if (showVolume) payload.estimated_volume = fd.get('estimated_volume') ?? '';

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
        setMessage(data.message ?? 'Não foi possível enviar sua mensagem agora.');
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
      {/* Identificação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Nome completo"
          name="name"
          autoComplete="name"
          required
          error={errors.name}
          maxLength={120}
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
          maxLength={120}
        />
      </div>

      <TextField
        label="WhatsApp"
        name="whatsapp"
        type="tel"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        required
        error={errors.whatsapp}
        hint="Inclua DDD. Aceitamos com ou sem máscara."
      />

      {/* Segmento (somente no /contato geral) */}
      {showInterestSelect && (
        <SelectField
          label="Tipo de interesse"
          name="interest_type"
          options={[...INTEREST_TYPE_OPTIONS]}
          defaultValue={defaultInterestType ?? 'food_service'}
          required
        />
      )}

      {/* Empresa */}
      {showCompany && (
        <TextField
          label="Empresa"
          name="company"
          autoComplete="organization"
          maxLength={160}
        />
      )}

      {/* Cidade / UF */}
      {showCityState && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <TextField
              label="Cidade"
              name="city"
              autoComplete="address-level2"
              maxLength={80}
            />
          </div>
          <SelectField
            label="UF"
            name="state"
            options={[...BR_STATES]}
            placeholder="—"
            defaultValue=""
          />
        </div>
      )}

      {/* Operação (food service) */}
      {showOperationType && (
        <SelectField
          label="Tipo de operação"
          name="operation_type"
          options={[...OPERATION_TYPE_OPTIONS]}
          placeholder="Selecione"
          defaultValue=""
        />
      )}

      {/* B2B */}
      {showSegment && (
        <TextField
          label="Segmento"
          name="segment"
          placeholder="Ex: rede de supermercados, atacadista, indústria de molhos"
          maxLength={160}
        />
      )}

      {/* Terceirização */}
      {showProductInterest && (
        <TextField
          label="Produto de interesse"
          name="product_interest"
          placeholder="Ex: maionese, ketchup, molho barbecue"
          maxLength={160}
        />
      )}

      {/* Envase */}
      {showProductType && (
        <TextField
          label="Tipo de produto"
          name="product_type"
          placeholder="Ex: molho líquido, pasta"
          maxLength={160}
        />
      )}
      {showPackagingType && (
        <TextField
          label="Tipo de embalagem"
          name="packaging_type"
          placeholder="Ex: sachê, bisnaga, balde, garrafa"
          maxLength={160}
        />
      )}

      {/* Volume estimado */}
      {showVolume && (
        <TextField
          label="Volume estimado (opcional)"
          name="estimated_volume"
          placeholder="Ex: 5.000 kg/mês"
          maxLength={160}
        />
      )}

      {/* Mensagem */}
      <TextareaField
        label="Mensagem"
        name="message"
        rows={4}
        maxLength={2000}
        placeholder="Conte como podemos ajudar."
      />

      {/* Honeypot */}
      <HoneypotField />

      {/* LGPD */}
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
        error={errors.lgpd_consent}
      />

      {/* Turnstile (invisible) */}
      <TurnstileWidget onToken={setCaptchaToken} />

      {/* Status (error) */}
      {status === 'error' && <FormStatus status="error" message={message} />}

      {/* Submit */}
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
              Enviar mensagem
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
