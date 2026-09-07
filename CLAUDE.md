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
5. **no 12º mês abre a janela de saída**: 60 dias pra se manifestar. Encerrou, a Somatec **retira o
   equipamento sem custo**; não se manifestou, o contrato **segue pelo prazo contratado**

O argumento é a **janela de saída** — nunca "teste grátis", nunca "cancela quando quiser".

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

✅ **Continua verdadeiro:** estudo, projeto e proposta sem custo · cobrança 45 dias depois da NF ·
instalação contratada pelo cliente com empresa homologada · janela de 60 dias no 12º mês com retirada
sem custo · **medição como PROVA depois de instalado** (legítima, e é argumento que vende — não
apagar).

⚠️ **Guarda larga demais apaga argumento bom.** `medição` sozinha como padrão proibido reprova a
medição pós-instalação. O par certo é mecânica **+ exceção explícita**.

### Avise a master

Achou alguma coisa, **ou mexeu em texto que descreve o produto/a oferta** — `og`, `/llms.txt`, meta
incluídos: mandar pra sessão `/plano-somatec`, dona da copy. Texto dessas superfícies não passa pelos
mesmos olhos que a copy de página, e é onde uma frase errada rende mais estrago por caractere.

---

## Regras do site

- **NOINDEX até o go-live.** Não indexar sem OK do Léo.
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

## Acompanhamento

Board **DEV** no Betinna (via MCP `betinna-kanban`), etiqueta **Site**. Começou uma frente → mover o
card; entregou → marcar o item e comentar o resumo.
