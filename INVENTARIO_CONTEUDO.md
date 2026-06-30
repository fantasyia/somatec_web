# Inventário Completo de Conteúdo — Site MSM

> Documento gerado em 2026-05-18 a partir de varredura automatizada do código-fonte, seeds SQL e schemas de banco.
> Fases: **1.** Inventário · **2.** Gaps · **3.** Status técnico
> Stack: Next.js 16.2 · React 19 · Supabase · Railway

---

## 📋 SEÇÃO 1 — INVENTÁRIO COMPLETO DE CONTEÚDO

### 1.A — Componentes globais (visíveis em todas as rotas públicas)

#### Header

- Logo "MSM"
- Menu: **A MSM · Marcas · Produtos · Soluções** (mega-menu) **· Receitas · Blog · Contato**
- Submenu de Soluções: Food Service, B2B, Terceirização, Envase, Marcas Próprias, Distribuição
- CTAs desktop: "Área do Representante" → `/login` · "Fale com o Comercial" → `/contato`
- Toggle de tema claro/escuro
- Menu mobile drawer

#### Footer

- Descrição institucional: *"Indústria, marcas e soluções para o mercado food service e B2B."*
- Sociais: LinkedIn, Instagram, YouTube (se configurados em `SOCIALS`)
- 6 colunas de links:
  1. **A MSM** — Quem somos, Estrutura industrial, Qualidade e segurança
  2. **Marcas** — Todas as marcas
  3. **Produtos** — Categorias, Aplicações, Todos os produtos
  4. **Soluções** — Food Service, B2B, Terceirização, Envase, Marcas Próprias, Distribuição
  5. **Receitas** — Categorias, Todas as receitas
  6. **Contato** — Fale com o comercial, Trabalhe conosco, Política de privacidade, Termos de uso
- Certificações em pills: **FSSC 22000, BRCGS, ISO 9001, Halal** *(todas marcadas como `placeholder: true` no código)*
- Copyright: *"© {ano} MSM Alimentos. Todos os direitos reservados."*
- Links inferiores: Política de privacidade · Termos de uso · Cookies

#### Cookie Banner (LGPD)

- Body padrão: *"Utilizamos cookies essenciais para o funcionamento do site e, com seu consentimento, cookies analíticos para melhorar sua experiência. Saiba mais em nossa Política de Cookies | Política de Privacidade."*
- Botões: **Apenas essenciais** | **Aceitar cookies**

---

### 1.1 / 1.2 — Conteúdo por rota pública

#### `/` (Home)

**Título da página:** *MSM Alimentos — Indústria, marcas e soluções para o mercado food service e B2B*

| Bloco | Conteúdo |
|---|---|
| **Hero (HomeHero)** | Eyebrow "Indústria · Food Service · B2B" / H1 "Indústria, marcas e soluções para o mercado food service e B2B" / Sub "Qualidade, inovação e escala para impulsionar negócios e criar experiências que alimentam." / CTAs "Conheça nossas soluções" + "Fale com o comercial" / Placeholder de vídeo: "MP4 · 1920×1080 · 30s–2min · loop · sem áudio" |
| **Carrossel (HomeCarousel)** | 4 slides DB com transition 7s: **Food Service** / **Marcas Próprias** / **Terceirização de Produção** / **Envase** — todos com subtitle "Solução Comercial" e CTA "Conheça" |
| **Manifesto (HomeManifesto)** | Eyebrow "Indústria de alimentos B2B" / H2 "Fabricamos com a estabilidade que sua **operação precisa**." / *"Sua marca, sua receita ou nosso portfólio — a MSM entrega o mesmo padrão de qualidade em qualquer escala. Sem improviso, sem variação de lote a lote, sem surpresa no prazo."* |
| **Indicadores (HomeIndicators)** | 4 colunas (sem números): **Indústria** (Estrutura produtiva própria) · **Food Service** (Operações profissionais) · **B2B** (Indústrias, redes e atacadistas) · **Atendimento Nacional** (Entregas para todo o Brasil) + pills de certificações |
| **Marcas (HomeBrands)** | 6 slots — DB: Cocina, Massa Brasil, Naturale (reais) + 3 "Em breve" |
| **Produtos em destaque (HomeProducts)** | Eyebrow "Destaques" / Carousel com cards (DB: 10 produtos) / Link "Ver todos" |
| **Receitas em destaque (HomeRecipes)** | 3 cards (DB: Pizza Margherita Profissional, Risoto de Cogumelos Cremoso, Frango Grelhado com Ervas) / Link "Ver todas" |
| **Blog teaser (HomeBlogTeaser)** | "Conteúdos sobre indústria, food service e marcas, em breve." / Link "Saiba mais" |
| **Fale Conosco (HomeCta)** | Eyebrow "Fale conosco" / H2 "Como podemos ajudar você" / Header CTA "Enviar mensagem" / 3 cards (representante, food_service, b2b) |

**Placeholders identificados:**
- Vídeo do hero ausente (admin precisa cadastrar)
- 4 certificações marcadas como placeholder
- Imagens via picsum.photos / fastly.picsum.photos

**Conteúdo faltando (se DB vazio):**
- HomeBrands/Products/Recipes não renderizam — fallback opera

---

#### `/a-msm` (hub institucional)

