# Diagnóstico Visual e de Experiência — MSM Site

> Auditoria contra a régua "Direção criativa premium" (Adendo v1.1 §20).
> Zero código tocado. Apenas observação + propostas.
> Documento gerado em 2026-05-21.

---

## 📊 1. Visão geral e veredito

**Nota média ponderada: 7.7 / 10** contra o padrão da §20.

O site MSM tem **base premium real**: tipografia editorial pixel-perfect (Inter + Fraunces nas escalas certas), dark mode dedicado (não inversão), paleta tokenizada via CSS vars, gradient ouro nos CTAs primários, espaçamento generoso (96–128px entre seções), ícones 100% Lucide sem escapes cartoon, e acessibilidade base sólida (skip-link, focus ring dourado, `lang="pt-BR"`, aria-labels nos ícones isolados).

**Lado a lado com Nestlé / Unilever / BRF / Mondelez globais hoje:** passaria como **"premium emergente brasileiro"**, não como "enterprise flagship". A arquitetura está pronta — o que falta são 3 coisas que separam o tier 1 do tier 2:

1. **Skeletons + estados vazios ilustrados** (hoje só spinner e texto — Stripe/Linear nivelam tudo com shimmer)
2. **Mídia editorial real** (fotografia industrial, packshots profissionais — hoje quase tudo é placeholder picsum/texto)
3. **Profundidade institucional** (Nestlé tem timeline, ESG, P&D, fábricas com tour virtual — MSM tem 1 página "Estrutura industrial" com texto)

**Resumo:** **subir de 7.7 pra 9+ é caminho de detalhe** (não de refundação). O que está bom está MUITO bom; o que falta é claramente identificável.

---

## 🏠 2. Análise página por página

### ROTA: `/` (home)

**Estado:** 7 · **Síntese:** Tipografia e tokens premium, mas hero quebra em mobile, indicadores subdimensionados no mobile e CTA secundário sem gradient.

**Premium (manter):**
- Inter + Fraunces no tailwind config ✓
- H1 desktop 72px / mobile 40px com lh 1.05 + tracking -0.02em
- Eyebrow dourado uppercase tracking 0.06em
- Carrossel com barra progressiva segmentada dourada (não dots — atende §20.5)
- Indicador de scroll discreto no hero (gradient fade)
- Dark mode dedicado com CSS vars

**Abaixo do padrão (ajustar):**
- §20.1: Indicadores no mobile estão em **48px**, abaixo do mínimo §20.1 (64–80px). Tailwind `indicator-m: 3rem` (= 48px) deveria ser 4rem.
- §20.4: Hero usa `min-h-screen` + `pt-20` fixo — em mobile <720px renderiza altura inconsistente. Spec pede 100vh em ≥720px e ajuste responsivo.
- §20.5: Setas do carrossel têm `opacity 0.4→1` no hover ✓ mas falta `group-hover:scale` (spec menciona escala sutil).
- §20.2: `btn-outline-light` (CTA secundário do hero) é branco/translúcido plano — funciona, mas perderia destaque se viesse a ser borda dourada gradiente.
- §20.14: Sem scroll-triggered fade-in nas seções abaixo do hero (HomeManifesto, HomeBrands, HomeCta entram instantâneas).

**Oportunidades de adição:**
- Adicionar `useInView` hook nas seções principais → `animate-fade-up` com stagger 50-80ms ao entrar viewport.
- Hero: scroll progress indicator (barrinha dourada lateral) na lateral direita pra mostrar profundidade.
- Após o carrossel, considerar uma "linha do tempo" horizontal animada com marcos institucionais.

---

### ROTA: `/a-msm` + `/quem-somos`, `/estrutura-industrial`, `/qualidade-e-seguranca`

**Estado:** 8 · **Síntese:** Bons cards de navegação + conteúdo editorial real, mas as 3 sub-páginas são puro texto sem mídia.

