import 'server-only';

// =============================================================================
// TETO DE TAMANHO DO CORPO (B9 da auditoria 13/09).
//
// Nenhuma rota media o tamanho do que recebia: todas faziam `req.json()` direto.
// E há campos que aceitam objeto arbitrário — `endereco` e `data` são
// `z.record(z.string(), z.unknown())` — que vão parar em coluna `jsonb` e, no
// caso do pedido, são repassados ao ERP com `String(e[k])`. Um POST de dezenas
// de megabytes era aceito, parseado e gravado.
//
// O limite é generoso de propósito: o maior corpo legítimo do site (um pedido
// com resumo de 2000 caracteres, endereço e itens) fica na casa dos poucos KB.
// 64 KB dá ordem de grandeza de folga e ainda barra abuso.
// =============================================================================

export const LIMITE_CORPO_BYTES = 64 * 1024;

export type CorpoLido =
  | { ok: true; valor: unknown }
  | { ok: false; motivo: 'grande_demais' | 'json_invalido' };

/**
 * Lê o JSON do corpo recusando o que passar do teto.
 *
 * Confere o `content-length` quando ele vem (o caso normal) e, como rede de
 * segurança pra requisição sem esse cabeçalho (chunked), mede o texto de fato
 * antes de fazer o parse — porque `content-length` é declarado pelo cliente e
 * um cliente hostil simplesmente não o manda.
 */
export async function lerJsonLimitado(
  req: Request,
  limite = LIMITE_CORPO_BYTES,
): Promise<CorpoLido> {
  const declarado = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(declarado) && declarado > limite) {
    return { ok: false, motivo: 'grande_demais' };
  }
  let texto: string;
  try {
    texto = await req.text();
  } catch {
    return { ok: false, motivo: 'json_invalido' };
  }
  if (Buffer.byteLength(texto, 'utf8') > limite) {
    return { ok: false, motivo: 'grande_demais' };
  }
  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false, motivo: 'json_invalido' };
  }
}