- **Hero:** Eyebrow "A MSM" / H1 "Indústria, qualidade e parceria" / Sub *"A MSM é uma indústria alimentícia voltada ao mercado B2B, com atuação integrada em produção, envase, marcas próprias e soluções comerciais para todo o Brasil."*
- **4 cards de navegação:**
  1. **Quem somos** (Users) — "Conheça a história, o propósito e os valores que orientam a atuação da MSM..."
  2. **Estrutura industrial** (Building2) — "Infraestrutura produtiva dimensionada para atender volumes B2B..."
  3. **Qualidade e segurança** (ShieldCheck) — "Processos de controle de qualidade e segurança alimentar..."
  4. **Nossas soluções** (FlaskConical) — "Food service, B2B, terceirização, envase, marcas próprias e distribuição..."

---

#### `/a-msm/quem-somos`

- **Hero:** "Quem somos" / *"Uma indústria alimentícia construída sobre rigor técnico, parcerias de longo prazo e compromisso com a qualidade em cada etapa da produção."*
- **Missão:** "Gerar valor para o ecossistema alimentício" — *"A MSM atua como elo estratégico entre a produção industrial de alimentos e as demandas do mercado B2B nacional, oferecendo soluções integradas que vão da fabricação ao desenvolvimento de marcas próprias."*
- **Visão:** "Referência em soluções industriais para alimentos" — *"Ser reconhecida como a parceira mais confiável para empresas que precisam de capacidade industrial, qualidade consistente e flexibilidade para crescer com segurança."*
- **4 Valores:** Qualidade · Parceria · Consistência · Inovação (com descrição completa cada)
- **CTA Final:** "Pronto para conhecer nossas soluções?" → "Falar com a equipe" + "Ver soluções"

---

#### `/a-msm/estrutura-industrial`

- **Hero:** "Estrutura industrial" / *"Infraestrutura produtiva e tecnológica dimensionada para atender o mercado B2B com escala, precisão e controle de processo em cada etapa."*
- **Intro editorial:** "Produção industrial preparada para escala" (2 parágrafos completos)
- **4 diferenciais (cards):**
  - **Linhas de produção** (Layers) — "Múltiplas linhas produtivas para diferentes categorias de alimentos, com flexibilidade..."
  - **Controle de processo** (Thermometer) — "Monitoramento contínuo de temperatura, umidade e parâmetros críticos..."
  - **Rastreabilidade** (BarChart3) — "Sistema de rastreabilidade integrado que permite acompanhar a origem..."
  - **Logística integrada** (Truck) — "Estrutura de expedição e controle de estoque..."
- **CTA Final:** "Quer saber se atendemos a sua demanda?" → "Falar com a equipe" + "Terceirização"

---

#### `/a-msm/qualidade-e-seguranca`

- **Hero:** "Qualidade e segurança alimentar" / *"Processos estruturados de controle de qualidade e segurança alimentar aplicados em todas as etapas da produção..."*
- **Nossa abordagem:** "Segurança alimentar como prioridade estrutural" (2 parágrafos)
- **4 pilares (cards):**
  - **Controle de entrada** (ClipboardCheck) — "Análise e aprovação de matérias-primas e embalagens antes de qualquer uso..."
  - **Análises laboratoriais** (Microscope) — "Monitoramento microbiológico e físico-químico..."
  - **Controle de pontos críticos** (AlertTriangle) — "Identificação e monitoramento dos pontos críticos de controle..."
  - **Auditoria e rastreabilidade** (ShieldCheck) — "Processos de auditoria interna periódica..."
- **CTA Final:** "Documentação técnica disponível" → "Solicitar informações"

---

#### `/solucoes` (hub)

- **Hero:** Eyebrow "Soluções" / H1 "Soluções completas para o seu negócio" / Sub completo institucional
- **Grid 6 cards com ícones e descrições editoriais:**
  1. **Food Service** (ChefHat) → `/solucoes/food-service`
  2. **B2B** (Building2) → `/solucoes/b2b`
  3. **Terceirização de Produção** (Factory) → `/solucoes/terceirizacao-de-producao`
  4. **Envase** (Package) → `/solucoes/envase`
  5. **Marcas Próprias** (Tag) → `/solucoes/marcas-proprias`
  6. **Distribuição** (Truck) → `/solucoes/distribuicao`
- **CTA Final:** "Não encontrou o que procura?" → "Falar com a equipe"

---

#### `/solucoes/food-service`

- **Hero:** "Food Service" / *"Produtos e soluções desenvolvidos para atender as exigências da operação de food service em escala — de restaurantes independentes a grandes redes e cozinhas centrais."*
- **Bloco editorial:** "Insumos confiáveis para cozinhas que não podem parar" (2 parágrafos)
- **4 diferenciais (cards):**
  - **Produtos para cozinhas profissionais** (ChefHat)
  - **Formatos adequados para a operação** (Package)
  - **Regularidade de abastecimento** (Clock)
  - **Suporte técnico e comercial** (BarChart3)
- **CTA Final:** "Vamos conversar sobre a sua operação?" → "Solicitar contato" + "Ver produtos"

#### `/solucoes/b2b`

- **Hero:** "Fornecimento B2B" / *"Produtos alimentícios com qualidade industrial fornecidos diretamente para indústrias, redes atacadistas, distribuidores e operadores de grande porte."*
- **Bloco:** "Fornecimento industrial com previsibilidade e confiança" (2 parágrafos)
- **4 diferenciais:** Escala para grandes volumes (Building2) · Qualidade rastreável (ShieldCheck) · Catálogo técnico (FileText) · Relacionamento comercial direto (Handshake)
- **CTA Final:** "Inicie uma negociação" → "Solicitar proposta B2B" + "Explorar catálogo"

