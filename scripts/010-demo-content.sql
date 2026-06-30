-- =============================================================================
-- MSM — Seed de conteúdo de demonstração
--
-- Popula o site com dados realistas mas genéricos para demo/preview enquanto
-- não há conteúdo final do cliente. NÃO inventa números (volumes, ano de
-- fundação, certificações específicas, marcas de terceiros).
--
-- Idempotente: usa UUIDs determinísticos (gerados via md5) + ON CONFLICT.
-- Re-rodar não duplica; atualizar conteúdo aqui e re-rodar atualiza no banco.
--
-- Imagens: picsum.photos (placeholder neutro). Trocar por uploads reais via
-- /admin/midias quando disponíveis.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) PRODUCT CATEGORIES (5)
-- -----------------------------------------------------------------------------

INSERT INTO product_categories (id, name, slug, description, image_url, display_order, status, robots_index, robots_follow)
VALUES
  ('11111111-0001-0000-0000-000000000001', 'Molhos e Condimentos', 'molhos-e-condimentos',
   'Molhos prontos, temperos e bases para cozinhas profissionais. Padrão consistente em qualquer escala.',
   'https://picsum.photos/seed/cat-molhos/1200/800', 1, 'published', true, true),
  ('11111111-0001-0000-0000-000000000002', 'Óleos e Gorduras', 'oleos-e-gorduras',
   'Óleos vegetais, azeites e gorduras vegetais com especificações ajustáveis ao processo de cada cliente.',
   'https://picsum.photos/seed/cat-oleos/1200/800', 2, 'published', true, true),
  ('11111111-0001-0000-0000-000000000003', 'Laticínios e Cremes', 'laticinios-e-cremes',
   'Cremes culinários, leites e laticínios estabilizados para food service e indústria.',
   'https://picsum.photos/seed/cat-laticinios/1200/800', 3, 'published', true, true),
  ('11111111-0001-0000-0000-000000000004', 'Cereais e Massas', 'cereais-e-massas',
   'Bases secas, farinhas e massas em embalagens dimensionadas para alto volume.',
   'https://picsum.photos/seed/cat-cereais/1200/800', 4, 'published', true, true),
  ('11111111-0001-0000-0000-000000000005', 'Linha Premium', 'linha-premium',
   'Produtos de alto valor agregado para chefs e operações que diferenciam pela experiência.',
   'https://picsum.photos/seed/cat-premium/1200/800', 5, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description,
  image_url = EXCLUDED.image_url, display_order = EXCLUDED.display_order,
  status = EXCLUDED.status, robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 2) PRODUCT APPLICATIONS (4)
-- -----------------------------------------------------------------------------

INSERT INTO product_applications (id, name, slug, description, image_url, display_order, status, robots_index, robots_follow)
VALUES
  ('22222222-0001-0000-0000-000000000001', 'Pizzarias', 'pizzarias',
   'Soluções pensadas para o ritmo da pizzaria — rendimento consistente, sabor que aguenta o forno e o delivery.',
   'https://picsum.photos/seed/app-pizza/1200/800', 1, 'published', true, true),
  ('22222222-0001-0000-0000-000000000002', 'Hamburguerias', 'hamburguerias',
   'Bases e finalizações para hamburguerias artesanais e redes — padrão e sabor em qualquer combo.',
   'https://picsum.photos/seed/app-burger/1200/800', 2, 'published', true, true),
  ('22222222-0001-0000-0000-000000000003', 'Cozinhas Industriais', 'cozinhas-industriais',
   'Para refeições coletivas, hospitais, escolas e indústrias — eficiência de processo e custo previsível.',
   'https://picsum.photos/seed/app-industrial/1200/800', 3, 'published', true, true),
  ('22222222-0001-0000-0000-000000000004', 'Padarias e Confeitarias', 'padarias-e-confeitarias',
   'Bases, recheios e coberturas para padarias artesanais e confeitarias de alto giro.',
   'https://picsum.photos/seed/app-bakery/1200/800', 4, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description,
  image_url = EXCLUDED.image_url, display_order = EXCLUDED.display_order,
  status = EXCLUDED.status, robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 3) BRANDS (3)
-- -----------------------------------------------------------------------------

