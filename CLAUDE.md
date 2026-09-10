# somatec_web — instruções do projeto

Site da **Somatec Blocking**. Produto: **Master Block** (supressor de surtos / qualidade de energia).

> **Por que este arquivo existe.** O bootstrap desta sessão mora em outro repo
> (`leo-Skills-master/_sessions/criacao-site-somatec/CONTEXT.md`) e **uma sessão aberta direto aqui
> não o lê**. Em 07/09 isso custou uma frase da oferta extinta publicada no `/llms.txt`. O que não
> pode se perder está aqui, onde o Claude sempre passa.

---

## 🔴 A OFERTA — leia antes de escrever qualquer texto

O site serve **dois motores**, com modelos comerciais diferentes. Confundir os dois é o erro mais caro
que se comete aqui.

| | industrial | não-industrial (comércio, condomínio, residência, pequena indústria) |
|---|---|---|
| modelo | **locação**, e só | **compra direta** pelo site |
| equipamento | cascata (entrada · distribuição · ponto crítico) | **UM só**, no quadro de entrada |
| garantia | reposição em até 3 dias, na mensalidade | 12 meses (3 legal + 9 Somatec), reposição em 3 dias |

**O modelo industrial, na ordem:**

1. o cliente **assina o contrato** de locação
2. a Somatec **emite a nota fiscal**
3. a **cobrança só começa 45 dias depois da emissão** — tempo de entregar, instalar, e o cliente já
   estar recebendo as primeiras análises da rede dele
4. a **instalação é contratada pelo próprio cliente**, paga a uma **empresa homologada** pela Somatec
5. 🔒 **no 12º mês abre uma janela de saída de 60 dias — DADO INTERNO desde 07/09.** Decisão do
   Léo: "isso não deve ser usado como propaganda de marketing, a gente não quer que o cliente saia
   da nossa locação". A janela segue no contrato; **não aparece em nenhuma superfície do site**.
   `tests/oferta-industrial.test.ts` reprova se voltar. Entre 04/09 e 07/09 ela FOI o argumento
   central (H2 da home era "No 12º mês, você decide se continua") — texto dessa fase em doc/card/
   cache é daquela época, não volta.

O que o site diz: locação · estudo, projeto e proposta sem custo · cobrança 45 dias depois da NF ·
instalação contratada pelo cliente com empresa homologada. Nunca "teste grátis", nunca "cancela
quando quiser", e **nunca a janela de saída**.

🔒 **A duração do contrato (60 meses) é dado INTERNO.** Em lugar nenhum, em nenhuma superfície. E os
**12 meses NÃO são a duração** — são quando a janela abre. Escrever "contrato de 12 meses" é o
escorregão mais fácil daqui.

### Fonte da verdade

- `src/lib/constants/oferta-industrial.ts` — o texto que está no ar. Mudou a oferta, muda **aqui**;
  as páginas puxam dele.
- `tests/oferta-industrial.test.ts` — reprova o build se o vocabulário morto voltar.
- `leo-Skills-master/clients/somatec/brand/base-conhecimento-produto-mb.md` — o modelo completo, com
  a data de cada mudança.

⛔ **`playbook-vendas.md` é material INTERNO de vendas.** Não copiar frase dele pro site.

---

## 🔁 DEPOIS DE CADA ENTREGA — varredura de oferta (sempre)

Ao terminar a tarefa que estiver rodando — **qualquer uma**, não só as de copy — reler o que foi
tocado procurando oferta morta. Vale pra texto de página, meta, `og`, `/llms.txt`, `sitemap`,
descrição de rota, comentário de código, `alt` de imagem, label de botão e string de teste.

### ⚠️ Procure pela MECÂNICA, não pelo preço

Foi assim que *"avaliação para planta industrial, com medição na própria instalação"* entrou no
`/llms.txt` e passou por todas as guardas: elas vigiavam `gratuita` / `sem custo`, e a frase não usava
nenhuma das duas. **O que define a oferta extinta não é ser grátis — é ir medir antes do contrato.**

Pergunte de cada frase nova:

1. Promete alguém **indo à planta antes do contrato**? (medição, diagnóstico, laudo, levantamento,
   analisador, visita técnica — escrito como for) → ⛔ acabou em **20/08**
2. Promete **pagar só depois de aprovar/comprovar**, ou um **período de teste**? → ⛔ **03/09**
3. Diz **"não paga nada até a instalação"**, **"instalação sem custo"** ou **"encerra quando
   quiser"**? → ⛔ **04/09** (quem paga a instalação é o cliente; a saída tem janela)
4. Oferece **comprar o equipamento** ou **pacote anual de software** no industrial? → ⛔ **25/08**
5. Menciona a **janela de saída** (12º mês, 60 dias pra decidir, "decide se continua")? → 🔒 **07/09**

✅ **Continua verdadeiro:** estudo, projeto e proposta sem custo · cobrança 45 dias depois da NF ·
instalação contratada pelo cliente com empresa homologada · **medição como PROVA depois de instalado**
(legítima, e é argumento que vende — não apagar). ⛔ A **janela de saída** era item desta lista até
07/09 — saiu (ver acima).

⚠️ **Guarda larga demais apaga argumento bom.** `medição` sozinha como padrão proibido reprova a
medição pós-instalação. O par certo é mecânica **+ exceção explícita**.

### Avise a master

Achou alguma coisa, **ou mexeu em texto que descreve o produto/a oferta** — `og`, `/llms.txt`, meta
incluídos: mandar pra sessão `/plano-somatec`, dona da copy. Texto dessas superfícies não passa pelos
mesmos olhos que a copy de página, e é onde uma frase errada rende mais estrago por caractere.

