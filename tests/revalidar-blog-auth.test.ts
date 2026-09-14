import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// M7 DA AUDITORIA 13/09 — E A LIÇÃO DE COMO ELE PASSOU POR "FEITO".
//
// O item foi marcado como corrigido no card e NÃO estava no código: a rota
// seguia aceitando o segredo em `?secret=` e comparando com `===`. O único
// vestígio era o `import { constantTimeEquals }` sem nenhum uso — que o lint
// deste projeto não reprova. Descoberto em 14/09, ao rotacionar o segredo e
// testar a rota em produção.
//
// Query string entra em log de servidor, de proxy, de CDN e no Referer. Foi
// por esse caminho que o valor antigo apareceu em saída de sessão em 25/08.
// Sem esta guarda, o segredo novo vazaria pela mesma porta.
// =============================================================================

const ROTA = resolve(process.cwd(), 'src/app/api/blog/revalidar/route.ts');
const fonte = readFileSync(ROTA, 'utf8');

describe('/api/blog/revalidar aceita segredo só por cabeçalho', () => {
  it('não lê o segredo da query string', () => {
    expect(fonte).not.toMatch(/searchParams\.get\(\s*['"]secret['"]\s*\)/);
  });

  it('compara em tempo constante, não com ===', () => {
    expect(fonte).toContain('constantTimeEquals(');
    // O `===` contra o segredo é justamente o que vaza o prefixo pelo tempo.
    expect(fonte).not.toMatch(/===\s*segredo/);
  });

  it('não expõe GET (era o convite a pôr o segredo na URL)', () => {
    expect(fonte).not.toMatch(/export\s+async\s+function\s+GET/);
    expect(fonte).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('sem segredo no ambiente, recusa em vez de revalidar', () => {
    expect(fonte).toMatch(/if \(!process\.env\.BLOG_REVALIDATE_SECRET\)[\s\S]{0,260}503/);
  });
});