INSERT INTO brands (id, name, slug, short_description, full_description, logo_url, cover_image_url, positioning, target_audience, categories, featured, display_order, status, robots_index, robots_follow)
VALUES
  ('33333333-0001-0000-0000-000000000001', 'Cocina', 'cocina',
   'Linha premium para cozinhas profissionais que valorizam consistência e sabor.',
   E'Cocina é a linha desenvolvida para chefs e operações que entendem que ingrediente faz diferença. '
   'Cada produto é formulado para entregar resultado estável em alto volume — do molho que não talha no '
   'rechaud ao óleo que aguenta sucessivas frituras sem alterar o perfil sensorial. Use Cocina onde a '
   'expectativa do cliente final é alta e a operação não pode falhar.',
   'https://picsum.photos/seed/brand-cocina-logo/400/400',
   'https://picsum.photos/seed/brand-cocina-cover/1600/900',
   'Premium para food service exigente',
   'Chefs, restaurantes médio-alto e operações que diferenciam pela experiência',
   '["Molhos e Condimentos","Óleos e Gorduras","Linha Premium"]'::jsonb,
   true, 1, 'published', true, true),

  ('33333333-0001-0000-0000-000000000002', 'Massa Brasil', 'massa-brasil',
   'Bases, massas e cereais para operações de alto volume.',
   E'Massa Brasil é a linha pensada para quem opera no volume — redes, refeições coletivas, indústria. '
   'Embalagens dimensionadas para reduzir manuseio e desperdício, com especificações estáveis que cabem '
   'em qualquer ficha técnica. O custo por porção é previsível e a qualidade é constante de lote a lote.',
   'https://picsum.photos/seed/brand-massa-logo/400/400',
   'https://picsum.photos/seed/brand-massa-cover/1600/900',
   'Eficiência e escala para alto volume',
   'Redes de food service, refeições coletivas, indústria alimentícia',
   '["Cereais e Massas","Molhos e Condimentos"]'::jsonb,
   true, 2, 'published', true, true),

  ('33333333-0001-0000-0000-000000000003', 'Naturale', 'naturale',
   'Linha de produtos com clean label e foco em alimentação consciente.',
   E'Naturale atende quem busca menos aditivos, mais ingredientes reconhecíveis na embalagem. Pensada '
   'para operações que querem comunicar autenticidade — restaurantes naturais, padarias artesanais, '
   'redes saudáveis. Sem comprometer a estabilidade de produção exigida pelo mercado profissional.',
   'https://picsum.photos/seed/brand-naturale-logo/400/400',
   'https://picsum.photos/seed/brand-naturale-cover/1600/900',
   'Clean label para o mercado consciente',
   'Restaurantes naturais, redes saudáveis, padarias artesanais',
   '["Óleos e Gorduras","Laticínios e Cremes","Linha Premium"]'::jsonb,
   true, 3, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug,
  short_description = EXCLUDED.short_description, full_description = EXCLUDED.full_description,
  logo_url = EXCLUDED.logo_url, cover_image_url = EXCLUDED.cover_image_url,
  positioning = EXCLUDED.positioning, target_audience = EXCLUDED.target_audience,
  categories = EXCLUDED.categories, featured = EXCLUDED.featured, display_order = EXCLUDED.display_order,
  status = EXCLUDED.status, robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 4) PRODUCTS (10)
-- -----------------------------------------------------------------------------

