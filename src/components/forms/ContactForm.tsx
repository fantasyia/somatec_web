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
import { INTEREST_TYPE_OPTIONS } from '@/lib/constants/form-options';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import { getAtribuicao } from '@/lib/attribution';
import { motorDoContato, novoEventId, rastrearLead } from '@/lib/analytics/eventos';
import { PublicoSetorFields } from './fields/PublicoSetorFields';
import { rotuloSetor, type PublicoId } from '@/lib/constants/setores';
import { validarContato, temErro } from '@/lib/forms/validar-contato';
import Link from 'next/link';

// ⚠️ RESÍDUO CROSS-CLIENTE: este site nasceu de um template da MSM Alimentos.
// As variantes 'food_service' / 'terceirizacao' / 'envase' (e os campos de
// volume em kg/mês, tipo de embalagem, produto de interesse) eram do negócio
// de alimentos e foram removidas em 12/09/2026 — nenhuma página as usava.
// NÃO reintroduzir campo de alimento aqui: a Somatec vende proteção elétrica.
export type ContactFormVariant = 'contato_geral' | 'b2b';

type Props = {
  variant: ContactFormVariant;
  sourcePage?: string;
  /** Só os valores que INTEREST_TYPE_OPTIONS oferece de fato. */
  defaultInterestType?: 'b2b' | 'representante';
};

export function ContactForm({ variant, sourcePage = '/contato', defaultInterestType }: Props) {
  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');
  // Público define o funil/oferta; setor depende dele. Viram etiqueta no CRM.
  const [publico, setPublico] = useState<PublicoId | ''>('');
  const [setor, setSetor] = useState('');

  const showCompany = variant !== 'contato_geral'; // todos os segmentados têm empresa
  const showInterestSelect = variant === 'contato_geral';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    // Valida ANTES de marcar como enviando: com o `submitting` na frente, o
    // botão desabilitava e a pessoa via o formulário travar sem saber por quê.
    const problemas = validarContato({
      nome: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      whatsapp: String(fd.get('whatsapp') ?? ''),
      publico,
      lgpdAceito: fd.get('lgpd_consent') === 'on',
    });
    if (temErro(problemas)) {
      setErrors(problemas);
      setStatus('error');
      setMessage('Confira os campos destacados.');
      return;
    }

    setStatus('submitting');
    setMessage(null);
    setErrors({});
    // Mesmo id no navegador e no servidor: é o que faz o CAPI deduplicar em
    // vez de contar a conversão duas vezes.
    const eventId = novoEventId();
    const payload: Record<string, unknown> = {
      form_type: variant,
      event_id: eventId,
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
      payload.interest_type = fd.get('interest_type') ?? defaultInterestType ?? 'b2b';
    } else {
      payload.interest_type = variant;
    }

    if (showCompany) payload.company = fd.get('company') ?? '';
    // Público + setor viram etiqueta no Betinna; `segment` continua indo com o
    // rótulo legível, que é o que o CRM mostra no campo "segmento".
    if (publico) payload.publico = publico;
    if (setor) {
      payload.setor = setor;
      payload.segment = rotuloSetor(publico, setor);
    }

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; message: string };

      if (res.ok && data.ok) {
        // O motor sai do que a pessoa ESCOLHEU (`publico`), não de um padrão.
        // Até 23/09 tudo que não fosse representante virava `industrial`, e
        // loja e casa chegavam à medição como indústria. A regra e o porquê
        // estão em `motorDoContato`.
        rastrearLead({
          formId: 'contato',
          motor: motorDoContato(payload.interest_type as string | undefined, publico),
          eventId,
        });
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
          error={errors.nome}
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
          defaultValue={defaultInterestType ?? 'b2b'}
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

      {/* Público + setor — viram ETIQUETA no Betinna e roteiam a nutrição.
          Substituíram o antigo campo "Segmento" de texto livre (que ainda tinha
          exemplo da MSM): nome livre nunca casaria com a etiqueta do app. */}
      <PublicoSetorFields
        idPrefix="contato"
        publico={publico}
        setor={setor}
        onPublicoChange={setPublico}
        onSetorChange={setSetor}
        erroPublico={errors.publico}
        erroSetor={errors.setor}
      />

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
            <Link href="/politica-de-privacidade" className="text-gold-text underline underline-offset-2">
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
