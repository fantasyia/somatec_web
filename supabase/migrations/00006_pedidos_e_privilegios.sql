-- =============================================================================
-- 00006 — PEDIDOS VERSIONADOS + PRIVILÉGIOS FECHADOS PRO ANON
--
-- Duas coisas que a auditoria de 13/09/2026 encontrou no banco e que este
-- repositório não sabia:
--
-- 1. A tabela `pedidos`, a `config_privada` e as cinco funções de pedido
--    (`gerar_numero_pedido`, `criar_pedido`, `consultar_pedido`,
--    `atualizar_status_pedido`, `limpar_pedidos_de_teste`) existiam SÓ no
--    banco — criadas à mão entre julho e setembro, sem migration em nenhum dos
--    dois repositórios. Reaplicar as migrations "do zero" perdia o checkout.
--    Este arquivo é o texto delas como estavam no banco em 13/09
--    (`pg_get_functiondef`), com `create … if not exists` / `or replace` pra
--    ser idempotente em cima do que já existe.
--
-- 2. As oito funções SECURITY DEFINER eram EXECUTÁVEIS PELA CHAVE ANÔNIMA.
--    No Supabase toda função em `public` nasce com EXECUTE pra `anon` e
--    `authenticated`. Provado por REST em 13/09: `POST /rest/v1/rpc/is_admin`
--    com a anon key → 200. Consequência prática:
--      • `reorder_by_display_order` reordenava slider, CTAs, menu e rodapé da
--        home sem conta e sem log. O `scripts/015-reorder-rpc.sql` (aplicado
--        30/06) fazia o revoke — a função foi recriada depois e o grant voltou.
--      • `criar_pedido` criava pedido com qualquer item e preço, pulando zod,
--        Turnstile, rate limit e `precificarPedido` da rota.
--    O site chama TODAS elas com `service_role` (`src/lib/pedidos/servidor.ts`),
--    então nenhum grant pra anon/authenticated tem uso legítimo — exceto
--    `is_admin()`, que as policies de RLS avaliam no contexto do usuário
--    autenticado e por isso continua executável por `authenticated`.
--
-- ⚠️ A tabela `pedidos` também tinha ALL pra anon/authenticated (grant padrão
-- do schema). O RLS sem policy já negava, mas privilégio de tabela é a segunda
-- barreira quando alguém desliga RLS "só pra testar" — e existe uma migration
-- no repositório do CMS que faz exatamente isso em 15 tabelas.
-- =============================================================================

-- ── Tabelas ──────────────────────────────────────────────────────────────────

create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           text not null unique,
  status           text not null default 'recebido'
                   check (status in ('recebido', 'em_separacao', 'enviado', 'entregue', 'cancelado')),
  nome             text not null,
  email            text not null,
  whatsapp         text,
  empresa          text,
  itens            jsonb not null default '[]'::jsonb,
  total_centavos   integer not null default 0,
  frete_centavos   integer not null default 0,
  forma_pagamento  text,
  endereco         jsonb not null default '{}'::jsonb,
  setor            text,
  origem           text,
  transportadora   text,
  rastreio_codigo  text,
  rastreio_url     text,
  historico        jsonb not null default '[]'::jsonb,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index if not exists pedidos_email_idx on public.pedidos (lower(email));
create index if not exists pedidos_status_idx on public.pedidos (status, criado_em desc);
create unique index if not exists pedidos_numero_normalizado_idx
  on public.pedidos (upper(regexp_replace(numero, '[^A-Za-z0-9]', '', 'g')));

create or replace function public.pedidos_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists pedidos_touch_trg on public.pedidos;
create trigger pedidos_touch_trg
  before update on public.pedidos
  for each row execute function public.pedidos_touch();

-- Segredo do status (hash SHA-256 de PEDIDOS_STATUS_SECRET) e o que mais for
-- privado. Sem policy de propósito: só service_role lê.
create table if not exists public.config_privada (
  chave          text primary key,
  valor          text,
  atualizado_em  timestamptz default now()
);