INSERT INTO products (id, name, slug, brand_id, category_id, short_description, full_description, main_image_url, packaging_summary, commercial_notes, featured, display_order, status, robots_index, robots_follow)
VALUES
  ('44444444-0001-0000-0000-000000000001', 'Molho de Tomate Especial Cocina', 'molho-tomate-especial-cocina',
   '33333333-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000001',
   'Molho de tomate com sabor encorpado e textura estável sob calor prolongado.',
   E'Desenvolvido para pizzarias e cozinhas que precisam de molho que mantém estrutura no rechaud e no '
   'forno. Equilíbrio entre acidez e doçura natural do tomate, com notas suaves de manjericão.',
   'https://picsum.photos/seed/prod-molho-tomate/1200/1200',
   'Pouch 2kg · Bag-in-box 10kg', 'Pedido mínimo 50kg. Entrega regular em ciclos de 15 dias para SP/RJ/MG.',
   true, 1, 'published', true, true),

  ('44444444-0001-0000-0000-000000000002', 'Molho Branco Culinário Cocina', 'molho-branco-culinario-cocina',
   '33333333-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000001',
   'Base de molho branco pronta para finalização — só aquecer e ajustar o ponto.',
   E'Reduz tempo de preparo no service mantendo o sabor caseiro. Estável a reaquecimento sem talhar.',
   'https://picsum.photos/seed/prod-molho-branco/1200/1200',
   'Pouch 1kg · Bag 5kg', 'Disponível em três níveis de gordura. Solicite a ficha técnica para o seu cardápio.',
   true, 2, 'published', true, true),

  ('44444444-0001-0000-0000-000000000003', 'Óleo Vegetal Profissional', 'oleo-vegetal-profissional',
   '33333333-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000002',
   'Óleo vegetal estabilizado para frituras prolongadas e processo industrial.',
   E'Resistência térmica acima da média do mercado, mantém ponto de fumaça constante por mais ciclos. '
   'Embalagem otimizada para reduzir tempo de troca na produção.',
   'https://picsum.photos/seed/prod-oleo/1200/1200',
   'Galão 20L · Bombona 50L', 'Programa de retorno de embalagem disponível em algumas regiões.',
   true, 3, 'published', true, true),

  ('44444444-0001-0000-0000-000000000004', 'Azeite Composto Premium', 'azeite-composto-premium',
   '33333333-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000005',
   'Azeite composto com notas premium para finalização e pratos quentes.',
   E'Equilíbrio de azeite de oliva e óleo refinado para chegar no perfil sensorial e custo certos para '
   'food service de médio-alto padrão.',
   'https://picsum.photos/seed/prod-azeite/1200/1200',
   'Garrafa 500ml · Lata 5L', 'Indicado para cozinhas que servem o produto direto na mesa.',
   false, 4, 'published', true, true),

  ('44444444-0001-0000-0000-000000000005', 'Creme de Leite Culinário', 'creme-de-leite-culinario',
   '33333333-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000003',
   'Creme de leite estabilizado para preparos quentes — não talha, mantém brilho.',
   E'Formulação culinária pensada para chef. Aguenta acidez de tomate, vinho branco, limão sem perder '
   'estrutura. Ideal para finalizações e bases de molhos.',
   'https://picsum.photos/seed/prod-creme/1200/1200',
   'Pouch 1L · Bag 5L', 'Validade 6 meses sob refrigeração após abertura.',
   true, 5, 'published', true, true),

  ('44444444-0001-0000-0000-000000000006', 'Farinha de Trigo Especial', 'farinha-trigo-especial',
   '33333333-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000004',
   'Farinha especial para massas com glúten controlado e absorção previsível.',
   E'Especificação ajustada para pizza, pão e massas frescas. Lote a lote o resultado é o mesmo — sem '
   'surpresa na fermentação.',
   'https://picsum.photos/seed/prod-farinha/1200/1200',
   'Saco 25kg · Big bag 1t',
   'Análise técnica acompanha o pedido. Especificação customizável para volumes acima de 5 toneladas/mês.',
   false, 6, 'published', true, true),

  ('44444444-0001-0000-0000-000000000007', 'Massa para Pizza Pré-Pronta', 'massa-pizza-pre-pronta',
   '33333333-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000004',
   'Disco de massa pré-pronto congelado — só abrir e finalizar.',
   E'Reduz o tempo de produção da pizzaria sem comprometer textura artesanal. Fermentação natural antes '
   'do congelamento.',
   'https://picsum.photos/seed/prod-massa-pizza/1200/1200',
   'Disco 30cm · Caixa com 20 unidades',
   'Logística refrigerada inclusa para entregas regionais.',
   false, 7, 'published', true, true),

  ('44444444-0001-0000-0000-000000000008', 'Tempero Completo Industrial', 'tempero-completo-industrial',
   '33333333-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000001',
   'Mix de temperos seco para uso direto em processos industriais e cozinhas de alto volume.',
   E'Solução ágil para padronizar sabor em refeições coletivas. Sem corantes artificiais.',
   'https://picsum.photos/seed/prod-tempero/1200/1200',
   'Saco 5kg · Saco 25kg', 'Customização de blend disponível para contratos acima de 1 tonelada/mês.',
   false, 8, 'published', true, true),

  ('44444444-0001-0000-0000-000000000009', 'Óleo de Coco Natural', 'oleo-coco-natural',
   '33333333-0001-0000-0000-000000000003', '11111111-0001-0000-0000-000000000002',
   'Óleo de coco prensado a frio, sem refino químico — clean label.',
   E'Para operações que destacam ingredientes naturais. Aromático e estável em preparos a média temperatura.',
   'https://picsum.photos/seed/prod-coco/1200/1200',
   'Pote 500g · Balde 5kg', 'Certificado de origem disponível mediante solicitação.',
   true, 9, 'published', true, true),

  ('44444444-0001-0000-0000-000000000010', 'Creme Vegetal Naturale', 'creme-vegetal-naturale',
   '33333333-0001-0000-0000-000000000003', '11111111-0001-0000-0000-000000000003',
   'Alternativa vegetal cremosa para substituir nata em preparos veganos e plant-based.',
   E'Funcional em molhos quentes e frios. Não contém ingredientes de origem animal nem aditivos sintéticos '
   'controversos.',
   'https://picsum.photos/seed/prod-vegetal/1200/1200',
   'Pouch 1L', 'Validade estendida de 9 meses pré-abertura, refrigeração não obrigatória.',
   false, 10, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, brand_id = EXCLUDED.brand_id, category_id = EXCLUDED.category_id,
  short_description = EXCLUDED.short_description, full_description = EXCLUDED.full_description,
  main_image_url = EXCLUDED.main_image_url, packaging_summary = EXCLUDED.packaging_summary,
  commercial_notes = EXCLUDED.commercial_notes, featured = EXCLUDED.featured,
  display_order = EXCLUDED.display_order, status = EXCLUDED.status,
  robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 5) PRODUCT_APPLICATION_LINKS (associa produtos a aplicações)