**Premium (manter):**
- PageHero com eyebrow dourado + título serif + breadcrumb
- 4 cards com border 1px, hover gold + translateY -2px + shadow premium
- Ícones Lucide stroke 1.5 32px
- Espaçamento §20.7 (`space-y-20 md:space-y-28`)

**Abaixo do padrão (ajustar):**
- §20.7 H3 nos cards: sem tamanho explícito (só `font-semibold`); spec pede 20–22px 600. Hoje aparece em ~18px.
- Gap entre ícone e texto: `gap-5` (20px). Spec premium: 24–32px.
- Sub-páginas são 100% texto + 4 cards genéricos — sem fotografia industrial, sem números editoriais, sem destaque visual entre parágrafos.

**Oportunidades de adição:**
- `/a-msm/quem-somos`: timeline horizontal com marcos da empresa (mesmo sem datas reais, fica preparada).
- `/a-msm/estrutura-industrial`: galeria de fábrica + tour 360° / vídeo institucional secundário.
- `/a-msm/qualidade-e-seguranca`: badges visuais das certificações (FSSC 22000, BRCGS, ISO 9001, Halal) em vez de pills de texto.
- Adicionar seção "Compromissos ESG" e/ou "Inovação e P&D" como sub-páginas separadas dentro de `/a-msm/`.

---

### ROTA: `/marcas` + `/marcas/[slug]`

**Estado:** 7 + 8 · **Síntese:** Listing premium com grayscale→cor no hover, mas falta shadow no hover dos cards e detalhe da marca podia ter manifesto/portfólio editorial mais denso.

**Premium (manter):**
- §20.8: Grid 3 cols + grayscale(1) opacity(0.65) → color + scale(1.03) em 300ms ✓
- Border dourada no hover, cards em padding 32px
- CommercialCta com contexto `Marca X` enriquece a mensagem WhatsApp
- Schema.org Brand schema no detalhe

**Abaixo do padrão (ajustar):**
- §20.8: cards na listagem não declaram `hover:shadow-premium-light` — falta elevação visual.
- §20.6: Listagem sem números editoriais (anos de marca, presença em estados, SKUs).
- Detalhe `/marcas/[slug]`: descrição "full_description" exibida como bloco de texto plano. Sem manifesto da marca, sem palette visual, sem moodboard.

**Oportunidades de adição:**
- Página de marca com **manifesto editorial** (eyebrow + headline serif + 2-3 parágrafos com fotografia).
- Seção "Portfólio da marca" (subgrid de produtos exclusivos).
- Seção "Receitas com {brand}" (puxa de recipe_products).
- Filtro/busca no /marcas (mesmo que só 3 marcas, prepara escala).

---

### ROTA: `/produtos` + sub-rotas

**Estado:** Listagem 8 · `/produtos/[slug]` 9 · filtros categoria/aplicação/marca 6

**Premium (manter):**
- Grid responsivo 1/2/3/4 cols com aspect-square consistente
- Cards border + hover gold + shadow + translateY
- Filtros pills com hover dourado
- Detalhe completo: imagem 1:1, packaging options, ficha técnica button, CommercialCta com context produto, Schema.org Product+Brand

**Abaixo do padrão (ajustar):**
- §20.9: Cards na listagem **sem eyebrow marca** (nome da marca em pequeno acima do título). Hoje só nome + chevron.
- §20.9: Aspect ratio cards é `aspect-square` mas spec pede **4:5** (mais editorial, packshot premium).
- §20.9: Falta "SKU/peso" como meta info no card.
- Filtros `/categoria`, `/aplicacao`, `/marca`: páginas existem mas estrutura espelha demais o `/produtos` — perdem oportunidade de header contextual (ex: descrição da categoria, número de produtos, banner editorial).

**Oportunidades de adição:**
- Cards de produto com eyebrow marca dourado (já temos a relação no DB).
- Botão "Solicitar amostra" como modal no detail (diferente do WhatsApp CTA).
- Download de ficha técnica em PDF.
- Cards comparativos no detail "Outros produtos desta marca / categoria".