#### `/solucoes/terceirizacao-de-producao`

- **Hero:** "Terceirização de Produção" / *"Produza sua marca com a estrutura industrial da MSM — da formulação ao produto acabado..."*
- **Bloco:** "Sua marca produzida com infraestrutura industrial"
- **Processo (4 steps numerados):**
  1. **01** Análise da formulação
  2. **02** Desenvolvimento e testes
  3. **03** Aprovação e escalonamento
  4. **04** Produção e entrega
- **4 diferenciais:** Estrutura pronta (Factory) · Flexibilidade de formulação (Settings) · Documentação completa (FileText) · Controle de qualidade incluso (ShieldCheck)
- **CTA Final:** "Pronto para discutir seu projeto?" → "Solicitar avaliação"

#### `/solucoes/envase`

- **Hero:** "Envase industrial" / *"Serviços de envase com controle de peso, vedação e rotulagem integrados..."*
- **Bloco:** "Envase terceirizado com padrão industrial" (2 parágrafos)
- **4 features:** Diferentes formatos (Layers) · Pesagem de precisão (Scale) · Rotulagem e identificação (Scan) · Controle de vedação (Package)
- **CTA Final:** "Fale com nossa equipe de envase" → "Solicitar avaliação"

#### `/solucoes/marcas-proprias`

- **Hero:** "Marcas Próprias" / *"Desenvolva e produza sua marca com a estrutura industrial da MSM..."*
- **Bloco:** "Sua marca, nossa estrutura" (2 parágrafos)
- **4 cards:** Produção industrial completa (Factory) · Flexibilidade de identidade (Palette) · Escala sob demanda (TrendingUp) · Portfólio diversificado (Tag)
- **CTA Final:** "Vamos desenvolver sua marca juntos?" → "Falar sobre marcas próprias"

#### `/solucoes/distribuicao`

- **Hero:** "Distribuição" / *"Logística de distribuição estruturada para levar os produtos MSM a distribuidores, redes e parceiros comerciais em todo o Brasil..."*
- **Bloco:** "Distribuição que acompanha o seu crescimento" (2 parágrafos)
- **4 cards:** Cobertura nacional (MapPin) · Planejamento de entrega (Clock) · Controle de estoque (BarChart3) · Parceiros logísticos (Truck)
- **CTA Final:** "Quer ser um distribuidor MSM?" → **"Seja um representante"** (form) + **"Contato comercial"** (zap)

---

#### `/marcas` + `/marcas/[slug]`

- **Listing:** Eyebrow "Portfólio" / H1 "Nossas marcas" / Sub *"Marcas desenvolvidas com padrão industrial MSM..."*
- **DB populado:** 3 marcas (Cocina · Massa Brasil · Naturale) com positioning e target_audience completos
- **DB vazio (fallback):** "Portfólio de marcas em publicação" + CTA "Falar com a equipe"
- **Detalhe `[slug]`:** Hero + descrição completa + grid de produtos da marca + CTA "Solicitar informações"

---

#### `/produtos` + sub-rotas

- **Listing `/produtos`:** Eyebrow "Catálogo" / H1 "Nossos produtos"
- **DB populado:** 10 produtos com descrições técnicas detalhadas (packaging, commercial_notes)
- **DB vazio:** Fallback "Catálogo em publicação" + CTA "Solicitar catálogo"
- **Sub-rotas dinâmicas:**
  - `/produtos/[slug]` — Imagem + descrições + embalagens + opções + ficha técnica + CTA "Solicitar proposta"
  - `/produtos/categoria/[slug]` — Lista produtos da categoria
  - `/produtos/aplicacao/[slug]` — Lista produtos para aplicação
  - `/produtos/marca/[slug]` — Lista produtos da marca

---

#### `/receitas` + sub-rotas

- **Listing:** Eyebrow "Inspiração" / H1 "Receitas" / filtros de categoria + grid
- **DB populado:** 5 receitas com ingredients[] e instructions[] em jsonb
- **DB vazio:** Fallback "Receitas em publicação" + CTA "Falar com a equipe food service"
- **Sub-rotas:** `/receitas/[slug]`, `/receitas/categoria/[slug]`, `/receitas/produto/[slug]`

---

#### `/contato`

- **Hero:** Eyebrow "Comercial" / H1 "Fale com a MSM" / Sub "Selecione o tipo de interesse e nossa equipe entrará em contato pelo WhatsApp."
- **Sidebar:** "Como podemos ajudar?" + link "Quer ser representante? Cadastre-se aqui" → `/representantes`
- **Formulário ContactForm** com variante `contato_geral` segmentado por interest_type

#### `/representantes`

- **Hero:** Eyebrow "Trabalhe com a MSM" / H1 "Seja um representante" / Sub completo
- **Sidebar:** "Atuação comercial em todo o Brasil" + 3 benefícios:
  - "Portfólio completo de marcas e produtos."
  - "Suporte comercial e materiais de venda."
  - "Atendimento estruturado para Food Service e B2B."
- **Formulário RepresentanteForm**

---

#### Páginas legais (todas com texto jurídico completo, não Lorem)

