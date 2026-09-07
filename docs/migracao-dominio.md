# Migração para `www.somatecblocking.com.br`

> Levantamento feito em **06/09/2026** pela sessão do SITE, a pedido do Léo.
> Cada seção é endereçada a **uma sessão**. Faça a sua e marque; a ordem no fim importa.

---

## ✅ EXECUTADO EM 07/09/2026 — leia antes de seguir o resto

O domínio **está no ar**. As seções 1 e 2 abaixo foram feitas; as 3, 4, 5 e 6 continuam abertas para as sessões donas.

| | estado |
|---|---|
| `https://www.somatecblocking.com.br` | 200, certificado Let's Encrypt até 06/12/2026 |
| `https://somatecblocking.com.br` (apex) | 200, certificado próprio |
| HTTP → HTTPS | 301 nos dois |
| canonical | aponta pro `www` nos dois — sem conteúdo duplicado |
| `NEXT_PUBLIC_SITE_URL` | `https://www.somatecblocking.com.br` |
| fallbacks de código | atualizados (commit `10a93dd`) |
| e-mail | **intacto** — MX, SPF, os 2 DKIM e os CNAME `send`/`rsend` conferidos um a um depois da mudança |
| NOINDEX | **continua ligado**, como decidido |
| 26 URLs do sitemap | todas 200; nenhum link interno quebrado |

### ⚠️ Correção: o apex NÃO virou 301, virou ALIAS

A seção 1.5 deste doc manda conferir *"301 pro www"* no apex. **Não foi isso que aconteceu**, e a razão importa:

1. O Railway só aceita apex por `CNAME @`, e CNAME no apex engole o MX — mataria o Google Workspace.
2. O redirecionador da Hostinger **recusou**: *"Não é possível redirecionar seu domínio para ele mesmo"* — ele trata `www.<domínio>` como o mesmo domínio.

A saída foi **ALIAS na raiz**, que a Hostinger suporta: no hPanel escolhe-se tipo `CNAME` com nome `@` e o painel converte pra *CNAME ALIAS*. O ALIAS resolve o hostname e responde como **A**, sem expor CNAME — por isso convive com o MX.

**Consequência prática:** os dois hostnames **servem** o site, em vez de um redirecionar pro outro. O que impede conteúdo duplicado é o `canonical`, que aponta pro `www` nos dois. Se um dia isso incomodar em SEO, a solução é mover o DNS pra um provedor com redirect próprio (ou Cloudflare) — não é urgente.

**Como conferir o ALIAS** (o painel não rotula de forma óbvia, e resolver público cacheia resposta vazia por ~10 min):

```bash
nslookup -type=A     somatecblocking.com.br cosmos.dns-parking.com   # devolve A
nslookup -type=CNAME somatecblocking.com.br cosmos.dns-parking.com   # NÃO devolve CNAME
nslookup -type=MX    somatecblocking.com.br cosmos.dns-parking.com   # MX intacto
```

Essas três respostas juntas são a assinatura de um ALIAS funcionando.

### ⚠️ A API da Hostinger não serve pra este domínio

Os MCPs de DNS e domínios conectam e **leem**, mas toda escrita é recusada com `[DNS:4002] Customer does not own` / `[Domains:2006] Domain is not registered at Hostinger`. O domínio é registrado fora e só tem a zona estacionada lá. **DNS deste domínio é sempre à mão, no hPanel.**

### 🔴 Achado fora do previsto: Turnstile estava com chave de TESTE

A seção 2.3 supunha que era só acrescentar o domínio na allowlist. Na verdade o site rodava com o par `1x0000…` da Cloudflare, que **aprova qualquer token** — o formulário estava sem proteção nenhuma contra bot, desde antes da migração. Resolvido em 07/09 com chaves reais; token falso agora é recusado.

### O que a migração NÃO tocou

Nada de `SITE_NOINDEX`, nada de e-mail, e nada nas seções 3 a 6. Em especial, o **host do Railway continua hardcoded nos prompts do bot** (seção 3.1) — o que quer dizer que o bot ainda manda o cliente pro endereço antigo.