---

### ROTA: `/solucoes` (hub) + 6 sub-rotas

**Estado médio:** 8.0 · **Síntese:** Conteúdo editorial denso e bem escrito, padrão visual consistente, mas card de benefícios com ícones subdimensionados (28px vs 32px do spec) e H3 sem escala explícita.

**Premium (manter):**
- §20.7: Cards border 1px, padding 32px, radius 8px, hover gold + translateY + shadow
- Eyebrow dourado em cada seção
- H2 serif com text-balance
- `/terceirizacao`: steps numerados em serif `text-[2.5rem]` dourado — **elemento premium claro** que destaca esta página
- Espaçamento `space-y-20 md:space-y-28` (80–112px)

**Abaixo do padrão (ajustar — comum às 6):**
- §20.7: Ícones em `h-7 w-7` (28px), spec pede **32px** (`h-8 w-8`). Sistemático em todas as 6.
- §20.7: H3 nos cards sem tamanho explícito — só `font-semibold`. Render em ~18px; spec pede 20–22px.
- §20.5: `gap-5` (20px) entre ícone e texto é apertado. Spec: 24–32px.
- `/terceirizacao` step cards: sem hover state (border-gold + translateY); ficam estáticos enquanto os benefits cards têm hover.

**Oportunidades de adição:**
- **FAQ por segmento** abaixo dos cards (acordeon estilo §1.1 type accordion já no schema de pages).
- **Cases de sucesso anonimizados** (cards com setor + resultado, sem nome cliente).
- **Comparativo "Por que MSM"** em formato editorial (tabela vs concorrência genérica).
- Vídeo curto institucional (30s) por solução.
- Calculadora "Quanto eu compro?" para food-service (input volume mensal → estimativa de embalagens).

---

### ROTA: `/receitas` + `/receitas/[slug]`

**Estado:** 7 + 8 · **Síntese:** Estrutura ok mas hover dos cards é fraco (scale 1.02 vs 1.04 do spec) e falta o gradient overlay editorial.

**Premium (manter):**
- Cards aspect 4:3 (atende §20.10)
- Categoria chips superiores com border + hover gold
- Clock icon + tempo no card
- Recipe schema completo (HowToStep × N, recipeIngredient[], prepTime ISO)

**Abaixo do padrão (ajustar):**
- §20.10: `group-hover:scale-[1.02]` — spec pede **1.04**.
- §20.10: **Sem gradient overlay** no bottom da imagem no hover (`linear-gradient(180deg, transparent 0%, rgba navy 60%)`). Faz falta editorial.
- §20.10: Eyebrow "Ver receita" tá em `text-xs tracking-widest gold` ✓ mas não é eyebrow de **categoria** (sugestão: "Pratos principais", "Massas e pizzas").

**Oportunidades de adição:**
- Botão "Imprimir receita" (com CSS print-only otimizado).
- Botão "Salvar PDF" da receita.
- Seção "Você vai precisar destes produtos MSM" no detail (já temos a relação recipe_products).
- Filtro por tempo de preparo / dificuldade no listing.

---

### ROTA: `/contato`

**Estado:** 8.5 · **Síntese:** Layout magazine premium com hero compacto + sidebar editorial, mas H1 usa size H2 (semântica confusa) e falta FAQ.

**Premium (manter):**
- Hero compacto dark com diagonal pattern
- Eyebrow dourado "Comercial"
- Sidebar sticky (layout magazine)
- Form card com border + bg-surface
- Mail icon dourado

**Abaixo do padrão (ajustar):**
- §20.1: H1 "Fale com a MSM" usa classe `text-h2-m md:text-h1-d` — em mobile renderiza tamanho H2. Confunde semântica e visual.
- Sem FAQ ou estrutura "outros canais" — usuário decidido pra falar com vendas é fluxo único.

