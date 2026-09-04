-- =============================================================================
-- RESTORE do rodapé do site MSM (food) — apagado em 04/09/2026
--
-- As 23 linhas de `footer_links` eram o rodapé do site MSM antigo, herdado no
-- seed inicial do Supabase da Somatec: /a-msm/*, /receitas/*,
-- /produtos/categoria/* e 6 pra /solucoes/*, que não existe mais.
--
-- Nunca apareceram no site: as 5 colunas em `footer_columns` estão inativas, e
-- `getFooterData` (src/app/layout.tsx) cai no FOOTER_COLUMNS do código quando
-- a consulta volta vazia. Mas bastava alguém ativar uma coluna pra o rodapé da
-- Somatec exibir o negócio de outra empresa.
--
-- Apagadas com autorização do Léo. Este arquivo existe só pra o DELETE não ser
-- irreversível — não é pra rodar, e restaurar traz o problema de volta.
-- =============================================================================

insert into footer_links (id, column_id, label, href, is_external, open_in_new_tab, display_order, active) values
  ('cccccccc-0001-0001-0000-000000000001','bbbbbbbb-0001-0000-0000-000000000001','Quem somos','/a-msm/quem-somos',false,false,1,false),
  ('cccccccc-0001-0001-0000-000000000002','bbbbbbbb-0001-0000-0000-000000000001','Estrutura industrial','/a-msm/estrutura-industrial',false,false,2,false),
  ('cccccccc-0001-0001-0000-000000000003','bbbbbbbb-0001-0000-0000-000000000001','Qualidade e segurança','/a-msm/qualidade-e-seguranca',false,false,3,false),
  ('cccccccc-0001-0001-0000-000000000004','bbbbbbbb-0001-0000-0000-000000000001','Marcas','/marcas',false,false,4,false),
  ('cccccccc-0001-0002-0000-000000000001','bbbbbbbb-0001-0000-0000-000000000002','Todos os produtos','/produtos',false,false,1,false),
  ('cccccccc-0001-0002-0000-000000000002','bbbbbbbb-0001-0000-0000-000000000002','Molhos e Condimentos','/produtos/categoria/molhos-e-condimentos',false,false,2,false),
  ('cccccccc-0001-0002-0000-000000000003','bbbbbbbb-0001-0000-0000-000000000002','Óleos e Gorduras','/produtos/categoria/oleos-e-gorduras',false,false,3,false),
  ('cccccccc-0001-0002-0000-000000000004','bbbbbbbb-0001-0000-0000-000000000002','Linha Premium','/produtos/categoria/linha-premium',false,false,4,false),
  ('cccccccc-0001-0003-0000-000000000001','bbbbbbbb-0001-0000-0000-000000000003','Food Service','/solucoes/food-service',false,false,1,false),
  ('cccccccc-0001-0003-0000-000000000002','bbbbbbbb-0001-0000-0000-000000000003','B2B','/solucoes/b2b',false,false,2,false),
  ('cccccccc-0001-0003-0000-000000000003','bbbbbbbb-0001-0000-0000-000000000003','Terceirização','/solucoes/terceirizacao-de-producao',false,false,3,false),
  ('cccccccc-0001-0003-0000-000000000004','bbbbbbbb-0001-0000-0000-000000000003','Envase','/solucoes/envase',false,false,4,false),
  ('cccccccc-0001-0003-0000-000000000005','bbbbbbbb-0001-0000-0000-000000000003','Marcas Próprias','/solucoes/marcas-proprias',false,false,5,false),
  ('cccccccc-0001-0003-0000-000000000006','bbbbbbbb-0001-0000-0000-000000000003','Distribuição','/solucoes/distribuicao',false,false,6,false),
  ('cccccccc-0001-0004-0000-000000000001','bbbbbbbb-0001-0000-0000-000000000004','Todas as receitas','/receitas',false,false,1,false),
  ('cccccccc-0001-0004-0000-000000000002','bbbbbbbb-0001-0000-0000-000000000004','Massas e Pizzas','/receitas/categoria/massas-e-pizzas',false,false,2,false),
  ('cccccccc-0001-0004-0000-000000000003','bbbbbbbb-0001-0000-0000-000000000004','Pratos Principais','/receitas/categoria/pratos-principais',false,false,3,false),
  ('cccccccc-0001-0004-0000-000000000004','bbbbbbbb-0001-0000-0000-000000000004','Acompanhamentos e Molhos','/receitas/categoria/acompanhamentos-e-molhos',false,false,4,false),
  ('cccccccc-0001-0005-0000-000000000001','bbbbbbbb-0001-0000-0000-000000000005','Fale com o comercial','/contato',false,false,1,false),
  ('cccccccc-0001-0005-0000-000000000002','bbbbbbbb-0001-0000-0000-000000000005','Seja um representante','/representantes',false,false,2,false),
  ('cccccccc-0001-0005-0000-000000000003','bbbbbbbb-0001-0000-0000-000000000005','Política de privacidade','/politica-de-privacidade',false,false,3,false),
  ('cccccccc-0001-0005-0000-000000000004','bbbbbbbb-0001-0000-0000-000000000005','Termos de uso','/termos-de-uso',false,false,4,false),
  ('cccccccc-0001-0005-0000-000000000005','bbbbbbbb-0001-0000-0000-000000000005','Cookies','/cookies',false,false,5,false);