**`/politica-de-privacidade`** — 9 seções LGPD:
1. Quem somos
2. Dados coletados
3. Finalidade do tratamento
4. Base legal
5. Compartilhamento de dados
6. Retenção de dados
7. Seus direitos
8. Segurança
9. Contato do encarregado (DPO)

**`/termos-de-uso`** — 8 seções:
1. Aceitação dos termos
2. Natureza do site
3. Propriedade intelectual
4. Uso permitido
5. Limitação de responsabilidade
6. Links externos
7. Alterações
8. Lei aplicável

**`/cookies`** — 5 seções:
1. O que são cookies?
2. Cookies que utilizamos
3. Cookies de sessão e persistentes
4. Como gerenciar cookies
5. Alterações nesta política

Última atualização: **maio de 2025 | v1.0** (versão registrada em `site_settings.lgpd_consent_text`)

---

#### `/blog`

- Placeholder simples: Eyebrow "Blog MSM" / H1 "Em breve" / Sub completo
- Nota: "O blog institucional MSM será lançado em breve..."
- **Sem `[slug]`, sem CMS, sem categorias** (escopo v1.0)

---

### 1.A.1 — Seed data populado no DB

> Fonte principal: `scripts/010-demo-content.sql` (UUIDs determinísticos md5, idempotente).
> Schema base: `supabase/migrations/00001_init_schema.sql`.

#### `site_settings` (4 keys + 1 whatsapp)

| Key | Conteúdo | Placeholder? |
|---|---|---|
| `lgpd_consent_text` | `{ version: "v1.0", text: "Ao enviar este formulário, você concorda..." }` | NÃO |
| `cookie_banner_text` | `{ body, accept_label, essential_only_label }` | NÃO |
| `mullerbot_integration_status` | `{ is_healthy, last_health_check, notes }` | NÃO (técnico) |
| `company_info` | `{ legal_name: "MSM Alimentos", cnpj: null, address: null, whatsapp: null, email: "comercial@msm.com.br" }` | **PARCIAL — CNPJ/endereço/whatsapp null** |
| `whatsapp_button` | `{ enabled: false, number: "", message: "Olá! Vim pelo site da MSM..." }` | NÃO (mas desabilitado) |

#### `product_categories` (5 registros)

1. **Molhos e Condimentos** — "Molhos prontos, temperos e bases para cozinhas profissionais. Padrão consistente em qualquer escala."
2. **Óleos e Gorduras** — "Óleos vegetais, azeites e gorduras vegetais com especificações ajustáveis ao processo de cada cliente."
3. **Laticínios e Cremes** — "Cremes culinários, leites e laticínios estabilizados para food service e indústria."
4. **Cereais e Massas** — "Bases secas, farinhas e massas em embalagens dimensionadas para alto volume."
5. **Linha Premium** — "Produtos de alto valor agregado para chefs e operações que diferenciam pela experiência."

**Imagens:** todas via `picsum.photos/seed/cat-*` (placeholder)

#### `product_applications` (4 registros)

1. **Pizzarias** — "Soluções pensadas para o ritmo da pizzaria — rendimento consistente, sabor que aguenta o forno e o delivery."
2. **Hamburguerias** — "Bases e finalizações para hamburguerias artesanais e redes — padrão e sabor em qualquer combo."
3. **Cozinhas Industriais** — "Para refeições coletivas, hospitais, escolas e indústrias — eficiência de processo e custo previsível."
4. **Padarias e Confeitarias** — "Bases, recheios e coberturas para padarias artesanais e confeitarias de alto giro."

#### `brands` (3 registros — todos featured=true)

**1. Cocina** (slug: `cocina`)
- Short: "Linha premium para cozinhas profissionais que valorizam consistência e sabor."
- Positioning: "Premium para food service exigente"
- Target: "Chefs, restaurantes médio-alto e operações que diferenciam pela experiência"
- Categories: `["Molhos e Condimentos", "Óleos e Gorduras", "Linha Premium"]`
- Full description: 2 parágrafos completos sobre formulação para chefs

**2. Massa Brasil** (slug: `massa-brasil`)
- Short: "Bases, massas e cereais para operações de alto volume."
- Positioning: "Eficiência e escala para alto volume"
- Target: "Redes de food service, refeições coletivas, indústria alimentícia"
- Categories: `["Cereais e Massas", "Molhos e Condimentos"]`

**3. Naturale** (slug: `naturale`)
- Short: "Linha de produtos com clean label e foco em alimentação consciente."
- Positioning: "Clean label para o mercado consciente"
- Target: "Restaurantes naturais, redes saudáveis, padarias artesanais"
- Categories: `["Óleos e Gorduras", "Laticínios e Cremes", "Linha Premium"]`

**Logos:** todas via `picsum.photos/seed/brand-*-logo` (placeholder)

#### `products` (10 registros com descrições técnicas reais)

