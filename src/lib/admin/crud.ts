import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from '@/lib/cache';
import type { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { createLogger } from '@/lib/logger';
import { SCHEMA_BY_TABLE } from '@/lib/admin/schemas';
import { invalidateRedirectsCache } from '@/lib/redirects/cache';
import { checkIdempotency, storeResponse, isValidIdempotencyKey } from '@/lib/idempotency';

const log = createLogger('crud');

/**
 * Checa o header `Idempotency-Key` na request. Se presente e válido,
 * retorna ação correspondente:
 *   - { kind: 'invalid' }     → o handler deve responder 400
 *   - { kind: 'replay', res } → o handler deve retornar esse Response sem re-executar
 *   - { kind: 'fresh', key }  → o handler deve processar normalmente e chamar storeIdempotent(key, ...)
 *   - { kind: 'none' }        → não há header, processa sem cache
 */
async function checkIdempotencyHeader(request: NextRequest): Promise<
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'in_flight' }
  | { kind: 'replay'; response: NextResponse }
  | { kind: 'fresh'; key: string }
> {
  const header = request.headers.get('idempotency-key');
  if (!header) return { kind: 'none' };
  if (!isValidIdempotencyKey(header)) return { kind: 'invalid' };

  const result = await checkIdempotency(header);
  if (result.mode === 'replay') {
    return {
      kind: 'replay',
      response: new NextResponse(result.response.body, {
        status: result.response.status,
        headers: {
          'Content-Type': result.response.contentType,
          'X-Idempotent-Replay': 'true',
        },
      }),
    };
  }
  if (result.mode === 'in_flight') return { kind: 'in_flight' };
  // 'first' ou 'skipped' (Upstash off): processa e tenta armazenar depois
  return { kind: 'fresh', key: header };
}

async function storeIdempotent(key: string | null, status: number, body: string): Promise<void> {
  if (!key) return;
  await storeResponse(key, { status, body, contentType: 'application/json' });
}

function firstZodError(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return 'Dados inválidos.';
  const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}

function validate(table: string, body: Record<string, unknown>): { ok: true; data: Record<string, unknown> } | { ok: false; message: string } {
  const schema = SCHEMA_BY_TABLE[table];
  if (!schema) return { ok: true, data: body };
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, message: firstZodError(parsed.error) };
  return { ok: true, data: parsed.data as Record<string, unknown> };
}

const TABLE_TAGS: Record<string, string[]> = {
  footer_columns: ['footer'],
  footer_links: ['footer'],
  site_settings: ['site_settings'],
  navigation_items: ['navigation'],
};

const TABLE_PATHS: Record<string, string> = {
  solutions: '/solucoes',
  products: '/produtos',
  product_categories: '/produtos',
  product_applications: '/produtos',
  banners: '/',
  pages: '/',
};

function revalidateTable(table: string) {
  const tags = TABLE_TAGS[table];
  if (tags) {
    tags.forEach((tag) => revalidateTag(tag));
  } else {
    const path = TABLE_PATHS[table];
    if (path) revalidatePath(path, 'page');
  }
  // Invalidação extra para redirects (cache em memória + Redis no middleware)
  if (table === 'redirects') {
    void invalidateRedirectsCache().catch(() => {
      // best-effort; cache expira em 10s mesmo se a invalidação falhar
    });
  }
}

type CrudOptions = {
  table: string;
  labelField?: string;
};

type AnySupabaseTable = ReturnType<ReturnType<typeof getSupabaseAdminClient>['from']>;
type InsertResult = { data: { id: string } | null; error: { message: string } | null };
type MutateResult = { data: null; error: { message: string } | null };

function dbInsert(t: AnySupabaseTable, body: Record<string, unknown>): Promise<InsertResult> {
  return t.insert(body as never) as unknown as Promise<InsertResult>;
}
function dbUpdate(t: AnySupabaseTable, patch: Record<string, unknown>, id: string): Promise<MutateResult> {
  return t.update(patch as never).eq('id', id) as unknown as Promise<MutateResult>;
}
function dbDelete(t: AnySupabaseTable, id: string): Promise<MutateResult> {
  return t.delete().eq('id', id) as unknown as Promise<MutateResult>;
}

/**
 * Returns a {POST, PUT, DELETE} handler set for a simple admin CRUD endpoint.
 * Usage: export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'solutions' });
 */