-- -----------------------------------------------------------------------------

INSERT INTO product_application_links (product_id, application_id) VALUES
  -- Molho de tomate → Pizzarias, Cozinhas Industriais
  ('44444444-0001-0000-0000-000000000001', '22222222-0001-0000-0000-000000000001'),
  ('44444444-0001-0000-0000-000000000001', '22222222-0001-0000-0000-000000000003'),
  -- Molho branco → Cozinhas Industriais
  ('44444444-0001-0000-0000-000000000002', '22222222-0001-0000-0000-000000000003'),
  -- Óleo → Hamburguerias, Cozinhas Industriais
  ('44444444-0001-0000-0000-000000000003', '22222222-0001-0000-0000-000000000002'),
  ('44444444-0001-0000-0000-000000000003', '22222222-0001-0000-0000-000000000003'),
  -- Azeite → Pizzarias
  ('44444444-0001-0000-0000-000000000004', '22222222-0001-0000-0000-000000000001'),
  -- Creme → Cozinhas Industriais, Padarias
  ('44444444-0001-0000-0000-000000000005', '22222222-0001-0000-0000-000000000003'),
  ('44444444-0001-0000-0000-000000000005', '22222222-0001-0000-0000-000000000004'),
  -- Farinha → Padarias, Pizzarias
  ('44444444-0001-0000-0000-000000000006', '22222222-0001-0000-0000-000000000004'),
  ('44444444-0001-0000-0000-000000000006', '22222222-0001-0000-0000-000000000001'),
  -- Massa pizza → Pizzarias
  ('44444444-0001-0000-0000-000000000007', '22222222-0001-0000-0000-000000000001'),
  -- Tempero → Cozinhas Industriais, Hamburguerias
  ('44444444-0001-0000-0000-000000000008', '22222222-0001-0000-0000-000000000003'),
  ('44444444-0001-0000-0000-000000000008', '22222222-0001-0000-0000-000000000002')
ON CONFLICT (product_id, application_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6) RECIPE CATEGORIES (3)
-- -----------------------------------------------------------------------------

INSERT INTO recipe_categories (id, name, slug, description, image_url, display_order, status, robots_index, robots_follow)
VALUES
  ('55555555-0001-0000-0000-000000000001', 'Massas e Pizzas', 'massas-e-pizzas',
   'Receitas com massas frescas, pizzas e preparos italianos.',
   'https://picsum.photos/seed/rec-cat-massa/1200/800', 1, 'published', true, true),
  ('55555555-0001-0000-0000-000000000002', 'Pratos Principais', 'pratos-principais',
   'Carnes, aves, peixes e preparos completos para o cardápio do dia.',
   'https://picsum.photos/seed/rec-cat-pratos/1200/800', 2, 'published', true, true),
  ('55555555-0001-0000-0000-000000000003', 'Acompanhamentos e Molhos', 'acompanhamentos-e-molhos',
   'Bases, finalizações e acompanhamentos para complementar pratos.',
   'https://picsum.photos/seed/rec-cat-acomp/1200/800', 3, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description,
  image_url = EXCLUDED.image_url, display_order = EXCLUDED.display_order,
  status = EXCLUDED.status, robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 7) RECIPES (5)
-- -----------------------------------------------------------------------------

