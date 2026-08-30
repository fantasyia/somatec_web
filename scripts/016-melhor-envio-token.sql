-- =============================================================================
-- 016 — Token do Melhor Envio (uma linha, renovada sozinha)
--
-- O Melhor Envio só entrega token por OAuth, e ele EXPIRA: access em 30 dias,
-- refresh em 45. Guardar isso em env var significaria o frete parar de cotar
-- sozinho um mês depois do lançamento, calado — e o refresh ROTACIONA, então
-- nem daria pra reusar o valor antigo.
--
-- Por isso o token mora no banco: o site renova e regrava. Uma linha só
-- (`id = 1`) porque é uma conta Melhor Envio, do tenant deste site.
--
-- 🔒 RLS ligado e ZERO políticas: a tabela é invisível pra chave anon (que vai
-- no bundle e é pública). Só o service_role — que existe apenas no servidor —
-- enxerga. Mesmo desenho de `pedidos` e `config_privada`.
-- =============================================================================

create table if not exists public.melhor_envio_token (
  id                smallint primary key default 1,
  access_token      text not null,
  refresh_token     text not null,
  escopo            text,
  expira_em         timestamptz not null,
  refresh_expira_em timestamptz not null,
  -- Trava de renovação. O refresh é de uso ÚNICO: duas requisições renovando
  -- ao mesmo tempo queimariam o mesmo refresh e a segunda invalidaria a
  -- conexão — que só volta com autorização manual no navegador.
  renovando_ate     timestamptz,
  atualizado_em     timestamptz not null default now(),
  constraint melhor_envio_token_linha_unica check (id = 1)
);

alter table public.melhor_envio_token enable row level security;

comment on table public.melhor_envio_token is
  'Token OAuth do Melhor Envio (linha única). Renovado pelo site; sem políticas de RLS — service_role apenas.';
