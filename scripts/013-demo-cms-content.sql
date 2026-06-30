-- =============================================================================
-- MSM — Seed CMS content (G.3)
--
-- Popula tabelas que estavam vazias e impactavam testes visuais no admin:
--   - home_indicators (4)
--   - solutions (6 — replica as 6 paginas estaticas pra admin ter conteudo)
--   - pages (4 — A MSM hub + 3 sub-paginas)
--   - navigation_items (8 — header)
--   - footer_columns (5) + footer_links (~25)
--
-- Idempotente: ON CONFLICT (id) DO UPDATE.
-- Re-rodar nao duplica; mexer no SQL e re-rodar atualiza.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) HOME INDICATORS (4)
-- -----------------------------------------------------------------------------
-- Sem numeros inventados (regra v1.0 §9). Foco em categorias institucionais.

INSERT INTO home_indicators (id, main_text, description, internal_note, display_order, active)
VALUES
  ('77777777-0001-0000-0000-000000000001', 'Indústria', 'Estrutura produtiva própria',
   'Substituir por valor real quando cliente confirmar (ex: m² de planta).', 1, true),
  ('77777777-0001-0000-0000-000000000002', 'Food Service', 'Operações profissionais',
   NULL, 2, true),
  ('77777777-0001-0000-0000-000000000003', 'B2B', 'Indústrias, redes e atacadistas',
   NULL, 3, true),
  ('77777777-0001-0000-0000-000000000004', 'Atendimento Nacional', 'Entregas para todo o Brasil',
   'Confirmar com a equipe comercial se cobertura é mesmo nacional.', 4, true)
ON CONFLICT (id) DO UPDATE SET
  main_text = EXCLUDED.main_text, description = EXCLUDED.description,
  internal_note = EXCLUDED.internal_note, display_order = EXCLUDED.display_order,
  active = EXCLUDED.active, updated_at = now();

