/**
 * Conteúdo placeholder seguro para a home (v1.0 §9).
 * NÃO inventar certificações, números de clientes, anos, capacidade ou liderança.
 * Tom profissional, B2B, institucional.
 */

export const HERO_FALLBACK = {
  eyebrow: 'MasterBlock · Supressor de surtos',
  title: 'O surto que destrói seu equipamento opera em 100 kHz',
  subtitle:
    'O DPS comum atua só até 10 kHz. O MasterBlock é a única proteção que age na frequência do dano — instalada nas maiores indústrias do Brasil.',
  // ⛔ Era "Receba um diagnóstico de risco" — a medição prévia que a Somatec
  // parou de fazer em 20/08. ⚠️ Este arquivo é só FALLBACK: o rótulo que
  // aparece na tela vem de `home_hero.primary_cta_label` no Supabase. Mudar
  // aqui e não lá não muda nada pro visitante.
  primary: { label: 'Falar com a engenharia', href: '/contato' },
  secondary: { label: 'Conheça o MasterBlock', href: '/produtos' },
  fallback_image_url: null as string | null,
  // Hero estático, sem vídeo. Para usar vídeo, cadastrar em Admin → Home → Hero.
  video_url: null as string | null,
} as const;

// Indicadores institucionais — NÃO inventar números (v1.0 §9)
// Apenas categorias institucionais. Quando admin preencher home_indicators, vira dado real.
//
// ⛔ Este bloco era do site MSM (food): "Food Service · Operações
// profissionais", "B2B · Indústrias, redes e atacadistas", "Atendimento
// Nacional · Entregas para todo o Brasil". Nada disso é Somatec, e como é
// FALLBACK, bastava a tabela `home_indicators` ficar vazia pra a home da
// Somatec exibir o negócio de outra empresa. Hoje o banco tem dado e isso não
// aparece — mas era uma bomba armada, não um texto velho.
//
// Trocado pelas categorias reais, na divisão que o Léo definiu em 04/09:
// industrial e não-industrial, e só Master Block.
export const INDICATORS_FALLBACK = [
  { label: 'Indústria', description: 'Master Block por locação' },
  { label: 'Comércio', description: 'Compra direta, sem representante' },
  { label: 'Residência', description: 'Compra direta, sem representante' },
  { label: 'Atendimento nacional', description: 'Entregas para todo o Brasil' },
] as const;