INSERT INTO recipes (id, title, slug, category_id, short_description, introduction, image_url, prep_time, cook_time, total_time, yield_text, ingredients, instructions, chef_notes, application_context, featured, display_order, status, robots_index, robots_follow)
VALUES
  ('66666666-0001-0000-0000-000000000001', 'Pizza Margherita Profissional', 'pizza-margherita-profissional',
   '55555555-0001-0000-0000-000000000001',
   'Margherita clássica adaptada para o ritmo da pizzaria.',
   E'Receita pensada para padronizar o preparo na pizzaria sem perder o caráter artesanal. Funciona bem '
   'em forno a lenha e elétrico — basta ajustar a temperatura.',
   'https://picsum.photos/seed/recipe-margherita/1200/800',
   '15 min', '8 min', '23 min', '1 pizza 30cm',
   '[{"id":"i1","name":"Disco de massa para pizza","quantity":"1","unit":"unidade","notes":null,"product_id":"44444444-0001-0000-0000-000000000007"},{"id":"i2","name":"Molho de tomate especial","quantity":"80","unit":"g","notes":"camada uniforme","product_id":"44444444-0001-0000-0000-000000000001"},{"id":"i3","name":"Mussarela ralada","quantity":"120","unit":"g","notes":null,"product_id":null},{"id":"i4","name":"Folhas de manjericão","quantity":"6","unit":"folhas","notes":"acrescentar após assar","product_id":null},{"id":"i5","name":"Azeite composto","quantity":"q.b.","unit":"","notes":"fio para finalizar","product_id":"44444444-0001-0000-0000-000000000004"}]'::jsonb,
   '[{"step":1,"text":"Pré-aqueça o forno a 280°C. Coloque a pedra ou bandeja perfurada dentro.","image_url":null,"tip":null},{"step":2,"text":"Espalhe 80g do molho em camada uniforme deixando 1cm de borda.","image_url":null,"tip":"Não exagere no molho — encharcar a massa atrapalha a finalização."},{"step":3,"text":"Distribua a mussarela em pedaços médios. Asse por 8 min até a borda dourar.","image_url":null,"tip":null},{"step":4,"text":"Retire do forno, acrescente o manjericão e finalize com fio de azeite.","image_url":null,"tip":null}]'::jsonb,
   'Para uso em forno a lenha entre 380-420°C, reduza o tempo para 90 segundos.',
   'Cardápio fixo de pizzaria',
   true, 1, 'published', true, true),

  ('66666666-0001-0000-0000-000000000002', 'Risoto de Cogumelos Cremoso', 'risoto-de-cogumelos-cremoso',
   '55555555-0001-0000-0000-000000000002',
   'Risoto encorpado com cogumelos frescos e finalização com creme.',
   E'Versão direta de risoto de cogumelos para o serviço — pré-cozimento parcial do arroz permite finalizar '
   'rapidamente no pedido.',
   'https://picsum.photos/seed/recipe-risoto/1200/800',
   '20 min', '25 min', '45 min', '4 porções',
   '[{"id":"i1","name":"Arroz arbóreo","quantity":"320","unit":"g","notes":null,"product_id":null},{"id":"i2","name":"Mix de cogumelos frescos","quantity":"300","unit":"g","notes":"shimeji, paris, portobello","product_id":null},{"id":"i3","name":"Caldo de legumes","quantity":"1,2","unit":"L","notes":"quente","product_id":null},{"id":"i4","name":"Creme de leite culinário","quantity":"100","unit":"ml","notes":"para finalizar","product_id":"44444444-0001-0000-0000-000000000005"},{"id":"i5","name":"Vinho branco seco","quantity":"100","unit":"ml","notes":null,"product_id":null},{"id":"i6","name":"Cebola brunoise","quantity":"1","unit":"unidade","notes":null,"product_id":null},{"id":"i7","name":"Parmesão ralado","quantity":"60","unit":"g","notes":null,"product_id":null}]'::jsonb,
   '[{"step":1,"text":"Refogue cebola em azeite até transparente. Acrescente os cogumelos e doure.","image_url":null,"tip":null},{"step":2,"text":"Adicione o arroz e tosque por 1 minuto. Despeje o vinho branco e mexa até evaporar.","image_url":null,"tip":null},{"step":3,"text":"Vá adicionando o caldo quente concha a concha, mexendo constantemente, até o ponto al dente.","image_url":null,"tip":"Trabalhe sempre com caldo quente — caldo frio interrompe o cozimento."},{"step":4,"text":"Fora do fogo, acrescente o creme de leite e o parmesão. Mexa vigorosamente para encrespar.","image_url":null,"tip":null}]'::jsonb,
   'Para serviço a la carte, pré-cozinhe o arroz até 70% no início do turno e finalize no pedido.',
   'A la carte ou refeição executiva',
   true, 2, 'published', true, true),

  ('66666666-0001-0000-0000-000000000003', 'Frango Grelhado com Ervas', 'frango-grelhado-com-ervas',
   '55555555-0001-0000-0000-000000000002',
   'Peito de frango marinado e grelhado, finalizado com molho de ervas.',
   E'Padrão para refeição executiva e marmita gourmet. Marinada simples potencializa sabor sem aditivos.',
   'https://picsum.photos/seed/recipe-frango/1200/800',
   '10 min + 2h marinada', '12 min', '2h 22min', '4 porções',
   '[{"id":"i1","name":"Peito de frango","quantity":"4","unit":"unidades","notes":"~180g cada","product_id":null},{"id":"i2","name":"Tempero completo industrial","quantity":"20","unit":"g","notes":null,"product_id":"44444444-0001-0000-0000-000000000008"},{"id":"i3","name":"Óleo vegetal","quantity":"30","unit":"ml","notes":null,"product_id":"44444444-0001-0000-0000-000000000003"},{"id":"i4","name":"Limão","quantity":"1","unit":"unidade","notes":"suco","product_id":null},{"id":"i5","name":"Salsinha picada","quantity":"q.b.","unit":"","notes":"finalização","product_id":null}]'::jsonb,
   '[{"step":1,"text":"Misture tempero, óleo e suco de limão. Esfregue no frango e deixe marinar 2h refrigerado.","image_url":null,"tip":null},{"step":2,"text":"Aqueça a chapa em fogo alto. Grelhe 5-6 min cada lado, virando uma vez.","image_url":null,"tip":"Não fique virando — deixe selar de um lado antes de virar."},{"step":3,"text":"Descanse 3 min antes de servir. Finalize com salsinha.","image_url":null,"tip":null}]'::jsonb,
   'Quentinha gourmet: corte em medalhões antes de finalizar com molho.',
   'Refeição executiva e quentinha',
   false, 3, 'published', true, true),

  ('66666666-0001-0000-0000-000000000004', 'Macarrão ao Pomodoro', 'macarrao-ao-pomodoro',
   '55555555-0001-0000-0000-000000000001',
   'Receita rápida de macarrão com molho de tomate fresco — clássico do almoço.',
   E'Solução para volume — usa molho pronto como base e ganha frescor com tomate cereja e manjericão.',
   'https://picsum.photos/seed/recipe-pomodoro/1200/800',
   '5 min', '15 min', '20 min', '4 porções',
   '[{"id":"i1","name":"Macarrão (espaguete ou penne)","quantity":"400","unit":"g","notes":null,"product_id":null},{"id":"i2","name":"Molho de tomate especial","quantity":"500","unit":"g","notes":null,"product_id":"44444444-0001-0000-0000-000000000001"},{"id":"i3","name":"Tomate cereja","quantity":"200","unit":"g","notes":"cortado ao meio","product_id":null},{"id":"i4","name":"Manjericão","quantity":"q.b.","unit":"","notes":null,"product_id":null},{"id":"i5","name":"Azeite composto","quantity":"30","unit":"ml","notes":null,"product_id":"44444444-0001-0000-0000-000000000004"}]'::jsonb,
   '[{"step":1,"text":"Cozinhe o macarrão em água salgada al dente. Reserve 1 concha da água.","image_url":null,"tip":null},{"step":2,"text":"Em uma frigideira ampla, aqueça o azeite e refogue rapidamente o tomate cereja por 2 min.","image_url":null,"tip":null},{"step":3,"text":"Adicione o molho e a água do macarrão. Acrescente a massa escorrida e misture.","image_url":null,"tip":null},{"step":4,"text":"Finalize com manjericão rasgado fora do fogo.","image_url":null,"tip":null}]'::jsonb,
   'Vegetariana naturalmente. Para versão proteica, adicione frango desfiado ou ricota fresca.',
   'Almoço executivo',
   false, 4, 'published', true, true),

  ('66666666-0001-0000-0000-000000000005', 'Molho Branco Base com Cogumelos', 'molho-branco-base-com-cogumelos',
   '55555555-0001-0000-0000-000000000003',
   'Variação de molho branco com cogumelos — versátil para massas, carnes e gratinados.',
   E'Aplicação direta para chef que quer ganhar tempo no service usando uma base estável e adicionar '
   'protagonismo com o cogumelo na hora.',
   'https://picsum.photos/seed/recipe-molho-cogumelos/1200/800',
   '5 min', '10 min', '15 min', '500ml',
   '[{"id":"i1","name":"Molho branco culinário","quantity":"400","unit":"ml","notes":null,"product_id":"44444444-0001-0000-0000-000000000002"},{"id":"i2","name":"Cogumelos paris fatiados","quantity":"200","unit":"g","notes":null,"product_id":null},{"id":"i3","name":"Manteiga","quantity":"20","unit":"g","notes":null,"product_id":null},{"id":"i4","name":"Vinho branco seco","quantity":"60","unit":"ml","notes":null,"product_id":null},{"id":"i5","name":"Tomilho fresco","quantity":"q.b.","unit":"","notes":null,"product_id":null}]'::jsonb,
   '[{"step":1,"text":"Derreta a manteiga e refogue os cogumelos até dourar. Despeje o vinho e reduza metade.","image_url":null,"tip":null},{"step":2,"text":"Acrescente o molho branco e o tomilho. Cozinhe em fogo baixo por 5 min.","image_url":null,"tip":"Mexa sempre — molho branco gruda facilmente em fogo alto."},{"step":3,"text":"Ajuste o sal e pimenta. Sirva imediatamente.","image_url":null,"tip":null}]'::jsonb,
   'Combina com gnocchi, fettuccine ou para gratinar peito de frango.',
   'Cardápio executivo e a la carte',
   true, 5, 'published', true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, category_id = EXCLUDED.category_id,
  short_description = EXCLUDED.short_description, introduction = EXCLUDED.introduction,
  image_url = EXCLUDED.image_url, prep_time = EXCLUDED.prep_time, cook_time = EXCLUDED.cook_time,
  total_time = EXCLUDED.total_time, yield_text = EXCLUDED.yield_text,
  ingredients = EXCLUDED.ingredients, instructions = EXCLUDED.instructions,
  chef_notes = EXCLUDED.chef_notes, application_context = EXCLUDED.application_context,
  featured = EXCLUDED.featured, display_order = EXCLUDED.display_order, status = EXCLUDED.status,
  robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 8) BANNERS (4)
