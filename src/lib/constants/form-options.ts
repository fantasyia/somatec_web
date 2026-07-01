export const BR_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

// Valores mantidos iguais aos literais validados em schemas.ts / mullerbot;
// apenas os rótulos foram adaptados ao contexto Somatec (proteção/energia).
export const INTEREST_TYPE_OPTIONS = [
  { value: 'b2b', label: 'Diagnóstico para a minha indústria' },
  { value: 'representante', label: 'Quero ser representante / parceiro' },
] as const;

export const OPERATION_TYPE_OPTIONS = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cozinha_industrial', label: 'Cozinha industrial' },
  { value: 'rede_food_service', label: 'Rede de food service' },
  { value: 'padaria', label: 'Padaria / Confeitaria' },
  { value: 'hotel', label: 'Hotelaria' },
  { value: 'outro', label: 'Outro' },
] as const;