export function makeCrudHandlers({ table, labelField = 'title' }: CrudOptions) {
  function getTable(): AnySupabaseTable {
    return getSupabaseAdminClient().from(table);
  }

  async function POST(request: NextRequest) {
    const user = await requireAdmin().catch(() => null);
    if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

    const idem = await checkIdempotencyHeader(request);
    if (idem.kind === 'invalid') {
      return NextResponse.json({ ok: false, message: 'Idempotency-Key inválida (8-128 chars alfanuméricos).' }, { status: 400 });
    }
    if (idem.kind === 'in_flight') {
      return NextResponse.json({ ok: false, message: 'Requisição já está em processamento.' }, { status: 409 });
    }
    if (idem.kind === 'replay') return idem.response;
    const idempotencyKey = idem.kind === 'fresh' ? idem.key : null;

    let raw: Record<string, unknown>;
    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, message: 'JSON inválido.' }, { status: 400 });
    }
    const v = validate(table, raw);
    if (!v.ok) return NextResponse.json({ ok: false, message: v.message }, { status: 400 });

    const { data, error } = await dbInsert(getTable(), v.data);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

    try {
      await logActivity({
        userId: user.id, userEmail: user.email, action: 'create',
        tableName: table, recordId: data?.id,
        recordLabel: labelField ? String(v.data[labelField] ?? '') : undefined,
        ...getRequestMeta(request),
      });
    } catch (e) {
      log.warn('logActivity failed (create)', { table }, e);
    }
    revalidateTable(table);

    const successBody = JSON.stringify({ ok: true, id: data?.id });
    await storeIdempotent(idempotencyKey, 200, successBody);
    return new NextResponse(successBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function PUT(request: NextRequest) {
    const user = await requireAdmin().catch(() => null);
    if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

    const idem = await checkIdempotencyHeader(request);
    if (idem.kind === 'invalid') {
      return NextResponse.json({ ok: false, message: 'Idempotency-Key inválida (8-128 chars alfanuméricos).' }, { status: 400 });
    }
    if (idem.kind === 'in_flight') {
      return NextResponse.json({ ok: false, message: 'Requisição já está em processamento.' }, { status: 409 });
    }
    if (idem.kind === 'replay') return idem.response;
    const idempotencyKey = idem.kind === 'fresh' ? idem.key : null;

    let raw: { id: string; [k: string]: unknown };
    try {
      raw = (await request.json()) as { id: string; [k: string]: unknown };
    } catch {
      return NextResponse.json({ ok: false, message: 'JSON inválido.' }, { status: 400 });
    }
    const { id, ...rest } = raw;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, message: 'ID obrigatório.' }, { status: 400 });
    }
    const v = validate(table, rest);
    if (!v.ok) return NextResponse.json({ ok: false, message: v.message }, { status: 400 });

    const { error } = await dbUpdate(getTable(), v.data, id);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

    try {
      await logActivity({
        userId: user.id, userEmail: user.email, action: 'update',
        tableName: table, recordId: id,
        recordLabel: labelField ? String(v.data[labelField] ?? '') : undefined,
        ...getRequestMeta(request),
      });
    } catch (e) {
      log.warn('logActivity failed (update)', { table }, e);
    }
    revalidateTable(table);

    const successBody = JSON.stringify({ ok: true });
    await storeIdempotent(idempotencyKey, 200, successBody);
    return new NextResponse(successBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function DELETE(request: NextRequest) {
    const user = await requireAdmin().catch(() => null);
    if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

    const idem = await checkIdempotencyHeader(request);
    if (idem.kind === 'invalid') {
      return NextResponse.json({ ok: false, message: 'Idempotency-Key inválida (8-128 chars alfanuméricos).' }, { status: 400 });
    }
    if (idem.kind === 'in_flight') {
      return NextResponse.json({ ok: false, message: 'Requisição já está em processamento.' }, { status: 409 });
    }
    if (idem.kind === 'replay') return idem.response;
    const idempotencyKey = idem.kind === 'fresh' ? idem.key : null;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, message: 'ID obrigatório.' }, { status: 400 });

    const { error } = await dbDelete(getTable(), id);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

    try {
      await logActivity({
        userId: user.id, userEmail: user.email, action: 'delete',
        tableName: table, recordId: id,
        ...getRequestMeta(request),
      });
    } catch (e) {
      log.warn('logActivity failed (delete)', { table }, e);
    }
    revalidateTable(table);

    const successBody = JSON.stringify({ ok: true });
    await storeIdempotent(idempotencyKey, 200, successBody);
    return new NextResponse(successBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { POST, PUT, DELETE };
}
