-- =============================================================================
-- 00007 — PROVA DE CONSENTIMENTO LGPD (cookies)
--
-- Até 13/09/2026 a rota /api/lgpd/consent só mandava o consentimento pro
-- MULLERBOT_WEBHOOK_URL — CRM legado cujas envs nem existem mais no Railway.
-- Resultado: NENHUM consentimento de cookie era gravado em lugar nenhum, e a
-- rota respondia `ok: true` do mesmo jeito. Sem prova, o banner é decorativo.
--
-- Esta tabela é a fonte DURÁVEL da prova (decisão do Léo: gravar aqui e também
-- espelhar no Betinna). Guarda o mínimo que a LGPD pede pra demonstrar
-- consentimento informado: o que a pessoa escolheu, quando, de qual IP, e a
-- VERSÃO + hash do texto que ela viu — se o texto do banner mudar, dá pra
-- provar qual versão cada registro aceitou.
--
-- Sem policy de RLS de propósito: só o service_role (a rota, server-side)
-- escreve e lê. Não há por que o anon tocar nisto.
-- =============================================================================

create table if not exists public.lgpd_consent (
  id            uuid primary key default gen_random_uuid(),
  accepted      boolean not null,
  ip            text,
  user_agent    text,
  text_version  text not null,
  text_hash     text not null,
  origem        text not null default 'cookie_banner',
  criado_em     timestamptz not null default now()
);

create index if not exists lgpd_consent_criado_em_idx on public.lgpd_consent (criado_em desc);

alter table public.lgpd_consent enable row level security;

revoke all on table public.lgpd_consent from public, anon, authenticated;
grant  all on table public.lgpd_consent to service_role;
