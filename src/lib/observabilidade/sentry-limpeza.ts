import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// =============================================================================
// O QUE NÃO PODE SAIR DAQUI — e o que NÃO pode ser destruído no caminho.
//
// Erro de aplicação carrega o contexto do erro junto, e neste site o contexto é
// lead e pedido: nome, e-mail, WhatsApp, CPF/CNPJ, endereço de entrega. Mandar
// isso pro Sentry é exportar dado pessoal de cliente pra um terceiro. É LGPD, e
// é irreversível: o que subiu, subiu.
//
// A defesa tem duas camadas:
//   1. `sendDefaultPii: false` na init — o SDK não anexa corpo, cookie nem IP
//   2. este arquivo — varre o evento e apaga o que reconhece
//
// A camada 2 existe porque a 1 protege o que o SDK COLETA sozinho, não o que o
// nosso código coloca no erro: `Falha ao entregar lead joao@empresa.com.br`
// passa pela primeira e é pega aqui.
//
// ⛔ E TEM UM SEGUNDO RISCO, IGUALMENTE GRAVE: limpar demais.
//
// A primeira versão comparava nome de campo por "contém", e `exCEPtion` contém
// `cep` — então o evento chegava com `"exception": "[redigido]"`. Erro sem
// exceção e sem pilha é erro inútil: o Sentry mostraria uma lista de nada, e
// ninguém descobriria até o dia de precisar de um rastro. Achado interceptando
// o envio de verdade; o código compilava e o teste de unidade passava.
//
// Daí as duas regras que este arquivo segue:
//   • nome de campo casa por IGUALDADE, nunca por "contém"
//   • a estrutura do evento (exception, stacktrace, message, contexts do SDK)
//     é PRESERVADA — o que se limpa é o TEXTO dentro dela
// =============================================================================

/**
 * Campos que carregam dado de cliente. Comparação por IGUALDADE, sem caixa —
 * `cep` não pode pegar `exception`, `name` não pode pegar `server_name`.
 */
const CAMPOS_SENSIVEIS = new Set([
  // pessoa
  'email',
  'e-mail',
  'mail',
  'nome',
  'name',
  'nome_completo',
  'whatsapp',
  'telefone',
  'phone',
  'documento',
  'cpf',
  'cnpj',
  // endereço de entrega
  'endereco',
  'address',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  // texto escrito pelo visitante (costuma trazer nome e telefone dentro)
  'message',
  'mensagem',
  'resumo',
  'excerpt',
  // segredo
  'token',
  'secret',
  'senha',
  'password',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'x-api-key',
  'captcha_token',
]);

/**
 * Subárvores que o SDK monta sozinho. Dentro delas a limpeza por NOME DE CAMPO
 * é desligada — só o texto é limpo.
 *
 * Sem isso, `contexts.runtime.name` ("node") e `contexts.os.name` ("Windows")
 * virariam [redigido], porque `name` é campo sensível de lead. Perder isso é
 * perder em qual runtime e em qual sistema o erro aconteceu — metade do valor
 * de um relatório de erro.
 *
 * ⚠️ `breadcrumbs` e `extra` FICAM DE FORA desta lista de propósito: eles
 * carregam dado que o NOSSO código coloca, e é exatamente ali que um lead
 * inteiro pode aparecer.
 */
const SUBARVORES_DO_SDK = new Set(['exception', 'contexts', 'sdk', 'modules', 'threads']);

/**
 * Chaves de estrutura que nunca são redigidas em si — só o conteúdo é limpo.
 * Sem elas, `message` (campo de lead E campo do Sentry) apagaria a mensagem
 * do erro.
 */
const ESTRUTURA_DO_EVENTO = new Set([
  'exception',
  'values',
  'stacktrace',
  'frames',
  'threads',
  'breadcrumbs',
  'contexts',
  'sdk',
  'modules',
  'tags',
  'extra',
  'request',
]);

const REDIGIDO = '[redigido]';

/**
 * Limpa dado pessoal que aparece SOLTO no meio de um texto — o caso que a
 * varredura por nome de campo não alcança.
 *
 * ⚠️ Os padrões são conservadores de propósito. A primeira versão casava
 * qualquer sequência de 10-11 dígitos e corrompia id de rastreamento e número
 * de amostragem do próprio Sentry. Telefone agora exige formato (parênteses,
 * separador ou DDI) e CPF/CNPJ exige a máscara ou fronteira de palavra.
 */