---

## 🔒 O QUE **NÃO** MUDA NESTA RODADA

**O site continua NOINDEX.** Decisão do Léo: o domínio entra no ar de forma gradual, com ajustes de layout ainda pendentes.

Na prática: `SITE_NOINDEX=true` **fica como está** no Railway. Hoje ele produz:

```
# https://api-production-29e1f.up.railway.app/robots.txt
User-Agent: *
Disallow: /
```

⚠️ **Ninguém "aproveita a migração" pra liberar o índice.** Trocar domínio e abrir pro Google na mesma janela junta duas mudanças de risco diferente: se algo quebrar, não dá pra saber qual das duas causou — e o Google indexa em minutos, mas leva semanas pra desindexar.

O `X-Robots-Tag` do `next.config.js` e o `robots: { index: ... }` das páginas leem a mesma variável. **Uma variável, um dia, e não é hoje.**

---

## Onde a coisa está hoje

| | |
|---|---|
| site novo servido em | `https://api-production-29e1f.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` em produção | **está setado** pro host do Railway — é o que sai em `canonical`, `og:url` e `sitemap.xml` |
| fallback no código | `https://somatecblocking.com.br` (**sem `www`**) |
| `somatecblocking.com.br` | ✅ **verificado em 06/09 via DNS público** — ver abaixo |

### A zona hoje (lida em 06/09, DoH)

| | |
|---|---|
| nameservers | `cosmos.dns-parking.com` · `nova.dns-parking.com` (**Hostinger**) |
| apex `somatecblocking.com.br` | **sem A, sem AAAA, sem CNAME** — não aponta pra lugar nenhum |
| `www` | `CNAME` → apex. Como o apex não resolve, **o www também não** |
| e-mail | Google Workspace + Resend, **os dois ativos** (detalhe na §2.4) |

➡️ **O site PHP antigo NÃO está no ar por este domínio.** Isso desfaz a preocupação de "derrubar o site velho": não há nada servindo. A migração é ocupar um domínio vazio — e o único risco de verdade é **quebrar o e-mail**, que está vivo.

---

## ⚠️ DECISÃO QUE PRECISA SAIR ANTES DE TUDO — `www` ou apex?

O Léo escreveu **`www.somatecblocking.com.br`**. O código tem o apex (`somatecblocking.com.br`, sem `www`) como fallback, e o e-mail comercial usa o apex.

**Escolha um como canônico e redirecione o outro com 301.** Não é preferência estética: os dois respondendo com conteúdo igual é conteúdo duplicado, divide sinal de SEO e faz cookie de sessão não valer entre eles.

Recomendo **`www` como canônico**, que é o que o Léo pediu — e o apex redirecionando pra ele. Mas quem decide é o Léo, e **tudo abaixo assume `https://www.somatecblocking.com.br`**. Se for o apex, é só trocar em todos os pontos.

---

## 1️⃣ Sessão **SITE** (`somatec_web`)

O código já é todo parametrizado. **Não há domínio hardcoded em página nenhuma** — o que existe é fallback.

### 1.1 A troca em si é UMA variável

No Railway, serviço do site:

```
NEXT_PUBLIC_SITE_URL=https://www.somatecblocking.com.br
```

Isso propaga sozinho para:

| onde | o que consome |
|---|---|
| `<link rel="canonical">` e `og:url` | `SITE.url` em `src/lib/constants/site.ts` |
| `sitemap.xml` | `src/app/sitemap.ts` (é `force-dynamic`, sai correto na primeira request) |
| `robots.txt` (linha do sitemap) | `src/app/robots.ts` |
| link do pedido no e-mail | `src/lib/email/pedido-confirmado.ts` → `${SITE.url}/pedido/<numero>` |
| `absoluteUrl()` | `src/lib/utils.ts` |
| JSON-LD | `src/lib/seo/structured-data.ts` |