-- -----------------------------------------------------------------------------

INSERT INTO banners (id, title, subtitle, description, location, route_path, desktop_image_url, mobile_image_url, cta_label, cta_url, overlay_style, display_order, active)
VALUES
  ('77777777-0001-0000-0000-000000000001',
   'Soluções para Food Service',
   'Linha completa para cozinhas profissionais',
   'Produtos formulados para o ritmo do serviço — estabilidade, sabor consistente, custo previsível.',
   'home', NULL,
   'https://picsum.photos/seed/banner-foodservice/1920/720',
   'https://picsum.photos/seed/banner-foodservice-m/800/1000',
   'Ver soluções', '/solucoes/food-service', 'dark', 1, true),

  ('77777777-0001-0000-0000-000000000002',
   'Terceirização Industrial',
   'Sua marca, nossa fábrica',
   'Desenvolva sua linha com estrutura industrial pronta — do conceito ao envase, com qualidade auditada.',
   'home', NULL,
   'https://picsum.photos/seed/banner-terceirizacao/1920/720',
   'https://picsum.photos/seed/banner-terceirizacao-m/800/1000',
   'Falar com a equipe', '/solucoes/terceirizacao-de-producao', 'dark', 2, true),

  ('77777777-0001-0000-0000-000000000003',
   'Distribuição B2B',
   'Logística eficiente em todo o Brasil',
   'Programa de abastecimento para redes e distribuidores com janela de entrega previsível.',
   'home', NULL,
   'https://picsum.photos/seed/banner-distribuicao/1920/720',
   'https://picsum.photos/seed/banner-distribuicao-m/800/1000',
   'Conhecer programa', '/solucoes/distribuicao', 'gold', 3, true),

  ('77777777-0001-0000-0000-000000000004',
   'Marcas Próprias',
   'Desenvolvemos sua marca completa',
   'Da formulação ao produto pronto — atende redes, importadores e operações que querem ter linha exclusiva.',
   'home', NULL,
   'https://picsum.photos/seed/banner-marcasproprias/1920/720',
   'https://picsum.photos/seed/banner-marcasproprias-m/800/1000',
   'Saber mais', '/solucoes/marcas-proprias', 'dark', 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  location = EXCLUDED.location, route_path = EXCLUDED.route_path,
  desktop_image_url = EXCLUDED.desktop_image_url, mobile_image_url = EXCLUDED.mobile_image_url,
  cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url, overlay_style = EXCLUDED.overlay_style,
  display_order = EXCLUDED.display_order, active = EXCLUDED.active, updated_at = now();

-- -----------------------------------------------------------------------------
-- 9) HOME HERO (1 ativo)
-- -----------------------------------------------------------------------------