/**
 * Segredo viajando em URL — `?secret=…`, `?token=…`.
 *
 * ⚠️ Este padrão nasceu de um furo REAL, achado em 09/09 pela sessão do app:
 * o segredo do webhook do Tiny era um segmento da URL, e **todo lugar que
 * ecoava a URL publicava o segredo** — resposta, log e contexto do Sentry.
 * O filtro deles estava limpo; o vazamento entrou pelo caminho.
 *
 * O site tem o mesmo formato em `/api/blog/revalidar`, que aceita
 * `BLOG_REVALIDATE_SECRET` por header **ou** por query. Se aquela rota
 * estourasse tendo sido chamada com `?secret=`, o valor vinha junto no evento.
 *
 * O nome do parâmetro é PRESERVADO de propósito: saber que veio um `secret=`
 * ajuda a entender a chamada; o que não pode viajar é o valor.
 */
const SEGREDO_EM_URL =
  /(^|[?&#])((?:secret|segredo|token|access_token|refresh_token|key|apikey|api_key|password|senha|auth|signature|sig)=)[^&\s#"']*/gi;

export function limparTexto(txt: string): string {
  return (
    txt
      .replace(SEGREDO_EM_URL, `$1$2${REDIGIDO}`)
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, REDIGIDO)
      // (11) 99999-0000 · 11 99999-0000 · +55 11 99999 0000 — sempre com forma
      .replace(/(?:\+?55[\s.-]?)?\(\d{2}\)[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g, REDIGIDO)
      .replace(/(?:\+?55[\s.-])?\b\d{2}[\s.-]\d{4,5}[\s.-]\d{4}\b/g, REDIGIDO)
      // CPF e CNPJ mascarados
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, REDIGIDO)
      .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, REDIGIDO)
  );
}

/**
 * Percorre o evento. Profundidade limitada: evento do Sentry tem referência
 * circular e árvore funda.
 */
function limpar(valor: unknown, profundidade = 0, dentroDoSdk = false): unknown {
  if (profundidade > 8) return valor;
  if (typeof valor === 'string') return limparTexto(valor);
  if (Array.isArray(valor)) return valor.map((v) => limpar(v, profundidade + 1, dentroDoSdk));
  if (valor && typeof valor === 'object') {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      const chave = k.toLowerCase();
      const sdkAqui = dentroDoSdk || SUBARVORES_DO_SDK.has(chave);
      if (ESTRUTURA_DO_EVENTO.has(chave) || sdkAqui) {
        // Estrutura do Sentry: preserva a forma, limpa só o texto de dentro.
        saida[k] = limpar(v, profundidade + 1, sdkAqui);
      } else if (CAMPOS_SENSIVEIS.has(chave)) {
        saida[k] = REDIGIDO;
      } else {
        saida[k] = limpar(v, profundidade + 1, dentroDoSdk);
      }
    }
    return saida;
  }
  return valor;
}

/**
 * Ruído que não é problema do site e só gasta cota: extensão de navegador,
 * tradutor automático, e o aviso de loop do ResizeObserver, que o próprio
 * Chrome emite sem nada estar quebrado.
 */
const RUIDO = [
  /ResizeObserver loop/i,
  /chrome-extension:/i,
  /moz-extension:/i,
  /Non-Error promise rejection captured/i,
];

export function limparEvento(evento: ErrorEvent, hint?: EventHint): ErrorEvent | null {
  const mensagem =
    evento.exception?.values?.[0]?.value ?? evento.message ?? String(hint?.originalException ?? '');
  if (RUIDO.some((r) => r.test(mensagem))) return null;

  // O corpo da requisição NUNCA vai — é onde mora o lead inteiro.
  if (evento.request) {
    delete evento.request.data;
    delete evento.request.cookies;
    // A query string carrega UTM (ok), mas também pode carregar e-mail em link
    // de descadastro — e SEGREDO, em rota que aceita `?secret=`. Limpa como
    // texto, que agora cobre os dois.
    if (typeof evento.request.query_string === 'string') {
      evento.request.query_string = limparTexto(evento.request.query_string);
    }
    // A URL vem separada da query string no evento do Sentry, e o SDK muitas
    // vezes monta a URL COMPLETA aqui. Limpar só a query deixava o segredo
    // passar pelo outro campo — foi assim que o furo do Tiny sobreviveu a um
    // filtro que parecia certo.
    if (typeof evento.request.url === 'string') {
      evento.request.url = limparTexto(evento.request.url);
    }
    if (evento.request.headers) {
      for (const k of Object.keys(evento.request.headers)) {
        if (CAMPOS_SENSIVEIS.has(k.toLowerCase())) evento.request.headers[k] = REDIGIDO;
      }
    }
  }

  return limpar(evento) as ErrorEvent;
}