### 1.2 Atualizar o fallback do código

Hoje o fallback é o apex. Se o canônico for `www`, os três pontos abaixo precisam acompanhar — eles só aparecem se a variável faltar, mas é exatamente aí que atrapalham:

- `src/lib/constants/site.ts:13`
- `src/lib/utils.ts:9`
- `src/app/layout.tsx:45` (`safeUrl`)

### 1.3 ⚠️ ISR e cache — o domínio velho fica em cache

As páginas são ISR de 1h e o **rodapé tem `unstable_cache` próprio** (tag `footer`), que **sobrevive ao deploy**. Depois de trocar a variável, canonical/og podem continuar com o host velho por até 1h.

Para forçar:

```bash
curl -X POST -H "authorization: Bearer $REVALIDATE_SECRET" \
  "https://www.somatecblocking.com.br/api/revalidate?tag=footer"
```

⚠️ O `REVALIDATE_SECRET` **não está** no `.env.local` (só no `.env.example`, vazio) — o valor real vive no Railway. Ver `docs`/memória do projeto.

### 1.4 O que **não** precisa mudar

- **CSP** (`next.config.js`): as diretivas usam `'self'`, então acompanham o domínio sozinhas. Turnstile, Supabase e Sentry são hosts de terceiros e não mudam.
- **CORS**: `/api/health` e `/api/version` respondem com `*`; nenhuma rota tem allowlist de origem por domínio.
- **Redirects**: todos são relativos (`/solucoes/:slug*` → `/produtos`), então valem em qualquer host.

### 1.5 Depois de trocar, conferir (não confie no deploy)

```bash
curl -s https://www.somatecblocking.com.br/api/version          # commit no ar
curl -s https://www.somatecblocking.com.br/sitemap.xml | head   # base URL nova
curl -s https://www.somatecblocking.com.br/robots.txt           # tem de continuar Disallow: /
curl -sI https://somatecblocking.com.br/ | head -3              # 301 pro www
```

---

## 2️⃣ Sessão / pessoa com acesso a **INFRA** (Léo)

Esta é a parte que **não está em código nenhum** e é a que trava tudo.

### 2.1 Railway — domínio customizado
- Adicionar `www.somatecblocking.com.br` como custom domain do serviço do site.
- O Railway devolve um `CNAME` para apontar.
- Aguardar o certificado SSL ser emitido **antes** de mandar tráfego.

### 2.2 DNS — painel da **Hostinger** (hPanel → Domínios → Zona DNS)

**Canônico decidido pelo Léo: `www.somatecblocking.com.br`.** O apex entra também, redirecionando.

**MEXER em 1 registro:**

| tipo | nome | valor hoje | valor novo |
|---|---|---|---|
| `CNAME` | `www` | `somatecblocking.com.br` | **o alvo que o Railway mostrar** |

**O apex** depende do que o Railway oferecer ao adicionar `somatecblocking.com.br`:
- se ele der um **A record** (IP) → cadastrar `A` no `@`
- se só der CNAME → o apex **não aceita CNAME** e a Hostinger **não tem ALIAS/ANAME**; usar o **redirecionamento de domínio** do hPanel (apex → `https://www.somatecblocking.com.br`)

⛔ **NÃO TOCAR — quebra o e-mail, que está vivo:**

```
MX     @                    1 smtp.google.com          ← Google Workspace
TXT    @                    v=spf1 include:_spf.google.com ~all
TXT    @                    google-site-verification=IzFQm3B-...
TXT    google._domainkey    v=DKIM1;k=rsa;p=...        ← DKIM do Workspace
CNAME  send                 send.forge.rmta.net        ← Resend
TXT    send                 v=spf1 ip4:52.3.252.119 ...
MX     send                 10 feedback.forge.rmta.net
TXT    resend._domainkey    p=MIGfMA0GCSq...           ← DKIM do Resend
```

⚠️ **O erro clássico é "limpar a zona" antes de cadastrar o novo.** Mexer só na linha do `www` e acrescentar o apex — nada além.

