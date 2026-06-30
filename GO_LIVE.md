# GO-LIVE — Pendências operacionais (MSM Site)

> Itens que **dependem de acessos externos** (Railway, Supabase, GitHub web, arquivos de
> marca registrada) e por isso **não podem ser concluídos pelo código no repositório**.
> Cada item traz: o que falta, por que depende de você, e o passo exato.
>
> Gerado em 2026-05-31. Marque `[x]` conforme for concluindo.

## Legenda de prioridade
- 🔴 **Bloqueia** funcionalidade em produção
- 🟡 **Recomendado** antes do go-live público
- 🟢 **Pode esperar** / cosmético

---

## 1. 🔴 Cron jobs — `CRON_SECRET` (GitHub Secret **+** Railway env)

Os 3 crons (`process-webhook-queue` a cada 5 min, `health-monitor` a cada 6 h,
`audit-archive` diário) rodam via **GitHub Actions** (`.github/workflows/cron.yml`),
que chama `SITE_URL/api/cron/*` com header `Authorization: Bearer $CRON_SECRET`.
A rota valida o mesmo `CRON_SECRET` na env do Railway — **em produção, sem ele,
`/api/cron/*` responde HTTP 500** e a fila de webhooks do MullerBot não é processada.

**Por que não fiz:** o `gh` CLI não está instalado nesta máquina e setar GitHub Secrets
exige login web (config persistente sensível). É ação sua.

- [ ] **(a) Gerar o segredo** — use o valor que mandei no chat, ou gere outro:
  `openssl rand -hex 32`
- [ ] **(b) GitHub** → repo `fantasyia/site-msm` → *Settings → Secrets and variables →
  Actions → New repository secret*. Crie **dois**:
  - `CRON_SECRET` = o valor gerado
  - `SITE_URL` = `https://site-msm-production.up.railway.app` *(sem barra final; troque
    pela URL definitiva quando subir — ver item 6)*
- [ ] **(c) Railway** → serviço do site → *Variables* → adicione `CRON_SECRET` com **o
  mesmo valor** do passo (a). Salve (o Railway redeploya).
- [ ] **(d) Validar** → GitHub → aba *Actions* → workflow "Cron jobs MSM" → *Run workflow*
  → escolha `webhook-queue` → deve sair **HTTP 2xx** (não 401/500).

---

## 2. 🔴 Supabase Auth — Site URL + Redirect (reset de senha)  *(pendência #14)*

O fluxo "esqueci minha senha" do admin manda um e-mail com link de redirect. Sem a
**Site URL** e os **Redirect URLs** configurados no Supabase, o link aponta pro lugar
errado (ou `localhost`) e o reset não funciona em produção.

**Por que não fiz:** é config no **painel do Supabase** (não tenho acesso) e depende da
URL definitiva (ver item 6).

- [ ] Supabase → *Authentication → URL Configuration*:
  - **Site URL** = a URL pública do site (provisória: `https://site-msm-production.up.railway.app`)
  - **Redirect URLs** → adicione `https://<sua-url>/admin/redefinir-senha` (e a versão
    com a URL definitiva quando tiver)
- [ ] **SMTP próprio** (recomendado): Supabase → *Project Settings → Auth → SMTP Settings*.
  O SMTP padrão do Supabase tem limite baixo e baixa entregabilidade — para reset de senha
  confiável, configure um provedor (Resend, SendGrid, SES, Brevo…). Precisa de host/porta/
  usuário/senha do provedor (credenciais suas).

---

## 3. 🔴 Migration `014-certifications` no Supabase de produção

A key `site_settings.certifications` (consumida pelo Footer) é semeada pela migration
`scripts/014-certifications-setting.sql`. Ela já foi aplicada **localmente**. Se o
Supabase de **produção** for o mesmo projeto do `.env.local`, **já está**. Se for um
projeto separado, precisa rodar lá.

**Por que não fiz:** preciso da connection string (`DATABASE_URL`) do banco de **produção**
— credencial que não tenho.

- [ ] Descobrir se prod = mesmo projeto Supabase do `.env.local`.
  - Se **sim** → nada a fazer.
  - Se **não** → rodar apontando pro banco de prod (a migration é idempotente, então é
    seguro rodar; aplica só o que faltar e pula o resto):
    ```bash
    DATABASE_URL="postgresql://postgres:<senha>@<host-prod>:5432/postgres" npm run migrate
    ```
    Connection string em: Supabase (projeto de prod) → *Project Settings → Database →
    Connection string → URI*.
