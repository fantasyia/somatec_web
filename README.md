# MSM Alimentos — Site institucional

[![CI](https://github.com/fantasyia/site-msm/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fantasyia/site-msm/actions/workflows/ci.yml)

Site institucional + CMS para a MSM Alimentos, com formulários integrados ao MullerBot, painel administrativo completo e deploy na Railway.

## Stack

- **Next.js 16.2** + React 19 + TypeScript
- **Tailwind CSS** (tema premium com claro/escuro dedicado)
- **Supabase** (Auth + PostgreSQL + Storage)
- **Cloudflare Turnstile** (anti-spam invisível em todos os forms)
- **Upstash Redis** (rate limit distribuído)
- **MullerBot** (destino final dos forms via webhook + retry queue)

## Desenvolvimento local

### Pré-requisitos
- Node.js 20+
- Conta Supabase com projeto provisionado
- (opcional) Conta Cloudflare Turnstile + Upstash Redis para testar pipeline completo

### Setup

```bash
git clone https://github.com/fantasyia/site-msm.git
cd site-msm
npm install
cp .env.example .env.local
# preencha .env.local com credenciais reais
npm run dev
```

Acesse `http://localhost:3000`.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Build de produção |
| `npm start` | Roda o build (porta da `PORT` env var, ou 3000) |
| `npm run typecheck` | TypeScript check sem emitir |
| `npm run lint` | ESLint |

## Variáveis de ambiente

Veja `.env.example`. Mínimo para o site abrir:

```
NEXT_PUBLIC_SITE_URL=https://msm.com.br
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Para o pipeline de forms funcionar end-to-end:

```
MULLERBOT_WEBHOOK_URL=<webhook>
MULLERBOT_API_KEY=<api key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>
TURNSTILE_SECRET_KEY=<secret>
UPSTASH_REDIS_REST_URL=<rest url>
UPSTASH_REDIS_REST_TOKEN=<token>
REVALIDATE_SECRET=<random>
CRON_SECRET=<random>
```

Opcional para error tracking:

```
SENTRY_DSN=https://<key>@<host>/<project>
```

Quando setado, todos os `log.error(...)` viram automaticamente eventos no Sentry (fire-and-forget, ~0 overhead). Ausente vira no-op.

Opcional para retenção de audit log (default 90 dias):

```
AUDIT_RETENTION_DAYS=90
```

`/api/cron/audit-archive` apaga `admin_activity_log.created_at < now() - AUDIT_RETENTION_DAYS` em batches de 1000. Roda 1x/dia (`30 3 * * *`). Para LGPD: minimização de dados, sem requisito legal de manter logs administrativos de CMS interno por longo prazo. Dry-run: `?dry-run=true`.

Opcional para alertas de health monitoring:

```
HEALTH_WEBHOOK_URL=https://hooks.slack.com/services/...
HEALTH_WEBHOOK_FORMAT=slack       # ou 'discord' ou 'generic' (default)
HEALTH_WEBHOOK_AUTH=Bearer <opcional, vai como header Authorization>
ALERT_QUEUE_DEAD_WARNING=10
ALERT_QUEUE_DEAD_CRITICAL=50
ALERT_QUEUE_OLDEST_WARNING_SEC=900
ALERT_QUEUE_OLDEST_CRITICAL_SEC=3600
ALERT_SUPABASE_LATENCY_WARN_MS=3000
```

**Formatos suportados:**
- `generic` (default): JSON cru `{source, environment, timestamp, alerts[]}`
- `slack`: Block Kit com header + section + context, cores por severity (amarelo warning, vermelho critical)
- `discord`: Embeds com title/description/fields/footer, cor decimal por severity, limit 10 embeds

`/api/cron/health-monitor` deve rodar a cada 5min — crie um cron job no Railway dashboard apontando para esse endpoint com `Authorization: Bearer $CRON_SECRET`. Webhook payload:

```json
{
  "source": "msm-site",
  "environment": "production",
  "timestamp": "2026-05-17T...",
  "alerts": [
    { "key": "queue.dead.warning", "severity": "warning", "title": "...", "message": "...", "context": {...} }
  ]
}
```

Dedup: cada `(alert.key, hora-do-dia)` dispara no máximo 1x via Redis. Sem Redis, alerta dispara em cada execução.

Opcional para proteger o endpoint Prometheus:

```
METRICS_SECRET=<random>
```

Quando setado, `/api/metrics` exige `Authorization: Bearer $METRICS_SECRET`. Configure no Prometheus scrape config (`bearer_token`). Sem secret, endpoint é público (acceptable se sua plataforma já filtra acesso).

Opcional para assinar requests ao MullerBot (HMAC-SHA256):

```
MULLERBOT_SIGNING_SECRET=<random string >=32 chars>
```

Quando setado, cada POST ao webhook inclui `X-MSM-Signature: sha256=<hex>` computado sobre o body JSON. O receptor MullerBot deve recomputar com o mesmo secret e comparar antes de aceitar. Sem secret, o header é omitido (backwards compat).

**Exemplo de verificação no receiver (Node.js):**

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(body: string, signature: string, secret: string): boolean {
  if (!signature.startsWith('sha256=')) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// no handler:
const raw = await request.text(); // body raw, antes de JSON.parse
const sig = request.headers.get('X-MSM-Signature') ?? '';
if (!verify(raw, sig, process.env.MULLERBOT_SIGNING_SECRET!)) {
  return new Response('invalid signature', { status: 401 });
}
const payload = JSON.parse(raw);
// ... processa
```

Ou use o helper já exportado: `import { verifySignature } from '@/lib/mullerbot/signing'`.

Opcionais (contato/redes — Footer só renderiza se preenchidos):

```
NEXT_PUBLIC_CONTACT_WHATSAPP=
NEXT_PUBLIC_CONTACT_ADDRESS=
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_SOCIAL_LINKEDIN=
NEXT_PUBLIC_SOCIAL_INSTAGRAM=
NEXT_PUBLIC_SOCIAL_YOUTUBE=
```

## Migrations / Seed

Para aplicar migrations versionadas em um banco novo (ou propagar mudanças em produção):

```bash
# Defina DATABASE_URL em .env.local (Supabase → Project Settings → Database)
npm run migrate    # alias: npm run seed
```

O runner aplica em ordem alfabética, registra cada migration em `_schema_migrations`, e pula as já aplicadas. Mais detalhes em [`scripts/README.md`](scripts/README.md).

Inclui `010-demo-content.sql` que popula o site com **conteúdo realista de demonstração** (3 marcas, 10 produtos, 5 receitas, 4 banners, home hero/slider/CTAs) para testar o visual e fluxo enquanto não há conteúdo final. Idempotente — re-rodar atualiza em vez de duplicar.

## Banco de dados (Supabase)

26 tabelas, 49 RLS policies, 23 triggers `set_updated_at`. Estrutura aplicada via `scripts/apply-migrations.mjs` (idempotente).

Tabelas críticas:
- `admin_profiles` — quem pode acessar `/admin`
- `webhook_retry_queue` — fila técnica de envio para MullerBot (não é interface de leads)
- `admin_activity_log` — audit log de mudanças no CMS
- `site_settings` — chaves JSON versionadas (cookie banner, LGPD, etc.)
- `redirects` — gerenciados pelo middleware com cache em memória 5min

## Deploy

### Railway (deploy ativo)

1. Conecte o repo GitHub em **railway.app** → New Project → Deploy from GitHub
2. Adicione as variáveis de ambiente (Settings → Variables)
3. **Não defina `PORT` manualmente** — Railway injeta automaticamente
4. Em **Settings → Networking**, verifique a Target Port (deve bater com a `PORT` injetada — checar nos Deploy Logs com `Local: http://...:XXXX`)
5. O `railway.json` configura builder NIXPACKS + startCommand `npm start`
6. Configure os 3 **Cron Jobs** no Railway (cada um como service separado ou via Railway Cron) com header `Authorization: Bearer $CRON_SECRET`:

| Schedule | Endpoint | Função |
|---|---|---|
| `*/5 * * * *` | `/api/cron/process-webhook-queue` | Drena fila de retry MullerBot |
| `*/5 * * * *` | `/api/cron/health-monitor` | Avalia thresholds e envia webhook se algo passa |
| `30 3 * * *` | `/api/cron/audit-archive` | Apaga `admin_activity_log` > retention (90 dias) |

### Gotchas conhecidas
- **`output: 'standalone'` no Next.js + Nixpacks** dá problemas de assets — usar `npm start` simples
- **`metadataBase` precisa de URL válida** — `safeUrl()` helper protege contra valores inválidos
- **Sitemap e Footer fazem fetch ao Supabase no build** — guards `hasValidSupabaseConfig()` permitem build mesmo sem credenciais

## Documentação da API

Spec OpenAPI 3.1 disponível em [`/openapi.json`](public/openapi.json) (servido como arquivo estático).

Cobre os endpoints públicos:
- `GET /api/health`
- `POST /api/forms/submit`
- `POST /api/lgpd/consent`
- `GET /api/revalidate` (auth)
- `GET /api/cron/process-webhook-queue` (auth)

Visualização interativa disponível em **`/api-docs`** (Swagger UI servido via CDN, noindex/nofollow).

Também é possível colar o conteúdo em [editor.swagger.io](https://editor.swagger.io) ou outro visualizador OpenAPI.

## Endpoints úteis

| Rota | O que faz |
|---|---|
| `/api/health` | Health check (env + Supabase + Redis + queue stats). 200 ok/degraded, 503 down |
| `/api/version` | Build info: commit SHA, versões Next/Node, uptime do worker |
| `/api/metrics` | Métricas Prometheus (queue depth, uptime, HTTP requests, operation latencies, alerts). Auth opcional via `METRICS_SECRET` |
| `/api/csp-report` | Receptor de violações CSP (level 2 + 3). Loga + incrementa `msm_csp_violations_total{directive}` |
| `/api/webhooks/mullerbot` | Receiver de callbacks inbound do MullerBot (auth HMAC, idempotente). Persiste em `mullerbot_callbacks` |
| `/api/cron/health-monitor` | Avalia thresholds e dispara webhook se algo passa (auth `CRON_SECRET`, dedup Redis) |
| `/api/cron/audit-archive` | Apaga `admin_activity_log` > retention (default 90 dias). Suporta `?dry-run=true` |
| `/api/admin/audit-trail` | Export do audit log com filtros (date range, user, action, table); JSON ou CSV (`?format=csv`) |
| `/api/admin/audit-stats` | Agregações: top actions/tables/users + série diária. Auth admin |
| `/api/revalidate` | POST com `Authorization: Bearer $REVALIDATE_SECRET` + `?path=/x` ou `?tag=foo` para purgar cache |
| `/api/cron/process-webhook-queue` | Cron processador da fila MullerBot (auth via `Authorization: Bearer $CRON_SECRET`) |
| `/api-docs` | Swagger UI interativo do OpenAPI 3.1 |
| `/status` | Página pública de status (Site / Formulários / Painel admin) |
| `/admin/login` | Painel administrativo |

## Arquitetura

```
src/
├── app/                      # rotas Next App Router
│   ├── admin/                # CMS (14 módulos)
│   ├── api/                  # rotas server
│   ├── (institucional)/      # páginas públicas
│   └── layout.tsx            # root layout (footer/cookie banner do DB)
├── components/
│   ├── home/                 # seções da home
│   ├── layout/               # Header, Footer, PageHero, CookieBanner
│   ├── forms/                # forms com Turnstile + Zod
│   └── admin/                # UI do admin
├── lib/
│   ├── supabase/             # clients (client, server, admin, middleware)
│   ├── admin/                # auth, audit, CRUD genérico
│   ├── forms/                # schemas Zod
│   ├── mullerbot/            # payload + cliente HTTP
│   ├── webhook-queue/        # fila de retry
│   ├── ratelimit/            # Upstash
│   ├── turnstile/            # verificação server-side
│   ├── lgpd/                 # consentimento versionado
│   ├── constants/            # site, navigation, home-fallback
│   └── logger.ts             # logger estruturado
└── types/database.ts         # tipos Supabase gerados
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): typecheck + lint + test + build em PRs e push para `master`. Coverage threshold 80% bloqueia merge.
- **Lighthouse CI** (`.github/workflows/lighthouse.yml`): roda em PRs (e on-demand), audita 4 páginas, comenta scores no PR. Thresholds: a11y ≥ 95, SEO ≥ 90 (errors); perf ≥ 85, best-practices ≥ 90 (warns).
- **Database Backup** (`.github/workflows/backup.yml`): pg_dump diário 03:00 UTC, retenção 30 dias.
- **Dependabot** (`.github/dependabot.yml`): weekly npm + GitHub Actions.
- **Railway** redeploya automaticamente em push para `master`.

## Documentação adicional

- v1.0 — escopo institucional original
- v1.1 (adendo) — anti-spam, retry queue, audit log, LGPD
- Memória de projeto: `C:\Users\Dell\.claude\projects\C--Users-Dell\memory\project_msm_state.md`

## Segurança e auditoria

### `npm audit`

Após upgrade pra Next 16: **2 moderate** vulnerabilidades remanescentes, ambas em dependências transitivas de ferramentas de build (não afetam runtime):

| Pacote | Severidade | Via | Risco real |
|---|---|---|---|
| `postcss` | moderate | `next` (build pipeline) | XSS em CSS gerado dinamicamente — não é nosso caso |

A correção exige `npm audit fix --force` que tentaria downgradar Next.js. Aguardando upstream resolver.

Para verificar agora: `npm audit`.

### Build com webpack

Por padrão, `npm run build` usa `--webpack` em vez do novo Turbopack (default em Next 16). Razão: bug conhecido no Turbopack ao coletar page data em algumas rotas estáticas (`/a-msm`). Quando o bug for resolvido em release futura, remover `--webpack` dos scripts.

### Headers de segurança

Configurados em `next.config.js`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS preload, 2 anos)
- `Content-Security-Policy` (**enforce mode** desde 2026-05-17). Violações vão para `/api/csp-report` → logger + métrica `msm_csp_violations_total{directive}`. Diretivas:
  - `script-src`: self + Cloudflare Turnstile + jsdelivr (Swagger UI)
  - `style-src`: self + Google Fonts + jsdelivr
  - `img-src`: self + data/blob + Supabase + placeholders
  - `connect-src`: self + Supabase REST/realtime + Turnstile + Sentry envelope
  - `frame-ancestors 'none'` — bloqueia embed em iframe
- `Permissions-Policy` restritivo (camera/mic/geo bloqueados)

### API versioning e CORS

Todos os endpoints da API retornam header `X-API-Version` (atual: `1.2`). Use para detectar quando o servidor publicou breaking changes no schema da resposta.

Endpoints públicos sem auth (`/api/health`, `/api/csp-report`) liberam CORS com `Access-Control-Allow-Origin: *` — pode ser consumido de qualquer origin (Prometheus scrapers, status pages externas, etc). Endpoints autenticados não expõem CORS aberto: callers devem ser server-to-server.

Headers expostos (visíveis ao JS do browser via `getResponseHeader`):
- `X-API-Version`
- `X-Idempotent-Replay`
- `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Mode`
- `Retry-After`

### Idempotência

Endpoints públicos e admin aceitam header `Idempotency-Key: <8-128 chars alfanuméricos>`:

- `POST /api/forms/submit`
- `POST /api/lgpd/consent`
- `POST/PUT/DELETE /api/admin/*` (todos os 13 endpoints CRUD genéricos)

Comportamento:
- Primeira chamada: processa normalmente e cacheia resposta (24h em Redis)
- Chamadas repetidas com mesma key: retorna a resposta original com header `X-Idempotent-Replay: true`

Útil para:
- Forms: evitar submissão duplicada em retries (rede instável, refresh acidental)
- Admin: prevenir inserts/updates duplos por double-click ou PJAX retry

Se Upstash não estiver configurado, vira no-op (sem validação de duplicação).

### Rotação de secrets (zero-downtime)

Endpoints internos (`/api/revalidate`, `/api/cron/*`, `/api/metrics`) usam `validateBearer()` que aceita **CSV de tokens** no env var. Permite rotação sem downtime:

```
# Estado normal:
CRON_SECRET=token-atual

# Durante rotação (deploy 1):
CRON_SECRET=token-novo,token-atual

# Após callers atualizados (deploy 2):
CRON_SECRET=token-novo
```

Ambos os tokens são aceitos enquanto o CSV contém os dois. Comparação em tempo constante (`crypto.timingSafeEqual`). Mesma lógica vale para `REVALIDATE_SECRET` e `METRICS_SECRET`.

### Slow query monitoring

`withTiming(label, fn)` instrumenta operações server-side:
- `< SLOW_QUERY_MS` (default 500ms): `log.debug` apenas
- `≥ SLOW_QUERY_MS, < CRITICAL_QUERY_MS`: `log.warn` + counter `msm_slow_operations_total{label}`
- `≥ CRITICAL_QUERY_MS` (default 5000ms): `log.error` (→ Sentry + `msm_errors_total`) + counter `msm_critical_operations_total{label}`

Alertas sugeridos em Grafana/Prometheus:
- `increase(msm_slow_operations_total[5m]) > 5` → degradação
- `msm_critical_operations_total > 0` → investigar imediatamente

### Rate limiting

3 camadas em `/admin/login`:
- Burst: 5/min por IP
- Janela: 10/15min por IP
- Por email: 5/h (anti credential stuffing)

Forms públicos: 5/h por IP. Respostas 429 incluem `Retry-After`, `X-RateLimit-Remaining` e `X-RateLimit-Reset` (RFC 7231).

## Licença

Privado — © MSM Alimentos. Todos os direitos reservados.