**Oportunidades de adição:**
- FAQ por segmento abaixo do form (acordeon).
- "Outros canais": LinkedIn corporativo, e-mail direto, telefone — em cards visuais.
- Newsletter signup em sidebar bottom.

---

### ROTA: `/representantes`

**Estado:** 8 · **Síntese:** Estrutura espelha `/contato` mas com proporção grid assimétrica (5:7 vs 4:8 do contato).

**Premium (manter):**
- Hero compacto + sidebar editorial
- Bullets com dot dourado (formato editorial)
- Users icon dourado

**Abaixo do padrão (ajustar):**
- Inconsistência de grid: `/contato` é 4:8, aqui é 5:7. Padronizar.
- Mesma ambiguidade H1/H2 do `/contato`.

**Oportunidades de adição:**
- Mapa do Brasil mostrando regiões com representantes (mesmo que pinte tudo "em expansão").
- "Benefícios de ser representante MSM" em cards (materiais, comissão, suporte).
- Depoimentos de representantes atuais (quando o cliente tiver).

---

### ROTA: `/blog` (placeholder)

**Estado:** 6 · **Síntese:** Placeholder funcional mas sem call-to-action alternativo.

**Abaixo do padrão (ajustar):**
- PlaceholderPage renderiza com copy "Em breve" — discreto, não viola §20.11 ("sem selo EM BREVE! grande") mas é meio inerte.

**Oportunidades de adição:**
- Newsletter signup no placeholder ("Avise quando lançar").
- Link pros canais sociais como interim.
- Quando o blog for live: filter por categoria, search bar, featured posts, "tempo de leitura" + data.

---

### ROTAS: `/politica-de-privacidade`, `/termos-de-uso`, `/cookies`

**Estado:** 7.5 · **Síntese:** Conteúdo jurídico completo e real, mas hierarquia tipográfica confusa (H2 em serif tamanho H3).

**Abaixo do padrão (ajustar):**
- §20.1: H2 nas seções legais renderiza `text-h3-m` (= H3 size) e `font-serif`. Spec pede H2 **sans** 36–44 / 28–32. Inverte papel serif/sans.
- §20.7: `space-y-12` (48px) entre seções — abaixo do premium 96–128px.

**Oportunidades de adição:**
- Sumário sticky lateral (anchor links pras 9 seções da LGPD) tipo Stripe Privacy.
- Callout boxes editoriais para pontos críticos (LGPD direitos do titular, contato do DPO).
- Versioning visual ("v1.0, atualizado em maio/2025") com toggle pra ver diff.

---

### ROTAS: 404 + Error

**Estado:** 8 + 8 · **Síntese:** Estrutura editorial básica correta mas sem hero visual diferenciado nem ilustração.

**Premium (manter):**
- Eyebrow "Erro 404" / "Erro inesperado"
- H1 serif `text-h1-m md:text-h1-d`
- CTA primary gold gradient com ArrowLeft

**Abaixo do padrão (ajustar):**
- §20.15: spec pede **dedicados** com serif grande **+ ilustração**. Atual: só texto sobre body default. Sem hero dark com pattern (como `/contato` tem).
- 3 botões alternativos seria melhor que 1 ("Home", "Contato", "Voltar").

**Oportunidades de adição:**
- Hero dark (deep_navy + pattern diagonal) na página de erro.
- Ilustração SVG linear premium (404: documento rasgado; 500: engrenagem).
- Código de erro como watermark grande de background ("404" em fonte serif 400px opacity 0.04).

---

## 🧩 3. Análise de componentes globais

### Header (8.5)

**Premium:** Transição transparente → backdrop-blur(12px) + opaque ao scroll 80px (200ms) · Mega-menu 3×2 com hover gold · ThemeToggle morfismo sol↔lua animado · Mobile drawer lateral direita · CTAs diferenciados (outline + gold gradient).

