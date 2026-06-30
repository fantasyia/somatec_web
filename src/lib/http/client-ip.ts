import 'server-only';

// =============================================================================
// Derivação confiável do IP do cliente respeitando a topologia de proxy.
//
// O X-Forwarded-For é uma lista "client, proxy1, proxy2, ...": o elemento mais à
// ESQUERDA é enviado pelo cliente e é trivialmente forjável. Usar XFF[0] (como
// antes) permitia spoof de IP — bypass de rate-limit e IP falso na auditoria LGPD.
//
// Ordem de confiança:
//   1. x-real-ip — setado pelo proxy/edge com o IP da conexão recebida; o cliente
//      não consegue sobrescrever (só controla o XFF que ele mesmo manda).
//   2. X-Forwarded-For pela DIREITA — o último hop é o que o proxy confiável
//      (Railway) anexou. TRUSTED_PROXY_HOPS (default 1) = quantos hops confiáveis
//      contar a partir da direita, caso haja mais de um proxy na frente.
//   3. fallback '0.0.0.0'.
// =============================================================================

const IPV4 = /^(\d{1,3})(\.\d{1,3}){3}$/;

function looksLikeIp(s: string): boolean {
  if (IPV4.test(s)) return true;
  // IPv6 (inclui formas com '::' e zonas); checagem leve, só pra descartar lixo.
  return s.includes(':') && /^[0-9a-fA-F:.]+$/.test(s);
}

export function getClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && looksLikeIp(realIp)) return realIp;

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const hops = Math.max(1, Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS ?? '1')) || 1);
      const candidate = parts[Math.max(0, parts.length - hops)];
      if (candidate && looksLikeIp(candidate)) return candidate;
      // Último recurso: o hop mais à direita que pareça um IP válido.
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p && looksLikeIp(p)) return p;
      }
    }
  }
  return '0.0.0.0';
}
