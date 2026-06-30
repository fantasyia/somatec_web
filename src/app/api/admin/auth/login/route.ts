import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { limitAdminLogin, limitAdminLoginByEmail, peekAdminLoginByEmail, resetAdminLoginByEmail } from '@/lib/ratelimit/upstash';
import { rateLimitHeaders } from '@/lib/ratelimit/headers';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { createLogger } from '@/lib/logger';
import { getClientIp } from '@/lib/http/client-ip';

const log = createLogger('admin-login');

// Mensagem genérica para todos os erros de autenticação — evita user enumeration.
const GENERIC_AUTH_FAILURE = 'E-mail ou senha incorretos.';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Camada 1+2: rate limit por IP (burst 5/min + janela 10/15min)
  const ipLimit = await limitAdminLogin(ip);
  if (!ipLimit.allowed) {
    log.warn('rate limit by IP exceeded', { ip });
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: rateLimitHeaders(ipLimit) },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requisição inválida.' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ ok: false, message: 'E-mail e senha são obrigatórios.' }, { status: 400 });
  }

  // Camada 3: rate limit por email — agora conta SÓ FALHAS e limpa no sucesso, então
  // um login correto nunca é bloqueado por logins certos anteriores nem por um atacante
  // que só dispara requests. Aqui apenas CONSULTAMOS o bucket (peek, sem consumir).
  const emailPeek = await peekAdminLoginByEmail(email);
  if (!emailPeek.allowed) {
    log.warn('rate limit by email exceeded', { email, ip });
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas para esta conta. Aguarde alguns minutos.' },
      { status: 429, headers: rateLimitHeaders(emailPeek) },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await limitAdminLoginByEmail(email); // penaliza SÓ a falha
    log.warn('login failed: invalid credentials', { email, ip });
    return NextResponse.json({ ok: false, message: GENERIC_AUTH_FAILURE }, { status: 401 });
  }

  // Verify admin_profiles — mesma resposta de credentials inválidas (anti user enumeration).
  // Se um email tem conta Supabase mas não é admin, atacante não pode distinguir.
  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from('admin_profiles')
    .select('id, active')
    .eq('user_id', data.user.id)
    .eq('active', true)
    .maybeSingle();

  if (!profile) {
    await limitAdminLoginByEmail(email); // penaliza SÓ a falha
    log.warn('login denied: not admin or inactive', { email, ip, userId: data.user.id });
    await supabase.auth.signOut();
    return NextResponse.json({ ok: false, message: GENERIC_AUTH_FAILURE }, { status: 401 });
  }

  await resetAdminLoginByEmail(email); // sucesso limpa o bucket por-email do legítimo

  const meta = getRequestMeta(request);
  await logActivity({
    userId: data.user.id,
    userEmail: data.user.email ?? email,
    action: 'admin_login',
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ ok: true });
}