**Ajustar:**
- §20.3: **Mega-menu Soluções renderiza sem ícones** (só label + description). Spec pede "ícone + título + short_description" — falta o componente visual Lucide ao lado de cada card do mega-menu.
- "Fale com o Comercial": tem ChevronRight com classe `group-hover:translate-x-0.5` mas o `<Link>` não tem `group` wrapper — o chevron **fica imóvel** no hover.
- Logo "MSM" sem hover transition de cor.

**Oportunidades:** Submenu "A MSM" com mini-description em cada item · Badge "Novo" em itens recentes.

### Footer (9)

**Premium:** Layout 12-col bem proporcionado · Brand column com logo serif + descrição + redes Lucide com hover gold · Divisor gradient fade · Copyright opacity 0.6 · Hover suave 200ms.

**Ajustar:**
- §20.13: **Certificações renderizam como TEXTO** (`text-white/60`), spec pede **grid de imagens monocromáticas** (grayscale viram coloridas no hover). Quebra credibilidade institucional.
- Endereço da empresa não aparece (spec menciona). Hoje só descrição + redes.

**Oportunidades:** Endereço configurável via site_settings · Newsletter signup discreto na brand column.

### CookieBanner (9.2)

**Premium:** Posição fixed bottom, deep_navy/95 + backdrop-blur sutil · Dynamic SSR=false (evita flash) · Texto editável via admin · Buttons responsivos (outline + primary) · Link "Cookie" icon premium.

**Ajustar:** Sem animação de entrada (slide-up + fade 300ms recomendado).

**Oportunidades:** "Gerenciar preferências" expandível com checkboxes (Analytics, Marketing).

### WhatsAppButton (8.5)

**Premium:** FAB discreto #25D366 · SVG inline (CSP-safe) · Hover scale-105 + shadow · Focus ring com cor da marca.

**Ajustar:** Sem pulse/badge de atenção · Renderiza sempre se `href` válido (mesmo se admin desabilitou — fallback vai pra `/contato`, mas botão verde fica fora de contexto).

**Oportunidades:** Pulse animation sutil (1 → 1.05 → 1 em 3s) · Badge "Chat" pequeno.

### CommercialCta (7.5)

**Premium:** Server async com fetch da config · Contexto enriquecedor da mensagem WhatsApp · Variantes primary/secondary · External links via target=_blank.

**Ajustar:** ArrowRight **não anima** no hover (sem `group` wrapper) · Variant secondary não está visualmente diferenciada o suficiente.

**Oportunidades:** Group-hover animate arrow translateX · Variante com loading state.

### Formulários (8)

**Premium:** Variantes por interest_type (6) · Validação Zod realtime · Turnstile invisible · Honeypot · FormStatus com ícones · Mensagens customizáveis via site_settings.

**Ajustar:**
- §20.15: Loading state usa **spinner genérico** (Loader2 spin) — spec pede **skeleton shimmer**.
- Mensagem de sucesso menciona só WhatsApp (não menciona e-mail como alternativa).
- Sem validação visual inline (campos só mostram erro pós-submit).

**Oportunidades:** Skeleton shimmer nos campos durante submit · Success animation sutil (pulse antes de "enviar outra") · Preview de dados antes de final submit.

### Loading global (4.5)

**Crítico:** `src/app/loading.tsx` usa spinner border genérico — **viola §20.15** ("Skeletons com shimmer, NÃO usar spinner genérico"). Tailwind já tem `animate-shimmer` keyframe definida mas ninguém usa.

### Empty States (3)

**Crítico:** `AdminTable.tsx` retorna texto plano "Nenhum registro encontrado". Sem ícone, sem ilustração. §20.15 explicitamente pede "Empty desenhados com ilustração linear".

### Skeletons (1)

**Crítico:** **Não existem.** Grep por `Skeleton|shimmer|animate-pulse` retorna vazio em componentes (só na tailwind.config). Spec premium quebrada em todos os listings.

### 404/500 (8)

Já coberto na análise de páginas — falta ilustração e hero dark.

### PublicOnly (10) e ThemeToggle (9)

**Ambos premium-ready.** Nada a ajustar.

---