alter table public.pedidos        enable row level security;
alter table public.config_privada enable row level security;

-- ── Funções de pedido (texto do banco em 13/09/2026) ─────────────────────────

create or replace function public.gerar_numero_pedido()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alfabeto constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  n constant integer := length(alfabeto);
  sufixo text := '';
  b bytea;
  i integer;
begin
  b := extensions.gen_random_bytes(6);
  for i in 0..5 loop
    sufixo := sufixo || substr(alfabeto, (get_byte(b, i) % n) + 1, 1);
  end loop;
  -- Sem hífen: SB + AAMM + 6 caracteres = 12 posições, tudo alfanumérico.
  return 'SB' || to_char(now() at time zone 'America/Sao_Paulo', 'YYMM') || sufixo;
end;
$$;

create or replace function public.criar_pedido(
  p_nome text,
  p_email text,
  p_whatsapp text default null,
  p_empresa text default null,
  p_itens jsonb default '[]'::jsonb,
  p_total_centavos integer default 0,
  p_frete_centavos integer default 0,
  p_forma_pagamento text default null,
  p_endereco jsonb default '{}'::jsonb,
  p_setor text default null,
  p_origem text default null
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_numero text;
  v_tentativa integer := 0;
  v_recentes integer;
begin
  if coalesce(trim(p_nome), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'nome e email sao obrigatorios';
  end if;

  select count(*) into v_recentes
  from public.pedidos
  where lower(email) = lower(trim(p_email))
    and criado_em > now() - interval '1 hour';

  if v_recentes >= 10 then
    raise exception 'muitos pedidos para este e-mail na ultima hora';
  end if;

  loop
    v_tentativa := v_tentativa + 1;
    v_numero := gerar_numero_pedido();
    begin
      insert into public.pedidos (
        numero, nome, email, whatsapp, empresa, itens, total_centavos,
        frete_centavos, forma_pagamento, endereco, setor, origem, historico
      ) values (
        v_numero, trim(p_nome), lower(trim(p_email)), p_whatsapp, p_empresa,
        coalesce(p_itens, '[]'::jsonb), coalesce(p_total_centavos, 0),
        coalesce(p_frete_centavos, 0), p_forma_pagamento,
        coalesce(p_endereco, '{}'::jsonb), p_setor, p_origem,
        jsonb_build_array(jsonb_build_object(
          'status', 'recebido',
          'em', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
          'nota', 'Pedido registrado pelo site.'
        ))
      );
      return v_numero;
    exception when unique_violation then
      if v_tentativa >= 25 then
        raise exception 'nao foi possivel gerar numero de pedido unico';
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.consultar_pedido(p_numero text)
returns table(
  numero text, status text, criado_em timestamptz, atualizado_em timestamptz,
  itens jsonb, total_centavos integer, frete_centavos integer, forma_pagamento text,
  transportadora text, rastreio_codigo text, rastreio_url text, historico jsonb,
  primeiro_nome text, cidade text, uf text
)
language sql
security definer
set search_path = public
as $$
  select
    p.numero, p.status, p.criado_em, p.atualizado_em, p.itens,
    p.total_centavos, p.frete_centavos, p.forma_pagamento,
    p.transportadora, p.rastreio_codigo, p.rastreio_url, p.historico,
    split_part(p.nome, ' ', 1) as primeiro_nome,
    nullif(p.endereco->>'cidade', '') as cidade,
    nullif(p.endereco->>'uf', '') as uf
  from public.pedidos p
  where upper(regexp_replace(p.numero, '[^A-Za-z0-9]', '', 'g'))
      = upper(regexp_replace(coalesce(p_numero, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;
$$;

create or replace function public.atualizar_status_pedido(
  p_segredo text,
  p_numero text,
  p_status text,
  p_nota text default null,
  p_transportadora text default null,
  p_rastreio_codigo text default null,
  p_rastreio_url text default null
)
returns table(numero text, status text, atualizado_em timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_status_atual text;
  v_hash_esperado text;
begin
  select c.valor into v_hash_esperado
  from public.config_privada c where c.chave = 'pedidos_secret_sha256';

  if coalesce(v_hash_esperado, '') = '' then
    raise exception 'segredo de pedidos nao configurado';
  end if;

  if encode(extensions.digest(coalesce(p_segredo, ''), 'sha256'), 'hex') <> lower(v_hash_esperado) then
    raise exception 'nao autorizado';
  end if;

  if p_status not in ('recebido', 'em_separacao', 'enviado', 'entregue', 'cancelado') then
    raise exception 'status invalido: %', p_status;
  end if;

  select p.id, p.status into v_id, v_status_atual
  from public.pedidos p
  where upper(regexp_replace(p.numero, '[^A-Za-z0-9]', '', 'g'))
      = upper(regexp_replace(coalesce(p_numero, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;

  if v_id is null then
    raise exception 'pedido nao encontrado';
  end if;

  update public.pedidos p set
    status = p_status,
    transportadora   = coalesce(p_transportadora, p.transportadora),
    rastreio_codigo  = coalesce(p_rastreio_codigo, p.rastreio_codigo),
    rastreio_url     = coalesce(p_rastreio_url, p.rastreio_url),
    historico = case
      when v_status_atual = p_status then p.historico
      else p.historico || jsonb_build_array(jsonb_build_object(
        'status', p_status,
        'em', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
        'nota', p_nota
      ))
    end
  where p.id = v_id;

  return query
    select p.numero, p.status, p.atualizado_em from public.pedidos p where p.id = v_id;
end;
$$;

create or replace function public.limpar_pedidos_de_teste(p_origem text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apagados integer;
begin
  if p_origem is distinct from 'teste-automatizado' then
    raise exception 'esta funcao so apaga pedidos de origem teste-automatizado';
  end if;
  delete from public.pedidos where origem = 'teste-automatizado';
  get diagnostics v_apagados = row_count;
  return v_apagados;
end;
$$;

-- ── Privilégios ──────────────────────────────────────────────────────────────
-- Tabelas privadas: nem SELECT pro anon/authenticated. RLS já nega; isto nega
-- de novo caso o RLS seja desligado.
revoke all on table public.pedidos        from public, anon, authenticated;
revoke all on table public.config_privada from public, anon, authenticated;
grant  all on table public.pedidos        to service_role;
grant  all on table public.config_privada to service_role;

-- Funções SECURITY DEFINER: só service_role executa.
revoke all on function public.gerar_numero_pedido()                                                         from public, anon, authenticated;
revoke all on function public.criar_pedido(text, text, text, text, jsonb, integer, integer, text, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.consultar_pedido(text)                                                        from public, anon, authenticated;
revoke all on function public.atualizar_status_pedido(text, text, text, text, text, text, text)             from public, anon, authenticated;
revoke all on function public.limpar_pedidos_de_teste(text)                                                 from public, anon, authenticated;
revoke all on function public.reorder_by_display_order(text, uuid[])                                        from public, anon, authenticated;
revoke all on function public.rls_auto_enable()                                                             from public, anon, authenticated;

grant execute on function public.gerar_numero_pedido()                                                         to service_role;
grant execute on function public.criar_pedido(text, text, text, text, jsonb, integer, integer, text, jsonb, text, text) to service_role;
grant execute on function public.consultar_pedido(text)                                                        to service_role;
grant execute on function public.atualizar_status_pedido(text, text, text, text, text, text, text)             to service_role;
grant execute on function public.limpar_pedidos_de_teste(text)                                                 to service_role;
grant execute on function public.reorder_by_display_order(text, uuid[])                                        to service_role;

-- `is_admin()` é avaliada DENTRO das policies (`using (is_admin())`) com o papel
-- de quem consulta — o admin logado é `authenticated` e precisa poder chamar.
-- O anon não tem policy que dependa dela, então sai.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Funções novas em `public` não devem mais nascer executáveis pelo anon.
alter default privileges in schema public revoke execute on functions from public, anon;