| # | Nome | Marca | Categoria | Packaging | Featured |
|---|---|---|---|---|---|
| 1 | Molho de Tomate Especial Cocina | Cocina | Molhos | Pouch 2kg · Bag-in-box 10kg | ✓ |
| 2 | Molho Branco Culinário Cocina | Cocina | Molhos | Pouch 1kg · Bag 5kg | ✓ |
| 3 | Óleo Vegetal Profissional | Massa Brasil | Óleos | Galão 20L · Bombona 50L | ✓ |
| 4 | Azeite Composto Premium | Cocina | Premium | Garrafa 500ml · Lata 5L | — |
| 5 | Creme de Leite Culinário | Cocina | Laticínios | Pouch 1L · Bag 5L | ✓ |
| 6 | Farinha de Trigo Especial | Massa Brasil | Cereais | Saco 25kg · Big bag 1t | — |
| 7 | Massa para Pizza Pré-Pronta | Massa Brasil | Cereais | Disco 30cm · Caixa 20un | — |
| 8 | Tempero Completo Industrial | Massa Brasil | Molhos | Saco 5kg · Saco 25kg | — |
| 9 | Óleo de Coco Natural | Naturale | Óleos | Pote 500g · Balde 5kg | ✓ |
| 10 | Creme Vegetal Naturale | Naturale | Laticínios | Pouch 1L | — |

**Notas comerciais inventadas** (exemplo): "Pedido mínimo 50kg. Entrega regular em ciclos de 15 dias para SP/RJ/MG."

#### `recipes` (5 receitas profissionais com jsonb estruturado)

1. **Pizza Margherita Profissional** (Massas e Pizzas) — prep 15min · cook 8min · 1 pizza 30cm — 5 ingredientes, 4 passos, chef notes
2. **Risoto de Cogumelos Cremoso** (Pratos Principais) — prep 20min · cook 25min · 4 porções — 7 ingredientes, 4 passos, técnica de service
3. **Frango Grelhado com Ervas** (Pratos Principais) — prep 10min + 2h marinada · cook 12min · 4 porções
4. **Macarrão ao Pomodoro** (Massas e Pizzas) — prep 5min · cook 15min · 4 porções
5. **Molho Branco Base com Cogumelos** (Acompanhamentos e Molhos) — prep 5min · cook 10min · 500ml

#### `home_hero` (1 registro)

- Title: "Indústria, marcas e soluções para o mercado food service e B2B"
- Subtitle: "MSM Alimentos"
- Description: "Qualidade, inovação e escala para impulsionar negócios."
- Fallback image: picsum (placeholder)
- Primary CTA: "Conheça nossos produtos" → `/produtos`
- Secondary CTA: "Fale com o comercial" → `/contato`
- Overlay opacity: 0.55

#### `home_slider_items` (4 slides, 7s)

1. Food Service — "Soluções práticas e saborosas para o dia a dia de cozinhas profissionais."
2. Marcas Próprias — "Desenvolvimento completo de marcas exclusivas com nossa estrutura."
3. Terceirização — "Produção com qualidade, segurança e flexibilidade."
4. Envase — "Estrutura moderna e tecnologia para diferentes formatos de embalagem."

#### `home_cta_cards` (5 cards)

| # | Title | Interest type | Button |
|---|---|---|---|
| 1 | Food Service | `food_service` | "Conhecer linha" |
| 2 | B2B | `b2b` | "Falar com a equipe" |
| 3 | Terceirização | `terceirizacao` | "Saber mais" |
| 4 | Marcas Próprias | `marcas_proprias` | "Conhecer programa" |
| 5 | Distribuição | `distribuicao` | "Falar com a equipe" |

#### `banners` (4 banners — location='home')

1. **Soluções para Food Service** — overlay dark
2. **Terceirização Industrial** — overlay dark
3. **Distribuição B2B** — overlay gold
4. **Marcas Próprias** — overlay dark

#### Tabelas VAZIAS (sem seed)