## ⚙️ 4. Análise de sistemas transversais

### 3.1 Tipografia (9) — Premium

Inter + Fraunces corretos via `next/font` com `display: swap`. Tailwind `font-sans` → Inter, `font-serif` → Fraunces. Escala completa: h1-d 4.5rem (72px), h1-m 2.5rem (40px), h2-d 2.75rem, eyebrow, **indicator-d 5rem (80px)** ✓ todos batem com §20.1. PageHero, HomeHero, HomeIndicators, SectionHeading: todos aplicam corretamente.

**Único gap:** `indicator-m: 3rem` (48px) está abaixo do mínimo §20.1 (64–80px).

### 3.2 Cores (8.5)

Tokens dedicados light/dark em CSS vars (`:root` vs `.dark`). Gradiente ouro 135deg em `.btn-primary` ✓. Shadows premium customizados (não Tailwind `shadow-xl/2xl`). Sem inversão automática.

**Gap:** Contraste WCAG AA não auditado formalmente — `text-muted` sobre `surface` em dark mode tem ratio ~4.2:1, está na margem.

### 3.3 Movimento (7.5)

CSS-first (sem framer-motion). `prefers-reduced-motion` respeitado. Hover padrão `translateY -1px + shadow + 200ms ease-premium` ✓. Cards: `translateY -2px` ✓. Cubic-bezier `(0.22, 1, 0.36, 1)` ✓.

**Gap:** **Sem IntersectionObserver para fade-in ao scroll** — seções entram instantâneas. Spec §20.14 pede `opacity 0→1 + translateY 16px→0 600ms ease-out stagger 50-80ms`.

### 3.4 Espaçamento (8)

`container-msm` max-width 1400px ✓ · py 20/28 (80–112px) entre seções premium · grids gap 6/8/10 ✓.

**Único gap:** HomeBlogTeaser usa `py-8 md:py-12` (88px), abaixo do mínimo 96px.

### 3.5 Ícones (9) — Premium

100% lucide-react · stroke 1.5 nos ícones de solução · zero emoji ou cartoon detectado · nenhum ícone colorido escapando.

### 3.6 Imagens (7)

Estratégia clara: Supabase Storage com fallback de texto. Aspect ratios consistentes (4:5 produtos, 4:3 receitas). Hover scale + overlay implementados em receitas.

**Gap:** Sem placeholder shimmer durante load. Hero fallback `alt=""` (decorativo, ok mas sem documentação).

### 3.7 Acessibilidade (8)

Skip-link em layout ✓ · `lang="pt-BR"` ✓ · Focus ring dourado 2px ✓ · Aria-labels em ícones isolados ✓ · Mobile drawer com close button labeled.

**Gap:** Certificações pills (`HomeIndicators`) usam só `title` sem `aria-label` · Nenhuma auditoria Axe/Lighthouse no CI.

---

## ✨ 5. Propostas de adição (criar do zero)

### Páginas/seções institucionais (reforçam "indústria gigante")

1. **Timeline da MSM** em `/a-msm/quem-somos` — formato editorial horizontal com marcos. **G** · depende de conteúdo do cliente (datas, eventos)
2. **Tour virtual da fábrica** em `/a-msm/estrutura-industrial` — galeria fotográfica + opcional vídeo 360°. **M** · depende de fotografia profissional
3. **Página `/a-msm/sustentabilidade` (ESG)** — pilares ambiental/social/governança. **M** · depende de conteúdo do cliente
4. **Página `/a-msm/inovacao-p-e-d`** — laboratório, pipeline de novos produtos. **M** · depende de conteúdo
5. **Página `/a-msm/imprensa`** — releases, MSM nas notícias, kit de mídia para download. **M** · depende de assets
6. **Página `/trabalhe-conosco`** — vagas + benefícios + cultura. **G** · depende de cliente

### Mídia editorial (eleva profundidade visual)