-- -----------------------------------------------------------------------------
-- 2) SOLUTIONS (6) — replica as 6 paginas estaticas em /solucoes/*
-- -----------------------------------------------------------------------------
-- Hoje as paginas /solucoes/{slug} sao 100% estaticas. Esse seed cria registros
-- no DB pra que o admin tenha conteudo pra editar quando o cliente quiser
-- ajustar. Frontend continua usando os arquivos estaticos por enquanto.

INSERT INTO solutions (id, title, slug, route_path, short_description, full_content, benefits,
                       cta_label, cta_url, form_interest_type, status, display_order,
                       robots_index, robots_follow)
VALUES
  ('88888888-0001-0000-0000-000000000001', 'Food Service', 'food-service', '/solucoes/food-service',
   'Insumos industriais para cozinhas profissionais — formulações consistentes, embalagens otimizadas e abastecimento regular.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Produtos para cozinhas profissionais", "description": "Formulações e embalagens pensadas para operação em escala, com rendimento previsível e padronização de sabor."},
     {"icon_url": null, "title": "Formatos adequados para a operação", "description": "Embalagens bulk e formatos industriais que facilitam o trabalho da cozinha, reduzem desperdício e otimizam o estoque."},
     {"icon_url": null, "title": "Regularidade de abastecimento", "description": "Cadência de entrega planejada para garantir que sua operação nunca fique sem insumos essenciais."},
     {"icon_url": null, "title": "Suporte técnico e comercial", "description": "Equipe disponível para auxiliar na escolha dos produtos certos, cálculo de rendimento e adequação às necessidades."}
   ]'::jsonb,
   'Solicitar contato', '/contato#food_service', 'food_service', 'published', 1, true, true),

  ('88888888-0001-0000-0000-000000000002', 'B2B', 'b2b', '/solucoes/b2b',
   'Fornecimento industrial B2B para indústrias, redes atacadistas e distribuidores.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Escala para grandes volumes", "description": "Capacidade produtiva dimensionada para atender pedidos B2B com regularidade."},
     {"icon_url": null, "title": "Qualidade rastreável", "description": "Documentação técnica completa por lote, com controles de qualidade e laudos."},
     {"icon_url": null, "title": "Catálogo técnico", "description": "Especificações detalhadas dos produtos para integração ao processo do cliente."},
     {"icon_url": null, "title": "Relacionamento comercial direto", "description": "Atendimento sem intermediários, com canais diretos para negociação e suporte."}
   ]'::jsonb,
   'Solicitar proposta B2B', '/contato#b2b', 'b2b', 'published', 2, true, true),

  ('88888888-0001-0000-0000-000000000003', 'Terceirização de Produção', 'terceirizacao-de-producao',
   '/solucoes/terceirizacao-de-producao',
   'Produza sua marca com a infraestrutura industrial MSM — da análise da formulação à entrega.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Estrutura pronta", "description": "Planta industrial certificada — sem necessidade de investimento próprio."},
     {"icon_url": null, "title": "Flexibilidade de formulação", "description": "Adaptação de receitas e processos para atender especificações."},
     {"icon_url": null, "title": "Documentação completa", "description": "Fichas técnicas, laudos e registros por lote."},
     {"icon_url": null, "title": "Controle de qualidade incluso", "description": "Mesmos controles aplicados aos produtos próprios MSM."}
   ]'::jsonb,
   'Solicitar avaliação', '/contato#terceirizacao', 'terceirizacao', 'published', 3, true, true),

  ('88888888-0001-0000-0000-000000000004', 'Envase', 'envase', '/solucoes/envase',
   'Serviço de envase terceirizado com controle de pesagem, rotulagem e vedação.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Diferentes formatos", "description": "Sachês, pouches, garrafas, bag-in-box e galões."},
     {"icon_url": null, "title": "Pesagem de precisão", "description": "Controle de gramagem dentro das especificações do cliente."},
     {"icon_url": null, "title": "Rotulagem e identificação", "description": "Aplicação de rótulos e códigos de lote/validade."},
     {"icon_url": null, "title": "Controle de vedação", "description": "Verificação de estanqueidade e qualidade do fechamento."}
   ]'::jsonb,
   'Solicitar avaliação', '/contato#envase', 'envase', 'published', 4, true, true),

  ('88888888-0001-0000-0000-000000000005', 'Marcas Próprias', 'marcas-proprias',
   '/solucoes/marcas-proprias',
   'Desenvolva e produza sua marca própria com a estrutura industrial MSM.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Produção industrial completa", "description": "Da formulação ao produto acabado, com toda a infraestrutura."},
     {"icon_url": null, "title": "Flexibilidade de identidade", "description": "Rótulo, embalagem e apresentação personalizados."},
     {"icon_url": null, "title": "Escala sob demanda", "description": "Volumes ajustáveis à evolução do negócio."},
     {"icon_url": null, "title": "Portfólio diversificado", "description": "Diferentes linhas sob a mesma marca, aproveitando a versatilidade da planta."}
   ]'::jsonb,
   'Falar sobre marcas próprias', '/contato#terceirizacao', 'marcas_proprias', 'published', 5, true, true),

  ('88888888-0001-0000-0000-000000000006', 'Distribuição', 'distribuicao', '/solucoes/distribuicao',
   'Distribuição estruturada de produtos MSM em todo o Brasil.',
   '{}'::jsonb,
   '[
     {"icon_url": null, "title": "Cobertura nacional", "description": "Atendimento a distribuidores e parceiros em diferentes regiões."},
     {"icon_url": null, "title": "Planejamento de entrega", "description": "Programação de pedidos e prazos alinhados ao ciclo do cliente."},
     {"icon_url": null, "title": "Controle de estoque", "description": "Gestão de picking e expedição organizada."},
     {"icon_url": null, "title": "Parceiros logísticos", "description": "Rede de transportadoras e operadores selecionados."}
   ]'::jsonb,
   'Contato comercial', '/contato#b2b', 'distribuicao', 'published', 6, true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, route_path = EXCLUDED.route_path,
  short_description = EXCLUDED.short_description, benefits = EXCLUDED.benefits,
  cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url,
  form_interest_type = EXCLUDED.form_interest_type, status = EXCLUDED.status,
  display_order = EXCLUDED.display_order, robots_index = EXCLUDED.robots_index,
  robots_follow = EXCLUDED.robots_follow, updated_at = now();

-- -----------------------------------------------------------------------------
-- 3) PAGES (4) — A MSM hub + 3 sub-paginas
-- -----------------------------------------------------------------------------

INSERT INTO pages (id, title, slug, route_path, page_type, status, hero_title, hero_subtitle,
                   content, seo_title, seo_description, robots_index, robots_follow)
VALUES
  ('99999999-0001-0000-0000-000000000001', 'A MSM', 'a-msm', '/a-msm', 'institutional', 'published',
   'A MSM',
   'Indústria, qualidade e parceria',
   '{}'::jsonb,
   'A MSM | MSM Alimentos',
   'Indústria alimentícia voltada ao B2B com produção, envase, marcas próprias e soluções comerciais em todo o Brasil.',
   true, true),

  ('99999999-0001-0000-0000-000000000002', 'Quem somos', 'quem-somos', '/a-msm/quem-somos', 'institutional', 'published',
   'Quem somos',
   'Uma indústria alimentícia construída sobre rigor técnico, parcerias de longo prazo e compromisso com a qualidade.',
   '{}'::jsonb,
   'Quem somos | MSM Alimentos',
   'Conheça a história, o propósito e os valores que orientam a atuação da MSM no mercado B2B alimentício.',
   true, true),

  ('99999999-0001-0000-0000-000000000003', 'Estrutura industrial', 'estrutura-industrial',
   '/a-msm/estrutura-industrial', 'institutional', 'published',
   'Estrutura industrial',
   'Infraestrutura produtiva e tecnológica dimensionada para atender o mercado B2B com escala e controle de processo.',
   '{}'::jsonb,
   'Estrutura industrial | MSM Alimentos',
   'Linhas de produção, controle de processo, rastreabilidade e logística integrada para volumes B2B.',
   true, true),

  ('99999999-0001-0000-0000-000000000004', 'Qualidade e segurança', 'qualidade-e-seguranca',
   '/a-msm/qualidade-e-seguranca', 'institutional', 'published',
   'Qualidade e segurança alimentar',
   'Processos estruturados de controle de qualidade e segurança alimentar em todas as etapas da produção.',
   '{}'::jsonb,
   'Qualidade e segurança | MSM Alimentos',
   'Controle de entrada, análises laboratoriais, pontos críticos e rastreabilidade — segurança como prioridade estrutural.',
   true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, route_path = EXCLUDED.route_path,
  page_type = EXCLUDED.page_type, status = EXCLUDED.status,
  hero_title = EXCLUDED.hero_title, hero_subtitle = EXCLUDED.hero_subtitle,
  seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
  robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 4) NAVIGATION ITEMS (8) — header menu principal
-- -----------------------------------------------------------------------------

INSERT INTO navigation_items (id, label, href, location, display_order, active, is_external, open_in_new_tab)
VALUES
  ('aaaaaaaa-0001-0000-0000-000000000001', 'A MSM', '/a-msm', 'header', 1, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000002', 'Marcas', '/marcas', 'header', 2, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000003', 'Produtos', '/produtos', 'header', 3, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000004', 'Soluções', '/solucoes', 'header', 4, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000005', 'Receitas', '/receitas', 'header', 5, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000006', 'Blog', '/blog', 'header', 6, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000007', 'Contato', '/contato', 'header', 7, true, false, false),
  ('aaaaaaaa-0001-0000-0000-000000000008', 'Área do Representante', '/login', 'header_cta', 1, true, false, false)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, href = EXCLUDED.href, location = EXCLUDED.location,
  display_order = EXCLUDED.display_order, active = EXCLUDED.active,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 5) FOOTER COLUMNS (5) + FOOTER LINKS (24)
-- -----------------------------------------------------------------------------

INSERT INTO footer_columns (id, title, display_order, active)
VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'A MSM', 1, true),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'Produtos', 2, true),
  ('bbbbbbbb-0001-0000-0000-000000000003', 'Soluções', 3, true),
  ('bbbbbbbb-0001-0000-0000-000000000004', 'Receitas', 4, true),
  ('bbbbbbbb-0001-0000-0000-000000000005', 'Contato', 5, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, display_order = EXCLUDED.display_order,
  active = EXCLUDED.active, updated_at = now();

INSERT INTO footer_links (id, column_id, label, href, display_order, active, is_external, open_in_new_tab)
VALUES
  -- Coluna "A MSM"
  ('cccccccc-0001-0001-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'Quem somos', '/a-msm/quem-somos', 1, true, false, false),
  ('cccccccc-0001-0001-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000001', 'Estrutura industrial', '/a-msm/estrutura-industrial', 2, true, false, false),
  ('cccccccc-0001-0001-0000-000000000003', 'bbbbbbbb-0001-0000-0000-000000000001', 'Qualidade e segurança', '/a-msm/qualidade-e-seguranca', 3, true, false, false),
  ('cccccccc-0001-0001-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000001', 'Marcas', '/marcas', 4, true, false, false),

  -- Coluna "Produtos"
  ('cccccccc-0001-0002-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000002', 'Todos os produtos', '/produtos', 1, true, false, false),
  ('cccccccc-0001-0002-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000002', 'Molhos e Condimentos', '/produtos/categoria/molhos-e-condimentos', 2, true, false, false),
  ('cccccccc-0001-0002-0000-000000000003', 'bbbbbbbb-0001-0000-0000-000000000002', 'Óleos e Gorduras', '/produtos/categoria/oleos-e-gorduras', 3, true, false, false),
  ('cccccccc-0001-0002-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000002', 'Linha Premium', '/produtos/categoria/linha-premium', 4, true, false, false),

  -- Coluna "Soluções"
  ('cccccccc-0001-0003-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000003', 'Food Service', '/solucoes/food-service', 1, true, false, false),
  ('cccccccc-0001-0003-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000003', 'B2B', '/solucoes/b2b', 2, true, false, false),
  ('cccccccc-0001-0003-0000-000000000003', 'bbbbbbbb-0001-0000-0000-000000000003', 'Terceirização', '/solucoes/terceirizacao-de-producao', 3, true, false, false),
  ('cccccccc-0001-0003-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000003', 'Envase', '/solucoes/envase', 4, true, false, false),
  ('cccccccc-0001-0003-0000-000000000005', 'bbbbbbbb-0001-0000-0000-000000000003', 'Marcas Próprias', '/solucoes/marcas-proprias', 5, true, false, false),
  ('cccccccc-0001-0003-0000-000000000006', 'bbbbbbbb-0001-0000-0000-000000000003', 'Distribuição', '/solucoes/distribuicao', 6, true, false, false),

  -- Coluna "Receitas"
  ('cccccccc-0001-0004-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000004', 'Todas as receitas', '/receitas', 1, true, false, false),
  ('cccccccc-0001-0004-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000004', 'Massas e Pizzas', '/receitas/categoria/massas-e-pizzas', 2, true, false, false),
  ('cccccccc-0001-0004-0000-000000000003', 'bbbbbbbb-0001-0000-0000-000000000004', 'Pratos Principais', '/receitas/categoria/pratos-principais', 3, true, false, false),
  ('cccccccc-0001-0004-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000004', 'Acompanhamentos e Molhos', '/receitas/categoria/acompanhamentos-e-molhos', 4, true, false, false),

  -- Coluna "Contato"
  ('cccccccc-0001-0005-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000005', 'Fale com o comercial', '/contato', 1, true, false, false),
  ('cccccccc-0001-0005-0000-000000000002', 'bbbbbbbb-0001-0000-0000-000000000005', 'Seja um representante', '/representantes', 2, true, false, false),
  ('cccccccc-0001-0005-0000-000000000003', 'bbbbbbbb-0001-0000-0000-000000000005', 'Política de privacidade', '/politica-de-privacidade', 3, true, false, false),
  ('cccccccc-0001-0005-0000-000000000004', 'bbbbbbbb-0001-0000-0000-000000000005', 'Termos de uso', '/termos-de-uso', 4, true, false, false),
  ('cccccccc-0001-0005-0000-000000000005', 'bbbbbbbb-0001-0000-0000-000000000005', 'Cookies', '/cookies', 5, true, false, false)
ON CONFLICT (id) DO UPDATE SET
  column_id = EXCLUDED.column_id, label = EXCLUDED.label, href = EXCLUDED.href,
  display_order = EXCLUDED.display_order, active = EXCLUDED.active,
  updated_at = now();
