import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import path from 'node:path';

// =============================================================================
// SOFT 404 EM ROTA DINÂMICA — regressão de SEO.
//
// `/blog/[slug]` e `/solucoes/[slug]` renderizavam a página "não encontrada"
// mas respondiam **200**. O Google trata isso como página de baixa qualidade e
// segura URL morta no índice.
//
// Não dá pra pegar isso em teste unitário: o status se perde na GRAVAÇÃO do
// render sob demanda no cache ISR, que só existe com `next build` +
// `next start`. Por isso este arquivo sobe o servidor de produção de verdade
// (e por isso mora fora do `npm test` — roda em `npm run test:e2e`, depois do
// build).
//
// Cada 404 é pedido DUAS vezes de propósito: no bug, a primeira resposta já
// vinha 200 e a segunda vinha 200 de HIT de cache. Se um dia só o caminho de
// MISS for consertado, a segunda chamada denuncia.
// =============================================================================

const PORT = Number(process.env.E2E_PORT ?? 3199);
const BASE = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = 90_000;

let server: ChildProcess;

function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function portaRespondendo(): Promise<boolean> {
  try {
    await fetch(`${BASE}/`, { redirect: 'manual' });
    return true;
  } catch {
    return false;
  }
}

/** Um servidor sobrevivente da rodada anterior serve o build ANTIGO e o
 *  `next start` novo morre calado com EADDRINUSE — o teste passaria (ou
 *  falharia) sobre código que não é o do disco. Melhor explodir na cara. */
async function exigirPortaLivre(): Promise<void> {
  if (await portaRespondendo()) {
    throw new Error(
      `Porta ${PORT} já está ocupada. Mate o processo (ou use E2E_PORT=outra) — ` +
        'senão o teste roda contra um servidor velho.',
    );
  }
}

async function esperarServidor(): Promise<void> {
  const limite = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < limite) {
    if (server.exitCode !== null) {
      throw new Error(`\`next start\` morreu com código ${server.exitCode}.`);
    }
    try {
      const r = await fetch(`${BASE}/`, { redirect: 'manual' });
      if (r.status < 500) return;
    } catch {
      // ainda subindo
    }
    await dormir(500);
  }
  throw new Error(`Servidor não subiu em ${BOOT_TIMEOUT_MS}ms — rodou \`next build\` antes?`);
}

function matar(proc: ChildProcess): void {
  if (!proc.pid) return;
  if (process.platform === 'win32') {
    // next start abre processo filho; /T derruba a árvore inteira. spawnSync
    // porque o processo precisa estar morto ANTES da próxima rodada — um
    // sobrevivente sequestra a porta.
    spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-proc.pid, 'SIGKILL');
    } catch {
      proc.kill('SIGKILL');
    }
  }
}

async function esperarPortaLiberar(): Promise<void> {
  const limite = Date.now() + 15_000;
  while (Date.now() < limite) {
    if (!(await portaRespondendo())) return;
    await dormir(250);
  }
}

beforeAll(async () => {
  await exigirPortaLivre();

  // Chama o binário do next direto pelo node, sem npx e sem shell: no Windows
  // o Node 20+ recusa spawn de .cmd sem shell (EINVAL), e com shell avisa que
  // os argumentos vão sem escape (DEP0190). Assim não passa por nenhum dos dois.
  const binNext = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  server = spawn(process.execPath, [binNext, 'start', '-p', String(PORT)], {
    stdio: 'ignore',
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://msm.com.br',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
    },
  });
  await esperarServidor();
}, BOOT_TIMEOUT_MS + 10_000);

afterAll(async () => {
  if (!server) return;
  matar(server);
  await esperarPortaLiberar();
});

/** Slug inexistente, mas com a cara de um slug real — nada de caractere
 *  esquisito que pudesse ser barrado antes de chegar na rota. */
const INEXISTENTE = 'slug-que-nunca-existiu-e2e';

describe('404 duro em rota dinâmica', () => {
  it('/blog/<slug inexistente> responde 404 — inclusive na segunda vez', async () => {
    const primeira = await fetch(`${BASE}/blog/${INEXISTENTE}`);
    expect(primeira.status).toBe(404);

    const segunda = await fetch(`${BASE}/blog/${INEXISTENTE}`);
    expect(segunda.status).toBe(404);
  });

  it('/solucoes/<slug inexistente> responde 404 — inclusive na segunda vez', async () => {
    const primeira = await fetch(`${BASE}/solucoes/${INEXISTENTE}`);
    expect(primeira.status).toBe(404);

    const segunda = await fetch(`${BASE}/solucoes/${INEXISTENTE}`);
    expect(segunda.status).toBe(404);
  });

  it('rota estática inexistente continua 404', async () => {
    const r = await fetch(`${BASE}/rota-que-nunca-existiu-e2e`);
    expect(r.status).toBe(404);
  });
});

// O contraveneno: o consertado não pode ter virado "404 em tudo".
describe('slug que existe continua 200', () => {
  it('/solucoes/protecao-contra-surtos responde 200', async () => {
    const r = await fetch(`${BASE}/solucoes/protecao-contra-surtos`);
    expect(r.status).toBe(200);
  });

  it('o primeiro artigo listado em /blog responde 200', async () => {
    const listagem = await fetch(`${BASE}/blog`);
    expect(listagem.status).toBe(200);

    // O slug sai da própria listagem porque a fonte do blog varia: CMS quando o
    // banco responde, arquivo quando não. Cravar um slug aqui daria falso
    // vermelho no ambiente em que ele não é a fonte.
    const html = await listagem.text();
    const slug = html.match(/href="\/blog\/([a-z0-9-]+)"/)?.[1];
    expect(slug, 'nenhum artigo na listagem /blog — teste não tem o que verificar').toBeTruthy();

    const artigo = await fetch(`${BASE}/blog/${slug}`);
    expect(artigo.status).toBe(200);
  });
});