- [ ] Conferir: admin → `/admin/configuracoes → Certificações` deve listar os 4 selos.

---

## 4. 🟡 Endurecimento de secrets no build do Railway  *(follow-up #16)*

O Railway builda via **Nixpacks** (`railway.json`), que injeta as env vars do serviço
como `ENV` durante o build. As `NEXT_PUBLIC_*` **precisam** estar em build time (o Next
faz inline no bundle), mas as secrets server-side (`SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `MULLERBOT_API_KEY`…) ficam disponíveis no
ambiente de build mesmo sem necessidade — defesa-em-profundidade, **não** um vazamento
ativo.

**Estado atual (já protegido na camada de repo):** o `.gitignore` cobre `.env*.local` e
`.env`, então **nenhum secret está versionado no Git**. A imagem do Railway é privada.
Risco real: **baixo**.

**Por que é operacional:** Nixpacks não separa build/runtime vars nativamente; a mitigação
fina é no painel do Railway. Ações (todas suas, opcionais):

- [ ] Confirmar que os build logs do Railway **não imprimem** env vars (não imprimimos por
  código; checar se nenhum passo customizado faz `printenv`/`env`).
- [ ] **Least-privilege:** a `service_role` key bypassa RLS — garanta que ela só é usada em
  server actions/rotas (já é o caso no código) e **rotacione** se algum dia apareceu em log.
- [ ] Manter o serviço/imagem do Railway **privados** (padrão).

> Nada a alterar no repositório — a parte versionável (`.gitignore`) já está correta.

---

## 5. 🟡 Logos oficiais de certificação

`public/certifications/{fssc-22000,brcgs,iso-9001,halal}.svg` são **placeholders**
(selos dourados com o nome da norma). Estão apresentáveis para um go-live interino, mas
não são os logos oficiais.

**Por que não fiz:** FSSC 22000, BRCGS, ISO 9001 e Halal são **marcas registradas** — não
posso recriar nem baixar os logos oficiais por copyright, e você precisa ter o direito/os
arquivos de uso.

- [ ] Obter os SVGs/PNGs oficiais (ou só os que a MSM realmente possui).
- [ ] Opção A: substituir os arquivos em `public/certifications/` mantendo os mesmos nomes.
- [ ] Opção B: subir no admin → `/admin/configuracoes → Certificações` (editar label + URL).
- [ ] **Importante:** exiba apenas selos que a MSM efetivamente possui (risco legal/reputação).

---

## 6. 🔴 URL definitiva do site

Hoje tudo aponta pra `https://site-msm-production.up.railway.app` (provisória). Quando o
domínio definitivo subir, atualize em **3 lugares**:

- [ ] Railway → *Variables* → `NEXT_PUBLIC_SITE_URL` = URL definitiva
- [ ] GitHub → Secret `SITE_URL` (item 1) = URL definitiva
- [ ] Supabase → Auth Site URL + Redirect URLs (item 2) = URL definitiva
- [ ] (Domínio) Railway → *Settings → Networking → Custom Domain* + DNS no registrador

---

## 7. 🟢 FAQ das soluções — dados reais  *(conteúdo)*

`src/content/solutionsFaq.ts` tem respostas **genéricas e factualmente seguras** (não
inventam números — regra v1.0 §9). Está pronto para subir assim. O refinamento pendente é
trocar o genérico por **dados reais do negócio**, que só você tem.

**Por que não fiz:** não posso inventar pedido mínimo, prazos, territórios ou capacidades.

- [ ] Se quiser especificar, me passe os dados e eu edito o arquivo. Ex.:
  - Pedido mínimo (food service / B2B / marca própria)
  - Prazo médio de entrega por região
  - Territórios de distribuição abertos
  - Volume mínimo de terceirização/envase
  - Certificações reais a citar nas respostas

---

### Resumo rápido (ordem sugerida)
1. URL definitiva (item 6) — destrava 1, 2 e fixa o resto
2. `CRON_SECRET` GitHub + Railway (item 1)
3. Supabase Auth + SMTP (item 2)
4. Migration prod se separado (item 3)
5. Logos oficiais (item 5) + FAQ real (item 7) quando tiver o conteúdo
6. Hardening Railway (item 4) — baixa prioridade