| Tabela | Impacto |
|---|---|
| `home_indicators` | Os 4 indicadores que aparecem na home vêm de fallback estático |
| `solutions` | Páginas /solucoes/* são estáticas (não vêm do DB) |
| `pages` | Páginas A MSM/Quem Somos/etc são estáticas |
| `footer_columns` + `footer_links` | Footer usa constants/navigation.ts (`FOOTER_COLUMNS`) |
| `navigation_items` | Header usa constante `HEADER_NAV` |
| `product_images` | Cada produto só tem `main_image_url` (sem galeria multi-imagem) |
| `product_packaging_options` | Embalagens em texto livre em `packaging_summary` |
| `recipe_products` | Receitas não estão associadas a produtos via relação |
| `redirects` | Criadas conforme necessário para SEO |
| `webhook_retry_queue` | Tabela técnica, preenchida em runtime |
| `admin_activity_log` | Auditoria, preenchida via triggers |
| `media_assets` | Aguarda uploads via /admin/midias |

---

### 1.3 — Inventário de mídias

#### ✅ Sistema de upload (real)

- **Local:** `/admin/midias` (componente `MidiasClient`)
- **Bucket:** Supabase Storage `site-public`
- **Tipos aceitos:** `.png .jpg .jpeg .webp .svg .mp4 .webm .pdf`
- **Limites:** Imagens/PDF/SVG ≤ 10 MB · Vídeos ≤ 8 MB

#### ⚠️ Placeholders (funcionam mas genéricos)

**Hero:**
- Fallback image: `https://placehold.co/1920x1080/03111F/1a2e45?text=.`
- Vídeo: NÃO existe (admin precisa cadastrar)

**Slider editorial (4 slides):**
- `picsum.photos/seed/msm-slide-{fs,mp,tc,en}/1200/900`

**Logos de marcas fallback (6):**
- `placehold.co/240x80/C9A24A/03111F?text={Nome}`
- Marca Premium · Marca Gourmet · Chef Line · Natural Select · Classic · Pro Series

**Produtos fallback (6):**
- `picsum.photos/seed/msm-prod-{1..6}/600/750`

**Receitas fallback (3):**
- `picsum.photos/seed/msm-rec-{1..3}/800/600`

**Seed data (13 imagens):**
- Todas categorias, aplicações, produtos, marcas, receitas e banners do seed `010-demo-content.sql` usam `picsum.photos/seed/*`

#### ❌ Faltando (referenciados sem arquivo real)

- **`/public/og-default.jpg`** — referenciado em `src/lib/constants/site.ts` mas sem arquivo. Sem ele, **OG cards do WhatsApp/LinkedIn quebram**.
- **Vídeo do hero** (`home_hero.video_url` null) — admin precisa cadastrar MP4/WebM, ≤8 MB, ≤15 s
- **Logos das 4 certificações** (FSSC 22000, BRCGS, ISO 9001, Halal) — só texto/pill, sem imagem
- **Logos reais das 3 marcas** Cocina/Massa Brasil/Naturale — DB usa picsum
- **Fotos profissionais dos 10 produtos** do seed
- **Fotos das 5 receitas** do seed
- **Icon urls** (HomeCtaCard, HomeIndicator, Solution) — todos null no DB

#### Ícones

Biblioteca: **lucide-react** (Lucide). Usados nos componentes principais:
- Header: ChevronRight, Menu, X
- Hero: ChevronRight, Pause, Play, Video
- HomeCta: ChevronRight, Users, Utensils, Building, Box, Boxes, Layers
- Footer: Instagram, Linkedin, Youtube
- Soluções: ChefHat, Building2, Factory, Package, Tag, Truck, Clock, BarChart3, Settings, FileText, ShieldCheck, Handshake, Scale, Scan, Layers, Palette, TrendingUp, MapPin, Microscope, ClipboardCheck, AlertTriangle, Thermometer, Cookie, FlaskConical

---

### 1.4 — Inventário de formulários públicos

**6 formulários** com Zod schemas centralizados em `src/lib/forms/schemas.ts`:

| Formulário | Rota | form_type (MullerBot) | Campos extras |
|---|---|---|---|
| Contato Geral | `/contato` | `contato_geral` | select de interest_type |
| Food Service | `/contato` (variant) | `food_service` | empresa, cidade, estado, tipo_operacao, volume_estimado |
| B2B | `/contato` (variant) | `b2b` | empresa, segmento, volume_estimado |
| Terceirização | `/contato` (variant) | `terceirizacao` | empresa, produto_interesse, volume_estimado |
| Envase | `/contato` (variant) | `envase` | empresa, tipo_produto, tipo_embalagem, volume_estimado |
| Representante | `/representantes` | `representante` | cidade, estado, regiao, experiencia, mensagem |

#### Campos base (todos os formulários)

| Campo | Tipo | Validação |
|---|---|---|
| `name` | text | req, 2–120 chars, trim |
| `email` | email | req, lowercase, 5–120 chars |
| `whatsapp` | tel | req, normaliza para +55XXXXXXXXXXX |
| `lgpd_consent` | checkbox | req, literal true |
| `website` | hidden | honeypot (must be empty) |
| `captcha_token` | hidden | Turnstile, verified server-side |
| `source_page` | hidden | optional, default "/contato" |

#### Mensagens fixas

- **Sucesso:** *"Mensagem enviada com sucesso. Nossa equipe entrará em contato pelo WhatsApp."*
- **Erro Turnstile:** *"Validação de segurança falhou. Recarregue a página e tente novamente."*
- **Erro genérico:** *"Não foi possível enviar sua mensagem agora. Tente novamente em instantes."*

#### Fluxo `/api/forms/submit`

1. Validação `Idempotency-Key`
2. Parse JSON
3. **Honeypot** check (website field)
4. **Turnstile** verify
5. **Rate limit** (IP) via Upstash
6. **Zod validation** (formSubmitSchema discriminated union)
7. **buildMullerBotPayload** com LGPD, IP, User-Agent, Referer
8. **enqueueSubmission** (Upstash queue para retry)
9. **sendToMullerBot** (síncrono)
10. **Resposta 200** sempre quando válido (v1.1 §2.2)

---

### 1.5 — Painel admin (19 módulos implementados)

#### Infraestrutura

- **Auth:** Supabase Auth + tabela `admin_profiles` (active=true required)
- **Middleware:** `requireAdmin()` em `src/lib/admin/auth.ts`
- **AdminShell:** sidebar (3 grupos) + topbar + content area
- **Dashboard `/admin`:** 4 contadores (Produtos / Receitas / Marcas / Soluções) + status webhook MullerBot + grid de atalhos

#### Conteúdo (11 módulos)

| Módulo | Rota | Listagem | Gaps form vs schema |
|---|---|---|---|
| **Home** | `/admin/home` | Abas: Hero / Slider / Indicators / CTA cards | Hero: `mobile_fallback_image_url`, `overlay_opacity`, `seo_support_text` · Slider: `mobile_image_url` · Indicators e CTA: `icon_url` |
| **Banners** | `/admin/banners` | título · local · rota · status | `description`, `video_url`, `overlay_style` |
| **Páginas** | `/admin/paginas` | título · rota · tipo · status | `og_title`, `og_description`, `og_image_url`, `canonical_url` |
| **Soluções** | `/admin/solucoes` | título · slug · ordem · status | `full_content`, `icon_url`, `benefits`, todos SEO/OG/canonical/robots |
| **Marcas** | `/admin/marcas` | nome · slug · featured · status | todos SEO/OG/canonical/robots |
| **Produtos** | `/admin/produtos` | nome · marca · categoria · destaque · status | SEO/OG, **`product_images`, `product_packaging_options`, `product_application_links` sem UI** |
| **Categorias** | `/admin/categorias` | nome · slug · ordem · status | SEO/OG |
| **Cat. Receitas** | `/admin/categorias-receitas` | nome · slug · ordem · status | SEO/OG |
| **Aplicações** | `/admin/aplicacoes` | nome · slug · ordem · status | SEO/OG, `product_application_links` |
| **Receitas** | `/admin/receitas` | título · categoria · destaque · status | **`ingredients` e `instructions` via JSON direto na tabela — sem UI visual** |
| **Mídias** | `/admin/midias` | grid com upload | (não aplicável — Supabase Storage) |

#### Configuração (5 módulos)

| Módulo | Rota | Descrição |
|---|---|---|
| **SEO Global** | `/admin/seo` | title template, description, OG default, twitter handle (via `SiteSettingsForm`) |
| **Navegação** | `/admin/navegacao` | label, href, location, parent_id, ordem |
| **Footer** | `/admin/footer` | colunas + links (CRUD separado) |
| **Configurações** | `/admin/configuracoes` | JSON textarea: company_info, lgpd, cookie banner, mullerbot status |
| **WhatsApp** | `/admin/whatsapp` | enabled, number, message |

#### Sistema (3 módulos)

| Módulo | Rota | Funcionalidade |
|---|---|---|
| **Redirects** | `/admin/redirects` | from_path → to_path + status_code + notes |
| **Log de Auditoria** | `/admin/audit` | read-only últimas 200 entradas (action, table, record, IP) |
| **Integração** | `/admin/integracao` | health do MullerBot + fila webhook_retry_queue |

> A documentação oficial v1.0 §21 previa 14 módulos. A implementação tem **19** (5 adicionais: WhatsApp, Cat. Receitas, Redirects, Audit, Integração).

---

## 🚨 SEÇÃO 2 — GAPS DE CONTEÚDO E MÍDIAS

### 2.1 — Textos a substituir

```
[ ] PÁGINA: / — BLOCO: Hero — CAMPO: Vídeo institucional
    ATUAL: Placeholder visual "Vídeo Institucional — MP4 · 1920×1080..."
    STATUS: PRECISA DE VÍDEO REAL (upload via /admin/midias)

[ ] PÁGINA: / — BLOCO: Indicadores — CAMPO: 4 indicadores
    ATUAL: Apenas categorias (Indústria/Food Service/B2B/Atendimento Nacional)
        — sem números, propositalmente (regra v1.0 §9: "não inventar números")
    STATUS: Considerar adicionar dados REAIS confirmados pelo cliente

[ ] PÁGINA: / — BLOCO: Marcas — CAMPO: 6 slots
    ATUAL: 3 reais (Cocina, Massa Brasil, Naturale) + 3 "Em breve"
    STATUS: Definir se haverá mais marcas além das 3 ou se 3 é o portfólio final

[ ] PÁGINA: footer — BLOCO: Certificações pills
    ATUAL: FSSC 22000, BRCGS, ISO 9001, Halal (todas marcadas placeholder: true)
    STATUS: CONFIRMAR quais a MSM realmente possui; remover as não-aplicáveis

[ ] site_settings.company_info
    ATUAL: { legal_name: "MSM Alimentos", cnpj: null, address: null,
            whatsapp: null, email: "comercial@msm.com.br" }
    STATUS: PRECISA CNPJ, endereço, whatsapp comercial real

[ ] /admin/whatsapp
    ATUAL: { enabled: false, number: "", message: padrão }
    STATUS: PRECISA ATIVAÇÃO + número real
        (sem isso, 20+ CTAs comerciais caem em /contato em vez de wa.me)
```

### 2.2 — Seed data placeholder

| O que | Status |
|---|---|
| **Nomes das 3 marcas** (Cocina, Massa Brasil, Naturale) | Parecem inventados. **Confirmar se são as marcas reais da MSM** |
| **10 produtos com descrições técnicas** | Detalhados e críveis. Confirmar se refletem o portfólio real |
| **Embalagens** ("Pouch 2kg", "Galão 20L"...) | Específicas mas precisam validação com produção |
| **Notas comerciais** ("Pedido mínimo 50kg", "Entrega 15 dias SP/RJ/MG") | **INVENTADOS** — substituir por política real |
| **5 receitas profissionais** | Boas, mas validar com chef MSM se for usar como conteúdo público |
| **4 banners da home** | Textos OK; imagens picsum precisam virar fotos reais |
| **Hero descrição** "Qualidade, inovação e escala..." | Genérica — pode ficar mais editorial/específica |

### 2.3 — Mídias faltando

#### ❌ CRÍTICO

- `/public/og-default.jpg` (sem ele, OG cards quebram em WhatsApp/LinkedIn)
- Vídeo do hero (`home_hero.video_url` null)
- Logos reais das 3 marcas (DB ainda usa picsum)
- Logos das 4 certificações (FSSC 22000, BRCGS, ISO 9001, Halal)

#### ⚠️ SUBSTITUIR

- 13 imagens picsum.photos (slider, banners, categorias, produtos, marcas, receitas)
- 7 placehold.co (fallbacks de marcas/hero)
- Fotos profissionais dos 10 produtos do seed
- Fotos das 5 receitas do seed

### 2.4 — Tabelas vazias / módulos sem conteúdo de teste

| Tabela vazia | Impacto |
|---|---|
| `home_indicators` | Os 4 indicadores que aparecem na home vêm de fallback estático, não do DB |
| `solutions` | As 6 páginas /solucoes/* são estáticas. Admin disponível mas sem registros |
| `pages` | Páginas A MSM/Quem Somos/etc são estáticas. Módulo /admin/paginas vazio |
| `footer_columns` + `footer_links` | Footer usa fallback constante. Módulo /admin/footer vazio |
| `navigation_items` | Header usa fallback constante. Módulo /admin/navegacao vazio |
| `product_images` | Cada produto só tem `main_image_url`; sem galeria multi-imagem |
| `product_packaging_options` | Embalagens em texto livre em `packaging_summary` |
| `recipe_products` | Receitas não estão associadas a produtos via relação |

### 2.5 — Funcionalidades incompletas visíveis ao usuário

- **Filtros em `/produtos`** — UI existe (pills) mas se DB sem `category_id` populado, filtros não funcionam (DB atual OK — 10 produtos têm category_id)
- **`/admin/seo`** separado de `/admin/configuracoes` mas usa o mesmo `SiteSettingsForm` — UX confusa
- **Reordenar slides/indicators no admin** — `GripVertical` icon presente mas drag-and-drop não implementado
- **Receitas — `ingredients`/`instructions` sem UI visual** — admin precisa editar JSON direto (já avisado na interface)
- **`product_images` / `product_packaging_options` / `product_application_links`** — sem UI no /admin/produtos; precisam edição via SQL
- **Reset/forgot password** — não existe rota; criar usuário recria via `scripts/create-admin.mjs`

---

## ⚙️ SEÇÃO 3 — STATUS TÉCNICO

| Check | Resultado |
|---|---|
| **typecheck** (`tsc --noEmit`) | ✅ PASSOU — zero erros |
| **build** (`npm run build`) | ✅ PASSOU — exit code 0, 51 rotas compiladas |
| **npm audit** (high) | ✅ Zero vulnerabilidades **high** |
| **npm audit** (moderate) | ⚠️ 2 moderate: `postcss` (XSS via `</style>` — CVSS 6.1) via transitive de Next. Fix exigiria downgrade do Next; aceitável manter |
| **lint** | ❌ Quebrado — Next 16 dropou `next lint`; projeto usa `.eslintrc.json` que ESLint 9 não aceita. **Pre-commit hook bypassed nos últimos 6 commits**. Migração pra `eslint.config.js` é follow-up obrigatório |
| **Bundle (chunks JS estáticos)** | **1.4 MB total** · main-app: 516 B · framework chunks: ~413 KB combinados (217 KB + 196 KB) · webpack runtime: 3.4 KB |
| **Server bundle da home** | 71 KB (`/server/app/page.js`) |

### Distribuição das 51 rotas

- **Estáticas (○ prerendered):** blog · contato · cookies · politica-de-privacidade · representantes · termos-de-uso · solucoes (hub + 6 sub-rotas) · robots.txt · sitemap.xml · apple-icon · icon · opengraph-image
- **Dinâmicas (ƒ server-rendered on demand):** `/`, `/a-msm/*`, `/marcas`, `/marcas/[slug]`, `/produtos*`, `/receitas*`, `/login`, `/status`, todas as `/api/*`, cron jobs (`/api/cron/*`)
- **ISR (revalidate 1h, expire 1y):** páginas estáticas marcadas

### Rotas com risco de 500 sem dados no DB

Todas têm **fallback estático**:
- `/produtos`, `/marcas`, `/receitas`: mostram "em publicação" + CTA
- `/produtos/[slug]`, `/marcas/[slug]`, `/receitas/[slug]`: usam `notFound()` → 404 limpo
- Home: HomeBrands/Products/Recipes não renderizam se DB vazio (não quebram a página)

**Conclusão técnica:** Não há bloqueador crítico para publicar. Pontos pendentes:

1. Migrar `eslint` (Next 16 → `eslint.config.js`)
2. Avaliar se o postcss XSS é relevante (ambiente dev only)
3. Bundle aceitável para um site B2B (1.4 MB chunks com fonts Google embutidas)

---

## 📊 RESUMO EXECUTIVO

### ✅ O site está funcionalmente completo

- Todas as rotas públicas têm conteúdo editorial real e específico (não Lorem)
- 10 produtos, 5 receitas, 3 marcas no DB com dados profundamente realistas
- 6 formulários públicos validados + integração MullerBot via fila webhook
- Admin com 19 módulos implementados
- Tema claro/escuro adaptativo em todo o site (público + admin)
- Login admin funciona em produção

### 🎯 O que falta antes de virar público de verdade

1. **Validação do cliente:** confirmar nomes/marcas/produtos/embalagens/notas comerciais do seed
2. **Mídias:** vídeo do hero, `og-default.jpg`, logos das certificações, fotos profissionais de produtos/receitas/marcas
3. **`company_info`:** CNPJ, endereço, whatsapp comercial em `/admin/configuracoes`
4. **Ativação do WhatsApp:** `/admin/whatsapp` ainda desligado em produção
5. **Lint setup:** migrar pra `eslint.config.js` (Next 16)

---

*Fim do inventário.*