INSERT INTO home_hero (id, title, subtitle, description, fallback_image_url, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, overlay_opacity, active)
VALUES
  ('88888888-0001-0000-0000-000000000001',
   'Indústria, marcas e soluções para o mercado food service e B2B',
   'MSM Alimentos',
   'Qualidade, inovação e escala para impulsionar negócios.',
   'https://picsum.photos/seed/home-hero/1920/1080',
   'Conheça nossos produtos', '/produtos',
   'Fale com o comercial', '/contato',
   0.55, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  fallback_image_url = EXCLUDED.fallback_image_url,
  primary_cta_label = EXCLUDED.primary_cta_label, primary_cta_url = EXCLUDED.primary_cta_url,
  secondary_cta_label = EXCLUDED.secondary_cta_label, secondary_cta_url = EXCLUDED.secondary_cta_url,
  overlay_opacity = EXCLUDED.overlay_opacity, active = EXCLUDED.active, updated_at = now();

-- -----------------------------------------------------------------------------
-- 10) HOME SLIDER ITEMS (4)
-- -----------------------------------------------------------------------------

INSERT INTO home_slider_items (id, title, subtitle, description, image_url, cta_label, cta_url, display_order, transition_seconds, active)
VALUES
  ('99999999-0001-0000-0000-000000000001',
   'Food Service', 'Solução Comercial',
   'Soluções práticas e saborosas para o dia a dia de cozinhas profissionais.',
   'https://picsum.photos/seed/slider-foodservice/1200/900',
   'Conheça', '/solucoes/food-service', 1, 7, true),

  ('99999999-0001-0000-0000-000000000002',
   'Marcas Próprias', 'Solução Comercial',
   'Desenvolvimento completo de marcas exclusivas com nossa estrutura.',
   'https://picsum.photos/seed/slider-marcas/1200/900',
   'Conheça', '/solucoes/marcas-proprias', 2, 7, true),

  ('99999999-0001-0000-0000-000000000003',
   'Terceirização', 'Solução Comercial',
   'Produção com qualidade, segurança e flexibilidade — você projeta, nós produzimos.',
   'https://picsum.photos/seed/slider-terceirizacao/1200/900',
   'Conheça', '/solucoes/terceirizacao-de-producao', 3, 7, true),

  ('99999999-0001-0000-0000-000000000004',
   'Envase', 'Solução Industrial',
   'Estrutura moderna e tecnologia para diferentes formatos de embalagem.',
   'https://picsum.photos/seed/slider-envase/1200/900',
   'Conheça', '/solucoes/envase', 4, 7, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  image_url = EXCLUDED.image_url, cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url,
  display_order = EXCLUDED.display_order, transition_seconds = EXCLUDED.transition_seconds,
  active = EXCLUDED.active, updated_at = now();

-- -----------------------------------------------------------------------------
-- 11) HOME CTA CARDS (5 — segmentos)
-- -----------------------------------------------------------------------------