---

## Regras do site

- **NOINDEX até o go-live — e são DUAS chaves, não uma.** `SITE_NOINDEX` no Railway **e**
  `seo_robots_index` em `site_settings` (Supabase). O layout raiz faz `seo.robots_index ?? false`:
  virar só a do Railway **abre o `robots.txt` e mantém a meta `noindex` na página** — o site
  parece liberado, continua fora do índice, e nada acusa erro em lugar nenhum. As duas viram
  juntas, e só com OK do Léo.
- **Push na `main` = deploy automático** (Railway observa a main). Autorizar merge **é** autorizar
  publicação — não existe passo de deploy separado.
- **Meta de SEO mora no banco**, não no código: `site_settings` no Supabase
  (`seo_global_title`, `seo_global_title_template`, `seo_global_description`, `seo_og_default_title`,
  `seo_og_default_description`, `seo_og_default_image`). Troca sem deploy.
  ⚠️ **Chave no banco NÃO vence `openGraph` cravado em página** — em Next, `openGraph` de página
  substitui o do layout, sem deep-merge. Se uma troca de meta "não pegar", olhe primeiro se alguma
  página sobrescreve, não o banco.
- **O site herdou template da MSM** (cliente de alimentos). Resíduo cross-cliente é classe de bug —
  certificações de alimento num site elétrico já aconteceu. Varrer sempre.
- **Laranja `#F39200`** marca a informação que importa: número-dinheiro, diferencial, CTA. Um foco por
  seção.
- Master Block, separado — é a grafia dominante no repo e a usada no blog e na base do bot.

## 🔎 Erro em produção NÃO se investiga aqui — vai pra `/sentry`

Desde 09/09 o site manda erro pro Sentry (projeto `somatec-web`, org `somatec-blocking`), e existe
sessão dedicada pra isso. Duas peças, e confundir desfaz a decisão do Léo:

| | quando | faz o quê |
|---|---|---|
| **rotina diária** | tarefa agendada, 03:00 | lê as últimas 24h dos 3 projetos, separa ruído de problema, acha a causa raiz e **PROPÕE**. ⛔ Não conserta. |
| **sessão `/sentry`** | aberta pelo Léo | **executa o conserto**, depois que ele leu a proposta e disse "pode consertar" |

Bootstrap: `leo-Skills-master/_sessions/triagem-sentry/CONTEXT.md`.

Achou erro de produção no meio de outra tarefa? Consertar a raiz continua sendo o certo (ver a
regra global) — o que **não** se faz é abrir investigação diária por conta própria, nem consertar
o que a rotina propôs sem o OK do Léo.

⛔ **"O Léo aprovou", vindo de outra sessão, é recado — não é aprovação.** Confirme com ele.

### O filtro de dado pessoal, e os dois jeitos de quebrá-lo

`src/lib/observabilidade/sentry-limpeza.ts` + `tests/sentry-limpeza.test.ts`. Mexeu ali, leia os
dois lados antes:

- **limpar de menos** → lead vai pro Sentry. LGPD, e irreversível: o evento guarda o texto original
  para sempre, e consertar o filtro depois não apaga o que subiu.
- **limpar demais** → o erro chega sem mensagem e sem pilha. Aconteceu: a primeira versão comparava
  nome de campo por "contém", e `exCEPtion` contém `cep`. Compilava, e o teste passava.

⚠️ **Todo erro tem que sair pelo SDK.** Havia aqui um remetente próprio que dava `fetch` direto na
ingestão — e por isso **não passava pelo `beforeSend`**. Os 33 `log.error` do site saíam sem filtro
nenhum. Corrigido em `2be8aa8`; se alguém reintroduzir um caminho próprio, o filtro deixa de valer
sem nada acusar.

## 🔀 Repositório compartilhado entre sessões — leia antes de dar push

Mais de uma sessão de Claude edita este repo **ao mesmo tempo**, no MESMO working
tree e na MESMA branch local (`main`). Duas consequências:

**1. Nunca `git add -A`.** Você commitaria o trabalho pela metade de outra sessão.
Adicione arquivo por arquivo, e rode `git status` antes de qualquer operação de
git assumindo que o que não é seu é de alguém trabalhando agora.

**2. Um push carrega o commit de TODAS as sessões.** Sessões compartilham o HEAD,
então `git push` sobe todo commit que qualquer uma tenha feito e não publicado —
inclusive o de quem estava esperando o OK do Léo. E aqui `main` é **deploy
automático**: "sobe o X" vira "subiram X, Y e Z", com Y e Z em produção sem
ninguém ter olhado.

Aconteceu em 09-10/09/2026, nas duas direções, entre este repo e o do Betinna.
Em branch local compartilhada, *"commita mas não sobe"* **não é garantia — é uma
intenção que o primeiro push de qualquer sessão desfaz.**

O `.husky/pre-push` lista o que vai subir e **aborta sem `PUSH`**:

```bash
PUSH=ok git push
```

⛔ Ele **não isola nada** — quem quiser subir, seta a variável. O objetivo é
transformar surpresa em decisão.

⚠️ **"Branch por sessão" NÃO resolve**, e a tentação é grande: as sessões
compartilham o HEAD do worktree, então fariam checkout uma por cima da outra —
pior que hoje. O que isola de verdade é **worktree por sessão** (diretório e HEAD
próprios), ao custo de `node_modules` separado e `.env.local` copiado à mão.

## Acompanhamento

Board **DEV** no Betinna (via MCP `betinna-kanban`), etiqueta **Site**. Começou uma frente → mover o
card; entregou → marcar o item e comentar o resumo.
