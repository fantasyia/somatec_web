// =============================================================================
// INVENTÁRIO DE ARMAZENAMENTO DO SITE — F2-M6 da auditoria de 13/09/2026.
//
// Por que existe: a página `/cookies` afirmava que o site usa "exclusivamente
// cookies técnicos e essenciais", que "não utilizamos cookies de rastreamento"
// e citava uma "preferência de tema (claro/escuro)" que não existe — enquanto o
// banner pedia consentimento e o GTM carregava GA4 e Pixel. Ninguém tinha
// mentido: a página foi escrita uma vez e o código andou sozinho depois.
//
// Este arquivo é a MECÂNICA (o que o código realmente grava). O TEXTO da
// página é da sessão de copy (`/plano-somatec`) — aqui não se escreve política,
// se escreve o fato. `tests/cookies-inventario.test.ts` varre o código atrás de
// chave de armazenamento e reprova a que não estiver listada aqui, pra este
// inventário não envelhecer do mesmo jeito que o texto envelheceu.
// =============================================================================

/** Onde o dado fica. `cookie` vai ao servidor; os demais só existem no
 *  navegador e NUNCA são enviados junto de requisição. */
export type MeioDeArmazenamento = 'cookie' | 'localStorage' | 'sessionStorage';

/** `essencial` = o site quebra sem ele (sessão, segurança, o próprio registro
 *  de consentimento). `funcional` = melhora o serviço sem rastrear pessoa.
 *  `analitico` e `marketing` só existem depois do aceite no banner. */
export type CategoriaDeCookie = 'essencial' | 'funcional' | 'analitico' | 'marketing';

export type ItemDeArmazenamento = {
  /** Chave exata gravada no navegador. `*` marca sufixo variável. */
  nome: string;
  meio: MeioDeArmazenamento;
  categoria: CategoriaDeCookie;
  /** Quem grava. Nome do domínio para terceiros. */
  origem: 'somatec' | 'google' | 'meta';
  /** Em linguagem de gente: pra que serve. */
  finalidade: string;
  /** Quanto tempo dura, já escrito pra leitura humana. */
  retencao: string;
  /** `true` = só é gravado depois do aceite no banner de cookies. */
  exigeConsentimento: boolean;
  /** Arquivo que grava — âncora pra conferir o inventário contra o código. */
  gravadoEm: string;
};

/** Data da última revisão do TEXTO de `/cookies`.
 *
 *  Fica aqui, e não digitada na página, porque a versão anterior dizia "maio de
 *  2025" enquanto descrevia práticas de 2026 — data de revisão escrita à mão em
 *  página jurídica é a primeira coisa que envelhece. */
export const COOKIES_ATUALIZADO_EM = '14 de setembro de 2026';

export const COOKIES_DO_SITE: readonly ItemDeArmazenamento[] = [
  {
    nome: 'sb-*-auth-token',
    meio: 'cookie',
    categoria: 'essencial',
    origem: 'somatec',
    finalidade:
      'Mantém a sessão de quem entra em área restrita. Sem ele não há como saber que a pessoa já se identificou.',
    retencao: 'Enquanto a sessão durar; renovado a cada acesso.',
    exigeConsentimento: false,
    gravadoEm: 'src/lib/supabase/middleware.ts',
  },
  {
    nome: 'stc_attrib',
    meio: 'cookie',
    categoria: 'funcional',
    origem: 'somatec',
    finalidade:
      'Guarda por qual campanha ou canal a pessoa chegou, para que o formulário enviado depois chegue com a origem junto. Não perfila e não vai para terceiros.',
    retencao: '90 dias.',
    exigeConsentimento: false,
    gravadoEm: 'src/lib/attribution.ts',
  },
  {
    nome: 'somatec-cookie-consent',
    meio: 'localStorage',
    categoria: 'essencial',
    origem: 'somatec',
    finalidade:
      'Registra a resposta dada no banner de cookies, com a versão do aviso e a data. É o que impede o banner de perguntar de novo a cada página.',
    retencao: 'Até ser apagado pelo navegador ou até o aviso mudar de versão.',
    exigeConsentimento: false,
    gravadoEm: 'src/lib/consent.ts',
  },
  {
    nome: 'msm-cookie-consent',
    meio: 'localStorage',
    categoria: 'essencial',
    origem: 'somatec',
    finalidade:
      'Chave antiga do mesmo registro, herdada do template de outro cliente. O site apenas LÊ, para não perguntar duas vezes a quem já respondeu; nada novo é gravado nela.',
    retencao: 'Até ser apagada pelo navegador.',
    exigeConsentimento: false,
    gravadoEm: 'src/lib/consent.ts',
  },
  {
    nome: 'stc_interno',
    meio: 'localStorage',
    categoria: 'funcional',
    origem: 'somatec',
    finalidade:
      'Marca o próprio navegador da equipe, para que as visitas de teste não entrem nas métricas do site.',
    retencao: 'Até ser apagado pelo navegador.',
    exigeConsentimento: false,
    gravadoEm: 'src/lib/analytics/trafego-interno.ts',
  },
  {
    nome: 'stc_oferta_checkout',
    meio: 'sessionStorage',
    categoria: 'funcional',
    origem: 'somatec',
    finalidade:
      'Lembra o momento em que a oferta do checkout começou a valer, para o contador da página não reiniciar a cada troca de tela.',
    retencao: 'Até fechar a aba.',
    exigeConsentimento: false,
    gravadoEm: 'src/components/tools/OfertaCheckout.tsx',
  },
  {
    nome: 'stc-sticky-cta-dismissed',
    meio: 'sessionStorage',
    categoria: 'funcional',
    origem: 'somatec',
    finalidade:
      'Lembra que a barra de chamada no rodapé foi fechada, para ela não voltar em cada página da mesma visita.',
    retencao: 'Até fechar a aba.',
    exigeConsentimento: false,
    gravadoEm: 'src/components/layout/StickyCta.tsx',
  },
  {
    nome: '_ga, _ga_*',
    meio: 'cookie',
    categoria: 'analitico',
    origem: 'google',
    finalidade:
      'Google Analytics 4: conta visitas e mede quais páginas levam a contato. Carregado pelo gerenciador de tags e só grava depois do aceite.',
    retencao: 'Até 2 anos.',
    exigeConsentimento: true,
    gravadoEm: 'GTM (Consent Mode)',
  },
  {
    nome: '_fbp, _fbc',
    meio: 'cookie',
    categoria: 'marketing',
    origem: 'meta',
    finalidade:
      'Meta Pixel: liga um anúncio ao contato que ele gerou. Carregado pelo gerenciador de tags e só grava depois do aceite.',
    retencao: 'Até 90 dias.',
    exigeConsentimento: true,
    gravadoEm: 'GTM (Consent Mode)',
  },
] as const;