INSERT INTO home_cta_cards (id, title, description, interest_type, button_label, button_url, display_order, active)
VALUES
  ('aaaaaaaa-0001-0000-0000-000000000001',
   'Food Service',
   'Cozinhas profissionais que precisam de padrão e escala.',
   'food_service', 'Conhecer linha', '/solucoes/food-service', 1, true),

  ('aaaaaaaa-0001-0000-0000-000000000002',
   'B2B',
   'Indústria e redes — qualidade e custo previsível em alto volume.',
   'b2b', 'Falar com a equipe', '/solucoes/b2b', 2, true),

  ('aaaaaaaa-0001-0000-0000-000000000003',
   'Terceirização',
   'Produção sob medida com a nossa estrutura industrial.',
   'terceirizacao', 'Saber mais', '/solucoes/terceirizacao-de-producao', 3, true),

  ('aaaaaaaa-0001-0000-0000-000000000004',
   'Marcas Próprias',
   'Desenvolvemos sua marca completa — formulação ao envase.',
   'marcas_proprias', 'Conhecer programa', '/solucoes/marcas-proprias', 4, true),

  ('aaaaaaaa-0001-0000-0000-000000000005',
   'Distribuição',
   'Logística B2B com janela de entrega em todo o Brasil.',
   'distribuicao', 'Falar com a equipe', '/solucoes/distribuicao', 5, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, interest_type = EXCLUDED.interest_type,
  button_label = EXCLUDED.button_label, button_url = EXCLUDED.button_url,
  display_order = EXCLUDED.display_order, active = EXCLUDED.active, updated_at = now();