7. **Galeria de fotografia industrial** dedicada (pode ser modal de lightbox em várias páginas) — **M**
8. **Vídeo institucional secundário** em cada solução (30s descrevendo o serviço) — **G** · depende de produção
9. **Packshots profissionais** em todos os produtos — **G** · depende de fotografia
10. **Logos reais de certificações** (FSSC, BRCGS, ISO, Halal) em SVG monocromático — **P** · depende de assets oficiais

### Conteúdo editorial dentro do existente

11. **FAQ por segmento** (food service, B2B, terceirização) em accordion abaixo dos cards — **M** · pode usar conteúdo placeholder
12. **Cases anonimizados** ("Indústria de pizzas em SP reduziu desperdício 18%") — **M** · depende de cliente
13. **Comparativo "Por que MSM"** em formato editorial (tabela vs concorrência genérica) — **M**
14. **Depoimentos B2B** em formato editorial (não cards) — **M** · depende de cliente
15. **Manifesto da marca** em `/marcas/[slug]` (texto editorial + moodboard) — **M** · depende de cliente

### Conversão e captação

16. **Modal "Solicitar amostra"** em produtos — **M**
17. **Modal "Solicitar cotação"** em soluções — **M**
18. **Newsletter signup** discreto em footer + blog placeholder + sidebar contato — **P**
19. **Catálogo PDF** download em `/produtos` (gerado server-side ou estático) — **G** · depende de design
20. **Calculadora "Quanto eu compro?"** em food-service (input volume → estimativa SKUs) — **M**

### Interatividade institucional

21. **Mapa interativo do Brasil** em `/representantes` com regiões — **M**
22. **"Números MSM"** em página dedicada (não só home) — **P** · depende de cliente confirmar números
23. **Comparador de produtos** lado-a-lado — **M**
24. **Linha "Receitas com {brand}"** em página de marca — **P** (relação já existe via recipe_products)

### Polimento operacional

25. **Skeleton shimmer** reutilizável (atende §20.15) — **P**
26. **EmptyState** ilustrado reutilizável — **P**
27. **404 e 500 redesenhadas** com hero dark + ilustração SVG — **M**
28. **Scroll-triggered animations** (useInView + fade-up + stagger) — **M**

---

## 🎯 6. Top 10 prioridades sugeridas

> Ranking otimizando **impacto premium / esforço**.

| # | Nome | Tipo | Impacto | Esforço | Justificativa |
|---|---|---|---|---|---|
| 1 | **Skeleton + EmptyState reutilizáveis** | Adição | Alto | P | Atende §20.15 (hoje zero), eleva todos os listings de uma vez |
| 2 | **Mega-menu Soluções com ícones Lucide** | Ajuste | Alto | P | §20.3 explícito; é a primeira coisa que cliente B2B vê |
| 3 | **Certificações no footer como grid monocromático real** | Adição | Alto | P | §20.13; credibilidade de indústria alimentícia |
| 4 | **Scroll-triggered fade-up em todas as seções da home** | Ajuste | Alto | M | §20.14; entrega "ar de produto premium" sem custo de conteúdo |
| 5 | **Cards de produto com eyebrow marca + aspect 4:5** | Ajuste | Alto | P | §20.9; bate exatamente o que Nestlé/Mondelez fazem |
| 6 | **Hover correto em recipe cards (scale 1.04 + gradient overlay)** | Ajuste | Médio | P | §20.10; corrige micro-interação visível |
| 7 | **404 e 500 redesenhadas com hero dark + ilustração SVG** | Adição | Médio | M | §20.15; primeira impressão de polimento |
| 8 | **Tamanho de ícones soluções 28→32px + H3 explícito 20-22px** | Ajuste | Médio | P | §20.5/§20.7; sweep em 6 páginas de solução |
| 9 | **Modal "Solicitar amostra"** em produto detail | Adição | Médio | M | Diferencia do CTA WhatsApp genérico, traz fluxo B2B clássico |
| 10 | **FAQ por segmento** em accordion abaixo dos cards de soluções | Adição | Médio | M | Aprofunda autoridade institucional sem precisar de cliente |

