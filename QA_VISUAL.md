# QA Visual — Relatório

> Passe de QA visual no site **em produção** (`site-msm-production.up.railway.app`),
> navegando o Chrome real (screenshots + DOM + console). Foco: **páginas públicas, desktop**.
> Gerado em 2026-06-02. Todos os bugs de código abaixo já foram corrigidos e estão no ar.

## Método e escopo
- **Onde:** produção (Railway), tema dark e light.
- **Como:** navegação real, screenshots, leitura de DOM/texto, verificação do console JS, teste de interações (hover, accordion, modal, ESC).
- **Cobertura:** Fase 1 — páginas públicas. (Fase 2 — admin — não executada: exige login.)
- **Limitação:** **mobile não testável** nesta ferramenta (a janela do Chrome ficou travada em 1920px; o viewport não encolheu). Responsivo validado só por código (breakpoints Tailwind `lg:` + menu hamburger).

---

## ✅ Telas e funções validadas

| Tela / função | Status | Observações |
|---|---|---|
| Home — **dark mode** | ✅ | Premium, consistente |
| Home — **light mode** (toggle) | ✅ | Contraste correto em todas as seções |
| Hero | ⚠️→✅ | Mostrava placeholder de admin (corrigido — ver #1). Falta mídia (conteúdo) |
| Slider de soluções (4 slides) | ✅ | Setas + indicadores de progresso |
| Indicadores / Certificações / Footer | ✅ | Footer com 5 colunas completas |
| **Mega-menu Soluções** (hover) | ✅ | Abre grid 3×2 com ícones — fix de hover confirmado no ar |
| A MSM + Quem somos / Estrutura industrial / Qualidade e segurança | ✅ | Conteúdo institucional real e bem escrito |
| Produtos (grid + filtros categoria/marca) | ✅ | Cards 4:5, eyebrow de marca |
| Produto — detalhe | ✅ | Descrição, embalagem, **notas comerciais reais** (pedido mínimo, ciclos) |
| **Modal "Solicitar amostra"** | ✅ | Abre com overlay, campos completos, **fecha no ESC** |
| Marcas (index) + detalhe (Cocina) | ✅ | Posicionamento, público-alvo, portfólio |
| Soluções — sub-página + **FAQ accordion** | ✅ | Expande/colapsa, chevron gira, cor no ativo |
| Receitas (index) + detalhe (Pizza Margherita) | ✅ | Tempos, ingredientes com gramatura, passos com dicas |
| Contato (formulário) | ✅ | Visual; submit/validação fica p/ teste dedicado |
| Representantes (formulário) | ✅ | UF com todos os estados, honeypot, consentimento LGPD |
| Termos de Uso / Política de Privacidade | ✅ | Conteúdo legal completo; agora indexáveis |
| **404** | ✅ | Redesign premium (bússola, watermark, 3 CTAs) |
| Console JS | ✅ | **Sem erros nem exceções** |

---

## 🐛 Bugs encontrados no QA e **já corrigidos**

| # | Achado | Causa | Correção | Commit |
|---|---|---|---|---|
| 1 | Hero exibia **placeholder de admin** ("Cadastre a URL no painel admin…") no site público — ilegível no light mode | Bloco de instruções renderizava sempre que não havia vídeo | Removido; sem mídia, a metade direita fica só com o gradiente. Orientação de cadastro só no admin | `85df83c` |
| 4 | Eyebrow **"PARA TERCEIRIZACAO"** (sem ç/ã) no card "Fale conosco" da home | Usava o slug `interest_type` como label | Mapa `EYEBROW_BY_INTEREST` → "Terceirização" | `85df83c` |
| 5 | Title duplicado **"… \| MSM Alimentos · MSM Alimentos"** nas 6 soluções | `title` já tinha "\| MSM Alimentos" + template global "· MSM Alimentos" | Removido o sufixo manual dos 6 titles | `85df83c` |
| 6 | **Fade-up "piscava"** seção em branco em scroll muito rápido | `useInView` disparava só com 15% visível e sem antecedência | `threshold 0` + `rootMargin` antecipa 96px; fade começa antes da seção dominar a tela | `8bbec8d` |

> O **mega-menu de Soluções** (bug de hover relatado antes) também foi validado no ar e está funcionando (fix `d4c4c44`).

---

## 📋 Pendências — dependem de você (conteúdo/mídia, não são bugs)

| Item | Detalhe | Onde resolver |
|---|---|---|
| **Fotos reais** | Produtos **e receitas** usam paisagens genéricas (folha, estrada, floresta) ou estão sem imagem. **Maior gap visual do site.** | Subir as fotos reais nos produtos/receitas via admin |
| **Marcas "EM BREVE"** | A home tem 3 slots de marca vazios ("EM BREVE") | Cadastrar mais marcas ou reduzir os slots |
| **Mídia do hero** | Sem vídeo/imagem, o hero fica "pela metade" (fallback agora é limpo, mas vazio à direita) | Cadastrar em Admin → Home → Hero |
| **Datas legais** | Termos e Privacidade dizem "Última atualização: maio de 2025" | Atualizar a data antes do go-live |
| **Mobile** | Não testável nesta ferramenta | Validar no navegador: **F12 → modo dispositivo** (iPhone/Android) |

---

## Não coberto nesta passagem
Variações de templates já validados — listagens filtradas (produtos por categoria/marca/aplicação; receitas por categoria/produto), página de blog ("em breve"), política de cookies. Usam os mesmos componentes (PageHero, grid de cards, accordion) já checados.

## Fase 2 — Admin (pendente)
Passe visual nos módulos do `/admin` (só navegação/leitura, sem alterar dados) — requer login. Quando quiser, é só logar no Chrome conectado e avisar.

---

### Resumo
Site público **sólido**: conteúdo real e bem escrito, dark/light corretos, navegação/menus/modais/accordion funcionando, zero erro de console. Os 4 bugs encontrados foram **corrigidos no mesmo passe**. O que falta para o go-live visual é **mídia real** (fotos de produto/receita e do hero) — tarefa de conteúdo, sua.
