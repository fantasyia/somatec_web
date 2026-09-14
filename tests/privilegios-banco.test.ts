import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// =============================================================================
// O ANON NÃO EXECUTA FUNÇÃO SECURITY DEFINER NENHUMA.
//
// Auditoria de 13/09/2026: as 8 funções SECURITY DEFINER do banco eram
// executáveis pela chave anônima pública (provado por REST — `rpc/is_admin`
// respondia 200 com a anon key). Uma delas reordenava a home sem conta; outra
// criava pedido com qualquer preço pulando toda a validação da rota.
//
// O `scripts/015-reorder-rpc.sql` já tinha o revoke certo, foi aplicado em
// 30/06 — e a função foi recriada depois sem ele. É esse o modo de falha que
// este arquivo vigia: o grant volta calado toda vez que alguém dá DROP +
// CREATE. A migration 00006 é o registro; este teste garante que ela continua
// dizendo o que precisa dizer, e que nenhuma função SECURITY DEFINER nova
// entra sem o revoke ao lado.
//
// ⚠️ Isto lê SQL, não o banco. Se a migration não foi aplicada, o banco
// continua aberto e este teste passa. A prova de verdade é
//   POST /rest/v1/rpc/is_admin  com a anon key  → 401/403
// e está no checklist do card.
// =============================================================================

const DIR = resolve(process.cwd(), 'supabase/migrations');
const sql = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(DIR, f), 'utf-8'))
  .join('\n');

/** Nome de toda função declarada SECURITY DEFINER em qualquer migration. */
function funcoesSecurityDefiner(fonte: string): string[] {
  const nomes = new Set<string>();
  // Um bloco por `create function`; o cabeçalho é o que vem antes do corpo
  // (`as $$`). Sem cortar no corpo, um `[\s\S]*?` preguiçoso atravessa a
  // função seguinte e acusa trigger comum de ser SECURITY DEFINER — foi a
  // primeira rodada deste teste.
  const blocos = fonte.split(/(?=create\s+(?:or\s+replace\s+)?function\s+public\.)/i);
  for (const bloco of blocos) {
    const cabecalho = bloco.split(/\bas\s+\$/i)[0];
    const nome = /function\s+public\.([a-z_0-9]+)\s*\(/i.exec(cabecalho)?.[1];
    if (nome && /security\s+definer/i.test(cabecalho)) nomes.add(nome);
  }
  return [...nomes];
}

function temRevokeParaAnon(fonte: string, nome: string): boolean {
  const re = new RegExp(
    `revoke\\s+(?:all|execute)\\s+on\\s+function\\s+public\\.${nome}\\s*\\([^)]*\\)\\s+from\\s+[^;]*\\banon\\b`,
    'i',
  );
  return re.test(fonte);
}

describe('⛔ função SECURITY DEFINER sem REVOKE pro anon não entra', () => {
  const funcoes = funcoesSecurityDefiner(sql);

  it('a varredura encontra as funções (não pode passar por estar vazia)', () => {
    expect(funcoes).toEqual(
      expect.arrayContaining([
        'gerar_numero_pedido',
        'criar_pedido',
        'consultar_pedido',
        'atualizar_status_pedido',
        'limpar_pedidos_de_teste',
      ]),
    );
  });

  it.each(funcoes)('%s tem `revoke … from … anon`', (nome) => {
    expect(temRevokeParaAnon(sql, nome), `falta o revoke pro anon em ${nome}`).toBe(true);
  });

  it('as funções que só existiam no banco também estão cobertas', () => {
    // `reorder_by_display_order`, `is_admin` e `rls_auto_enable` nascem fora
    // desta pasta (script antigo / migration do CMS / Supabase), mas o revoke
    // delas mora aqui — é a única migration que o site aplica.
    for (const nome of ['reorder_by_display_order', 'is_admin', 'rls_auto_enable']) {
      expect(temRevokeParaAnon(sql, nome), `falta o revoke pro anon em ${nome}`).toBe(true);
    }
  });

  it('is_admin continua executável por authenticated — as policies dependem dela', () => {
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+public\.is_admin\(\)\s+to\s+authenticated/i);
  });

  it('tabelas privadas sem privilégio pro anon, além do RLS', () => {
    for (const tabela of ['pedidos', 'config_privada']) {
      expect(sql).toMatch(
        new RegExp(`revoke\\s+all\\s+on\\s+table\\s+public\\.${tabela}\\s+from\\s+[^;]*\\banon\\b`, 'i'),
      );
    }
  });

  it('função nova em public não nasce executável pelo anon', () => {
    expect(sql).toMatch(
      /alter\s+default\s+privileges\s+in\s+schema\s+public\s+revoke\s+execute\s+on\s+functions\s+from\s+[^;]*\banon\b/i,
    );
  });
});
