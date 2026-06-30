import { NextResponse, type NextRequest } from 'next/server';
import { API_VERSION, publicResponseHeaders, corsHeaders } from '@/lib/http/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Captura horário de start do worker (cold start). Não persiste entre cold starts.
const WORKER_STARTED_AT_MS = Date.now();

/**
 * GET /api/version
 *
 * Endpoint público com info do build em execução. Útil para:
 *   - Verificar se um deploy foi aplicado (commit SHA)
 *   - Smoke test após deploy
 *   - Status pages mostrarem versão atual
 *   - Detectar inconsistência entre instâncias (load balancer com workers de
 *     deploys diferentes)
 */
export async function GET(req: NextRequest) {
  // || em vez de ?? — env vars setadas como "" devem cair pro próximo fallback,
  // não permanecerem como string vazia
  const commitSha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    null;

  const body = {
    api_version: API_VERSION,
    next_version: '16.2.6',
    node_version: process.versions.node,
    environment: process.env.NODE_ENV ?? 'unknown',
    commit_sha: commitSha,
    commit_short: commitSha ? commitSha.slice(0, 7) : null,
    deployment: {
      platform: process.env.RAILWAY_PROJECT_ID ? 'railway' : 'unknown',
      service_name: process.env.RAILWAY_SERVICE_NAME ?? null,
      region: process.env.RAILWAY_REGION ?? null,
    },
    worker: {
      started_at: new Date(WORKER_STARTED_AT_MS).toISOString(),
      uptime_seconds: Math.floor((Date.now() - WORKER_STARTED_AT_MS) / 1000),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=10, s-maxage=10',
      ...publicResponseHeaders(req.headers.get('origin')),
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin'), { methods: 'GET, OPTIONS' }),
  });
}
