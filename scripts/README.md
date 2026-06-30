# Scripts / Migrations

Migrations idempotentes e versionadas para o banco MSM.

## Estrutura

```
scripts/
├── 000-schema-migrations.sql      # tracking de migrations aplicadas
├── 001-seed-site-settings.sql     # seed inicial de site_settings
└── apply-seed.mjs                 # runner Node
```

Prefixo numérico (`000`, `001`, ...) garante ordem alfabética = ordem cronológica de aplicação.

## Como funciona o tracking

A tabela `_schema_migrations` registra:

| coluna | tipo | descrição |
|---|---|---|
| `id` | text PK | nome do arquivo (ex: `001-seed-site-settings.sql`) |
| `applied_at` | timestamptz | quando foi aplicada |
| `duration_ms` | integer | tempo de execução |
| `checksum` | text | SHA256 do conteúdo no momento da aplicação |

Ao rodar `npm run migrate`:

1. Cria `_schema_migrations` se não existir
2. Lista arquivos `.sql` em ordem alfabética
3. Para cada arquivo:
   - Se já registrado: pula. Avisa se checksum diferente (você editou em vez de criar nova migration).
   - Senão: aplica em transação (`BEGIN`/`COMMIT`); registra na tabela; rollback em erro.

## Comandos

```bash
# Definir DATABASE_URL em .env.local (Supabase → Project Settings → Database)
npm run migrate    # ou: npm run seed (alias)
```

## Adicionando uma nova migration

1. Crie `scripts/NNN-descricao.sql` com o próximo número:
   ```bash
   # próximo número = max(arquivos existentes) + 1
   touch scripts/002-add-feature.sql
   ```
2. Escreva SQL **idempotente** (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`)
3. Teste localmente: `npm run migrate`
4. Commite

**Nunca edite migrations já aplicadas em produção.** O runner avisa via checksum quando isso acontece. Faça uma nova migration com a alteração desejada.

## Seed de conteúdo de demonstração

`010-demo-content.sql` popula o site com conteúdo realista mas genérico para demos/preview enquanto não há conteúdo final do cliente.

**O que cria:**
- 5 categorias de produtos (Molhos, Óleos, Laticínios, Cereais, Premium)
- 4 aplicações (Pizzarias, Hamburguerias, Cozinhas Industriais, Padarias)
- 3 marcas (Cocina, Massa Brasil, Naturale) com posicionamento próprio
- 10 produtos amarrados a marcas e categorias
- 12 links produto×aplicação
- 3 categorias de receitas
- 5 receitas completas (com `ingredients`/`instructions` jsonb estruturado)
- 4 banners home
- 1 home hero ativo
- 4 slider items
- 5 CTA cards (1 por solução)

**Imagens:** `picsum.photos` seedado (placeholder neutro). Trocar por uploads reais via `/admin/midias` quando disponíveis.

**Conteúdo:** textos institucionais realistas, **sem inventar números** (volumes, ano de fundação, certificações específicas, marcas de terceiros).

**Rodar:**
```bash
npm run migrate    # aplica todas as migrations em ordem alfabética
```

O `010-` prefix garante que este seed roda APÓS as migrations base (`000-`, `001-`, `002-`, `003-`).

**Re-rodar é seguro:** `ON CONFLICT (id) DO UPDATE SET ...` — corrigir um texto aqui e re-aplicar atualiza no banco em vez de duplicar.

## Backup automatizado

GitHub Actions roda `pg_dump` diariamente às 03:00 UTC e salva como artifact (retenção 30 dias).

**Setup (uma vez):**
1. Pegue a connection string DIRETA em Supabase → Project Settings → Database → Connection string (URI, porta 5432, não a pooler).
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret
3. Nome: `DATABASE_URL_BACKUP`, valor: a connection string completa
4. Workflow: `.github/workflows/backup.yml`

**Trigger manual:**
- GitHub repo → Actions → Database Backup → Run workflow

**Restore:**
```bash
# 1. Baixe o artifact da run
# 2. Restaure em DB de destino
gunzip -c msm-backup-2026-05-17T03-00-00Z.sql.gz | psql $DATABASE_URL
```

**Observações:**
- Apenas schema `public` (ignora `auth`, `storage` do Supabase — esses são gerenciados pela própria Supabase)
- RLS policies e triggers são exportados junto com as tabelas
- Para restore em projeto Supabase novo, rode `npm run migrate` antes para recriar `_schema_migrations` + seed
