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
// Este campo separa CLIENTE de CANDIDATO A REPRESENTANTE — não separa público.
// Quem é o visitante sai do campo seguinte ("Você está buscando proteção
// para": indústria / comércio / residência).
//
// ⛔ O rótulo do cliente dizia "Diagnóstico para a minha indústria" e brigava
// com o campo de baixo: quem ia marcar "Comércio" ou "Residência" tinha de
// declarar antes que era indústria. E "diagnóstico" era a oferta INDUSTRIAL —
// oferecê-la a dono de casa furava a regra de ouro.
//
// ⛔ Desde 20/08 a oferta industrial NÃO é mais diagnóstico/medição na planta:
// é PERÍODO DE AVALIAÇÃO sem risco (60 a 90 dias), com a prova medida pelo
// software depois do contrato fechado. Não existe medição antes do contrato.
//
// A frase agora diz o que a pessoa QUER, não em que categoria ela se encaixa —
// mesma regra das mensagens de WhatsApp. O `value` continua 'b2b' de
// propósito: é contrato com a API e com o roteamento do Betinna.
export const INTEREST_TYPE_OPTIONS = [
  { value: 'b2b', label: 'Quero proteger meus equipamentos' },
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