**Resumo de esforço:** 5 P (~5h totais) + 4 M (~12h) + 0 G = **dia e meio de dev** para subir nota de 7.7 → ~8.7.

---

## 🚫 7. O que NÃO recomendo mexer

Esses estão sólidos — risco alto de piorar mexendo:

1. **Tipografia hierárquica e tokens de cor** — Inter + Fraunces + escala + paleta dark/light estão pixel-perfect contra §20.1/§20.2. Mexer aqui é refundação que não precisa.
2. **PublicOnly wrapper + ThemeToggle** — Notas 10 e 9. Implementação prêmio com a11y completa, animação morfismo, hydration segura. Não tocar.
3. **CookieBanner (9.2)** — Sutil, dynamic SSR, body editável. A única melhoria seria animação de entrada — opcional.
4. **Footer (9)** — Estrutura, layout 12-col, hover, divisor gradient: tudo bom. **Mexer só nas certificações** (que estão como texto) — o resto manter.
5. **Páginas de soluções (notas 8 a 8.5)** — Conteúdo editorial real e bem escrito, espaçamento premium, design consistente. Mexer só nos detalhes (ícone 28→32, H3 size, gap card) — não reescrever.

---

## 📈 Apêndice — Tabela de notas por área

| Área | Componente / rota | Nota | Status |
|---|---|---|---|
| Página | `/` (home) | 7 | ⚠️ |
| Página | `/a-msm` + 3 sub | 8 | ✓ |
| Página | `/marcas` | 7 | ⚠️ |
| Página | `/marcas/[slug]` | 8 | ✓ |
| Página | `/produtos` | 8 | ✓ |
| Página | `/produtos/[slug]` | 9 | ✓✓ |
| Página | filtros categoria/aplicação/marca | 6 | ⚠️ |
| Página | `/solucoes` hub | 8.5 | ✓ |
| Página | food-service / b2b | 8 | ✓ |
| Página | terceirização | 8.5 | ✓ |
| Página | envase | 7.5 | ⚠️ |
| Página | marcas-próprias | 8 | ✓ |
| Página | distribuição | 8 | ✓ |
| Página | `/receitas` | 7 | ⚠️ |
| Página | `/receitas/[slug]` | 8 | ✓ |
| Página | `/contato` | 8.5 | ✓ |
| Página | `/representantes` | 8 | ✓ |
| Página | `/blog` placeholder | 6 | ⚠️ |
| Página | legais (3) | 7.5 | ⚠️ |
| Página | 404 / error | 8 | ✓ |
| Global | Header | 8.5 | ✓ |
| Global | Footer | 9 | ✓✓ |
| Global | CookieBanner | 9.2 | ✓✓ |
| Global | WhatsAppButton | 8.5 | ✓ |
| Global | PublicOnly wrapper | 10 | ✓✓ |
| Global | ThemeToggle | 9 | ✓✓ |
| Global | CommercialCta | 7.5 | ⚠️ |
| Global | Forms públicos | 8 | ✓ |
| Global | Loading global | 4.5 | 🔴 |
| Global | Skeletons | 1 | 🔴 |
| Global | Empty States | 3 | 🔴 |
| Sistema | 3.1 Tipografia | 9 | ✓✓ |
| Sistema | 3.2 Cores | 8.5 | ✓ |
| Sistema | 3.3 Movimento | 7.5 | ⚠️ |
| Sistema | 3.4 Espaçamento | 8 | ✓ |
| Sistema | 3.5 Ícones | 9 | ✓✓ |
| Sistema | 3.6 Imagens | 7 | ⚠️ |
| Sistema | 3.7 A11y | 8 | ✓ |

Legenda: ✓✓ premium-ready · ✓ acima da média · ⚠️ precisa ajuste · 🔴 crítico

---

*Fim do diagnóstico. Aguardando decisão do Léo para gerar prompt de execução.*
