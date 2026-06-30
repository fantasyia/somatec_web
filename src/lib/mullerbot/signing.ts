import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Calcula assinatura HMAC-SHA256 do body para validação de origem.
 * Formato do header: `X-MSM-Signature: sha256=<hex>`.
 *
 * Retorna null se MULLERBOT_SIGNING_SECRET não estiver configurado
 * (backwards compat — header é omitido nesse caso).
 */
export function signBody(body: string, secret?: string): string | null {
  const key = secret ?? process.env.MULLERBOT_SIGNING_SECRET;
  if (!key) return null;
  return 'sha256=' + createHmac('sha256', key).update(body).digest('hex');
}

/**
 * Verifica se uma assinatura recebida é válida. Comparação em tempo constante
 * para mitigar timing attacks.
 *
 * Use em receivers que recebem o webhook do MSM (MullerBot etc).
 */
export function verifySignature(body: string, receivedSignature: string, secret: string): boolean {
  if (!receivedSignature || !secret) return false;
  if (!receivedSignature.startsWith('sha256=')) return false;

  const expected = signBody(body, secret);
  if (!expected) return false;

  // Comprimentos devem ser iguais para timingSafeEqual.
  // Mesmo que sejam diferentes, fazemos uma comparação dummy para manter tempo constante.
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(receivedSignature);
  if (expectedBuf.length !== receivedBuf.length) {
    // Buffers de mesmo tamanho para timingSafeEqual; o resultado será false.
    try {
      timingSafeEqual(expectedBuf, Buffer.alloc(expectedBuf.length));
    } catch {
      // ignore
    }
    return false;
  }
  return timingSafeEqual(expectedBuf, receivedBuf);
}
