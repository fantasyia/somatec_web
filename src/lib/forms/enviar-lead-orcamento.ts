import { getAtribuicao } from '@/lib/attribution';

// =============================================================================
// Envio do lead dos wizards de orçamento — o mesmo caminho pras duas trilhas
// (NI compra e industrial locação). O que muda é só o `segmento` e o `resumo`
// montado por cada wizard; UTM/atribuição, honeypot e captcha são idênticos.
// =============================================================================

export type LeadOrcamento = {
  nome: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  whatsapp: FormDataEntryValue | null;
  empresa: FormDataEntryValue | null;
  /** Identifica a trilha no CRM (ex.: 'NI · residencial', 'Industrial · locação'). */
  segmento: string;
  /** Texto com o que o visitante montou no wizard. */
  resumo: string;
  sourcePage: string;
  lgpdConsent: boolean;
  honeypot: FormDataEntryValue | null;
  captchaToken: string;
};

export type ResultadoEnvio = { ok: true } | { ok: false; mensagem: string };

export async function enviarLeadOrcamento(d: LeadOrcamento): Promise<ResultadoEnvio> {
  try {
    const res = await fetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_type: 'b2b',
        interest_type: 'b2b',
        name: d.nome,
        email: d.email,
        whatsapp: d.whatsapp,
        company: d.empresa ?? '',
        segment: d.segmento,
        message: d.resumo,
        lgpd_consent: d.lgpdConsent,
        source_page: d.sourcePage,
        website: d.honeypot ?? '',
        captcha_token: d.captchaToken,
        formulario: 'calculadora',
        ...(getAtribuicao() ? { atribuicao: getAtribuicao() } : {}),
      }),
    });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, mensagem: data.message ?? 'Não foi possível enviar agora. Tente novamente.' };
  } catch {
    return { ok: false, mensagem: 'Não foi possível enviar agora. Tente novamente em instantes.' };
  }
}