/** Só o que depende do aceite no banner — é esta lista que precisa bater com o
 *  que o Consent Mode libera. */
export const COOKIES_COM_CONSENTIMENTO = COOKIES_DO_SITE.filter((c) => c.exigeConsentimento);

/** Chaves que o PRÓPRIO código do site grava (sem as de terceiros carregadas
 *  pelo GTM). É contra esta lista que a guarda de teste compara a varredura. */
export const CHAVES_PROPRIAS = COOKIES_DO_SITE.filter((c) => c.origem === 'somatec').map(
  (c) => c.nome,
);

// =============================================================================
// O QUE SAI — e por que a tabela de cima não cobre isto (23/09/2026).
//
// Tudo acima responde "o que fica GUARDADO no navegador". Existe uma segunda
// categoria, que a página tratava como se não existisse: dado que **sai** sem
// nunca ter sido gravado em chave nenhuma.
//
// 🔴 A guarda de `tests/cookies-inventario.test.ts` NÃO pega isso, e não é
// defeito dela: ela varre o código atrás de chave de armazenamento. Aqui não há
// chave — há envio. Cobrir um e achar que cobriu os dois é o jeito de a página
// voltar a ficar desatualizada dizendo a verdade.
//
// ⚠️ E o pior: isto foi ligado num PAINEL (Gerenciador de Eventos da Meta), não
// em commit. Nada no repositório sabe que aconteceu, `git log` não mostra, e
// nenhum teste poderia inferir. Por isso a lista abaixo é declarada À MÃO, e
// mexer em configuração de pixel no painel **obriga** a atualizá-la.
//
// ⛔ NUNCA descrever isto como "anonimizado" ou "não identifica você". O hash é
// exatamente o que permite a Meta reconhecer a pessoa — é pseudonimização, não
// anonimização, e dizer o contrário na página que PEDE consentimento seria
// falso. `tests/dados-enviados.test.ts` reprova esses termos.
// =============================================================================

export type DadoEnviado = {
  /** O que sai, em linguagem de gente. */
  dado: string;
  destino: 'google' | 'meta';
  /** Em que forma sai — hash não é anonimato, e o texto tem de dizer isso. */
  forma: string;
  /** Em que momento sai. */
  quando: string;
  /** `true` = só sai depois do aceite no banner. */
  exigeConsentimento: boolean;
  /** Onde o interruptor VIVE. Painel aqui é aviso: não há commit que registre. */
  ligadoEm: string;
};

export const DADOS_ENVIADOS_A_TERCEIROS: readonly DadoEnviado[] = [
  {
    dado: 'E-mail e telefone digitados em formulário do site',
    destino: 'meta',
    forma:
      'Codificados (hash) no próprio navegador antes de sair. Codificado não é anônimo: é justamente o que permite a Meta reconhecer quem já conhece.',
    quando: 'Quando você preenche e envia um formulário, junto do evento de conversão.',
    exigeConsentimento: true,
    ligadoEm: 'Gerenciador de Eventos da Meta — correspondência avançada automática (23/09/2026)',
  },
  {
    dado: 'Identificador do clique no anúncio e do navegador (fbc, fbp), com IP e navegador usado',
    destino: 'meta',
    forma:
      'Os mesmos códigos que já ficam nos cookies de anúncio, reenviados pelo nosso servidor para a conversão não se perder quando o navegador bloqueia o rastreador.',
    quando: 'Quando um formulário é enviado, um pedido é registrado ou um pagamento é confirmado.',
    exigeConsentimento: false,
    ligadoEm: 'src/lib/meta/capi.ts',
  },
];

/** Só o que depende do aceite — tem de bater com o que o Consent Mode libera. */
export const ENVIOS_COM_CONSENTIMENTO = DADOS_ENVIADOS_A_TERCEIROS.filter(
  (d) => d.exigeConsentimento,
);
