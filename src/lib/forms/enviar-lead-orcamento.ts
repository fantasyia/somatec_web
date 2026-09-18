import { getAtribuicao } from '@/lib/attribution';
import type { PublicoId } from '@/lib/constants/setores';

// =============================================================================
// Envio do lead dos wizards de orçamento — o mesmo caminho pras duas trilhas
// (NI compra e industrial locação). O que muda é só o `segmento` e o `resumo`
// montado por cada wizard; UTM/atribuição, honeypot e captcha são idênticos.
// =============================================================================

/** Slug da ferramenta que converteu. Obrigatório de propósito: é o que o
 *  Betinna usa pra rotear, e um default aqui faria toda ferramenta nova nascer
 *  com a identidade da anterior. Tem que casar com o enum de forms/schemas.ts. */
export type FormularioOrcamento =
  | 'orcamento-industrial'
  | 'checkout-ni-pedido'
  | 'checkout-ni-orcamento'
  | 'checkout-ni-abandono'
  | 'custo-de-parada';

export type LeadOrcamento = {
  formulario: FormularioOrcamento;
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
  /** Público do lead → vira etiqueta que roteia a nutrição. Os wizards SABEM o
   *  público (a LP define residencial/comercial; a triagem de Grupo A define
   *  industrial), então não faz sentido perguntar de novo. */
  publico?: PublicoId;
  /**
   * O MESMO id que o navegador usou no `generate_lead`. É o que faz a Meta
   * entender que o disparo do Pixel e o do CAPI são um evento só.
   *
   * ⚠️ Opcional porque nem todo caminho daqui tem par no navegador: o
   * `checkout-ni-abandono` sai no `pagehide`, sem evento de Pixel nenhum, e
   * ali o servidor gerar o id é o certo. Mas quem DISPARA `rastrearLead`
   * tem que passar o id — sem ele o servidor cai no fallback, gera outro, e
   * a Meta conta o mesmo lead duas vezes. Foi o que aconteceu com a
   * calculadora industrial e com o orçamento do checkout até 18/09.
   */
  eventId?: string;
};

export type ResultadoEnvio = { ok: true } | { ok: false; mensagem: string };

export async function enviarLeadOrcamento(d: LeadOrcamento): Promise<ResultadoEnvio> {
  try {
    const res = await fetch('/api/forms/submit', {
      method: 'POST',
      // keepalive: o lead de abandono é disparado no `pagehide` (aba fechando).
      // Sem isto o navegador ABORTA a requisição junto com o descarregamento da
      // página — e some justamente o lead de "quem só some", que é o caso que a
      // feature existe pra pegar (F2-A1 da auditoria 13/09). Payload é pequeno,
      // bem abaixo do teto de 64 KB do keepalive.
      keepalive: true,
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
        formulario: d.formulario,
        ...(d.eventId ? { event_id: d.eventId } : {}),
        ...(d.publico ? { publico: d.publico } : {}),
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