### 2.3 🔴 Cloudflare Turnstile — o captcha para de funcionar sem isso
O widget valida contra uma **allowlist de domínios** cadastrada no painel do Turnstile. O domínio novo **não está lá**.

Sem isso: `/contato`, o formulário de representante e o checkout NI passam a receber **400 no envio** — e o pior é que o site continua parecendo normal, o erro só aparece na hora de enviar.

➡️ Adicionar `www.somatecblocking.com.br` (e o apex, se for redirecionar) no site key `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

### 2.4 Resend — e-mail transacional
O remetente é `pedidos@somatecblocking.com.br` (domínio do apex, já em uso). **Não muda com a troca**, mas confirme que o domínio segue verificado (SPF/DKIM) — e que o DNS novo **não removeu** os registros de verificação.

⚠️ Este é o erro clássico da migração: mexer no DNS e derrubar SPF/DKIM sem perceber. O e-mail só falha quando alguém compra.

### 2.5 Analytics
`layout.tsx` carrega `googletagmanager.com/gtag/js`. Se houver propriedade GA4/Tag Manager com o domínio configurado, atualizar o data stream.

---

## 3️⃣ Sessões **MASTER — Criador / Testador de Fluxo** (prompts e fluxos no Betinna)

### 3.1 🔴 O host do Railway está **hardcoded nos prompts**

Confirmado no **C1-L v14**, que é o prompt que entrega o link da calculadora:

```
COMÉRCIO   → https://api-production-29e1f.up.railway.app/protecao-comercial
RESIDÊNCIA → https://api-production-29e1f.up.railway.app/protecao-residencial
```

E o mesmo prompt tem a regra:

> ⛔ **NUNCA invente um endereço.** As duas páginas acima são as únicas que existem — copie exatamente como estão.

⚠️ **Isso é bom e é o problema.** A regra impede o modelo de improvisar, então ele **vai continuar mandando o host do Railway** até alguém editar o prompt. Não adianta trocar o domínio e esperar que o bot perceba.

### 3.2 Prompts a varrer

Procurar por `api-production-29e1f` em **todos os 11 prompts ativos** (não li os 11; confirmei no C1-L e os candidatos abaixo são os que entregam link ou falam de pedido):

| prompt | por quê |
|---|---|
| **C1-L v14** | ✅ **confirmado** — os dois links da calculadora + 3 exemplos montados |
| **C1 v49** | entrega o mesmo link no caminho consultivo |
| **C1-A v9** | acolhimento, pode citar a página |
| **PV v5** | pós-venda — pode ter link de pedido/rastreio |
| **T1 v36** | triagem — verificar |
| C2 / C2-A / R1 / R1-Q / R1-FU / RB | industrial e reps: não entregam calculadora, mas varra |

### 3.3 Nós de fluxo com link
Além dos prompts, os **nós de `ENVIAR_WHATSAPP` e de e-mail** podem ter URL escrita à mão. Fluxos a conferir:

- **S** e **S2** (leads do site) — ATIVOS
- **P2** (rastreio disponível) e **P3** (pós-venda) — RASCUNHO, mas com link de pedido
- **E1–E5** (régua de e-mail) — RASCUNHO

⚠️ `fluxos_atualizar` é **substituição total** — editar fluxo ATIVO sem cuidado o rebaixa pra RASCUNHO. Já aconteceu.

### 3.4 ⚠️ Os links já disparados continuam funcionando?
Os links que o bot **já mandou** no WhatsApp apontam pro host do Railway. Enquanto o Railway responder no host antigo, eles seguem vivos. **Não desligue o host antigo** logo depois da migração — deixe os dois respondendo por um tempo.

---

## 4️⃣ Sessão **BETINNA** (backend / app)

### 4.1 Site → Betinna: **não muda**
O site manda lead e pedido via `MULLERBOT_WEBHOOK_URL` + `MULLERBOT_API_KEY`. É o site chamando o CRM; o domínio do site não entra nessa chamada.

### 4.2 Betinna → site: **muda**
Se o app chama o site de volta, a URL precisa ser atualizada. Rotas que o site expõe:

- `/api/webhooks/mullerbot`
- `/api/pedidos/status` (protegida por `PEDIDOS_STATUS_SECRET`)

➡️ Conferir se há URL do site configurada no app (variável, config de tenant ou hardcode) e trocar.

### 4.3 Rastreio no WhatsApp
O link de acompanhamento do pedido (`/pedido/<numero>`) sai do site por e-mail e pode sair do app por WhatsApp. Verificar de onde o app monta essa URL.

---

## 5️⃣ Sessões **BLOG / CMS**

O host aparece em arquivos versionados do `leo-Skills-master`:

- `clients/somatec/reports/blog/_conexoes-pendentes.md`
- `_sessions/criacao-blog-somatec/CONTEXT.md` ← **o CONTEXT da sessão**, então toda sessão de blog nova nasce com o host velho
- `_sessions/criacao-blog-somatec/CONTEXT.pre-autonomia.bak.md` (backup — decidir se atualiza)

⚠️ **A canônica dos artigos.** O CMS grava a canônica dos posts. Se ela guarda URL absoluta com o host do Railway, todo artigo publicado carrega o domínio velho. Conferir no MWP/Supabase antes de trocar.

---

## 6️⃣ Sessões **ADS / E-MAIL**

- **UTMs e links de anúncio** apontando pro host do Railway precisam ser reapontados. Anúncio ativo com URL velha continua funcionando enquanto o host responder — mas o relatório fica dividido entre dois domínios.
- **E-mail marketing**: links dos templates e domínio de envio.
- ⚠️ Com o site NOINDEX, **nada de ads que dependam de indexação**. Tráfego pago em página bloqueada por robots funciona, mas o Google Ads pode reclamar da landing.

---

## Ordem de execução

1. **Léo decide:** `www` ou apex · o que acontece com o site PHP antigo
2. **Infra:** custom domain no Railway → DNS → esperar SSL
3. **Infra:** Turnstile allowlist ⚠️ *antes* de mandar gente pro domínio novo
4. **Infra:** conferir SPF/DKIM do Resend depois de mexer no DNS
5. **Site:** trocar `NEXT_PUBLIC_SITE_URL` + fallbacks + revalidar cache
6. **Site:** conferir canonical, sitemap, robots (`Disallow: /` **tem de continuar**) e o 301 do apex
7. **Master:** prompts e nós de fluxo
8. **Betinna:** callbacks e link de rastreio
9. **Blog/Ads/E-mail:** CONTEXT, canônicas, UTMs
10. **Deixar os dois hosts vivos** por algumas semanas (links já disparados no WhatsApp)

---

## Teste de aceite

Depois de tudo, com o domínio novo:

- [ ] `/robots.txt` responde **`Disallow: /`** ← se mudou, alguém liberou o índice sem querer
- [ ] `canonical` e `og:url` com o domínio novo
- [ ] `sitemap.xml` com o domínio novo
- [ ] apex responde **301** pro `www`
- [ ] **formulário de `/contato` envia** ← prova o Turnstile
- [ ] **pedido de teste no checkout NI fecha** ← prova Turnstile + Betinna + Resend
- [ ] o e-mail de confirmação chega, e o link `/pedido/<numero>` abre no domínio novo
- [ ] o bot manda link com o domínio novo
- [ ] um link ANTIGO do WhatsApp ainda abre

---

## O que eu não consegui verificar daqui

Registrando pra ninguém tratar como conferido:

- **O DNS atual do domínio.** Não resolve da minha máquina; não confirmei o que ele serve hoje.
- **A allowlist do Turnstile** e a verificação do Resend — são painéis externos.
- **Os outros 10 prompts.** Confirmei o host só no C1-L; os demais estão na lista por serem candidatos, não por leitura.
- **Config do lado do Betinna** (callbacks) — outra sessão.
