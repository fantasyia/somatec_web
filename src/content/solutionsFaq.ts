import type { AccordionItem } from '@/components/ui/Accordion';

// =============================================================================
// FAQ por solução — CONTEÚDO PLACEHOLDER (Léo revisa/edita).
//
// Perguntas e respostas genéricas e seguras por segmento. NÃO inventam números
// específicos (pedido mínimo, prazos exatos, capacidade) — regra v1.0 §9.
// Quando o cliente confirmar os dados reais, substituir as respostas aqui.
//
// Indexado por slug da solução (= último segmento da rota /solucoes/[slug]).
// =============================================================================

export const SOLUTIONS_FAQ: Record<string, AccordionItem[]> = {
  'food-service': [
    {
      question: 'Qual é o pedido mínimo para food service?',
      answer:
        'O pedido mínimo varia conforme o produto e o formato de embalagem. Nossa equipe comercial apresenta as condições específicas para a sua operação ao entrar em contato.',
    },
    {
      question: 'Vocês entregam em todo o Brasil?',
      answer:
        'Atendemos diferentes regiões do país por meio de logística própria e parceiros. Confirme a disponibilidade para a sua localidade com nossa equipe comercial.',
    },
    {
      question: 'Posso solicitar amostras antes de fechar pedido?',
      answer:
        'Sim. Use o botão "Solicitar amostra" na página do produto desejado ou fale com a equipe comercial para avaliar os itens de interesse.',
    },
    {
      question: 'Os produtos têm padronização entre lotes?',
      answer:
        'Sim. Nossos processos industriais são desenhados para garantir consistência de sabor, textura e rendimento entre lotes — essencial para operações de food service.',
    },
    {
      question: 'Vocês oferecem suporte técnico para a cozinha?',
      answer:
        'Nossa equipe auxilia na escolha dos produtos, cálculo de rendimento e adequação dos formatos à rotina da sua operação.',
    },
    {
      question: 'Como funciona a regularidade de abastecimento?',
      answer:
        'Trabalhamos com cadência de entrega planejada junto ao cliente para evitar rupturas de estoque dos insumos essenciais à operação.',
    },
  ],
  b2b: [
    {
      question: 'Quais volumes a MSM atende?',
      answer:
        'Nossa estrutura é dimensionada para pedidos B2B de alto volume, com consistência de lote. Apresentamos a capacidade disponível para a sua demanda no contato comercial.',
    },
    {
      question: 'Vocês fornecem documentação técnica e laudos?',
      answer:
        'Sim. Disponibilizamos fichas técnicas, laudos e documentação por lote para atender às exigências de compra de indústrias e grandes redes.',
    },
    {
      question: 'Como são definidas as condições comerciais?',
      answer:
        'Condições de fornecimento, prazos e formatos são negociados diretamente com nossa equipe comercial, conforme o perfil e o volume de cada cliente.',
    },
    {
      question: 'É possível desenvolver especificações sob demanda?',
      answer:
        'Dependendo do produto e do volume, conseguimos adequar especificações ao processo do cliente. Avaliamos a viabilidade caso a caso.',
    },
    {
      question: 'Qual o prazo de entrega para pedidos B2B?',
      answer:
        'O prazo depende do produto, volume e região de entrega. Informamos o prazo estimado durante a negociação comercial.',
    },
  ],
  'terceirizacao-de-producao': [
    {
      question: 'Como começa um projeto de terceirização?',
      answer:
        'Tudo começa pela análise da sua formulação ou especificação. A partir daí desenvolvemos lotes-piloto, validamos e planejamos a produção em escala.',
    },
    {
      question: 'A fórmula do meu produto fica protegida?',
      answer:
        'Sim. Tratamos formulações de clientes com confidencialidade. Detalhes contratuais de proteção são definidos no início do projeto.',
    },
    {
      question: 'Preciso investir em equipamentos?',
      answer:
        'Não. A terceirização usa a estrutura industrial já existente da MSM — sem necessidade de investimento próprio em planta ou equipamentos.',
    },
    {
      question: 'Vocês entregam documentação por lote?',
      answer:
        'Sim. Cada lote produzido acompanha fichas técnicas, laudos e registros, facilitando auditorias e exigências de compra.',
    },
    {
      question: 'Qual o volume mínimo para terceirizar?',
      answer:
        'O volume mínimo depende do tipo de produto e processo. Nossa equipe técnica avalia a viabilidade do seu projeto no primeiro contato.',
    },
    {
      question: 'Quanto tempo leva do briefing ao produto final?',
      answer:
        'O prazo varia conforme a complexidade da formulação e os testes necessários. Apresentamos um cronograma estimado após a análise inicial.',
    },
  ],
  envase: [
    {
      question: 'Quais formatos de embalagem vocês envasam?',
      answer:
        'Trabalhamos com diferentes formatos — sachês, potes, embalagens flexíveis e outros — adaptados à necessidade do produto e do canal de venda.',
    },
    {
      question: 'Vocês cuidam da rotulagem e codificação?',
      answer:
        'Sim. O processo de envase integra rotulagem, codificação de lote, validade e demais informações obrigatórias conforme a legislação.',
    },
    {
      question: 'Como é garantida a precisão de peso?',
      answer:
        'Utilizamos controle gravimétrico e volumétrico para assegurar conformidade com o conteúdo declarado e reduzir variação entre unidades do mesmo lote.',
    },
    {
      question: 'Qual o volume mínimo para envase?',
      answer:
        'O volume mínimo depende do formato e do produto. Informe o produto, volume e formato desejado para que possamos avaliar a viabilidade.',
    },
    {
      question: 'O envase inclui controle de qualidade?',
      answer:
        'Sim. O processo de envase é integrado ao controle de qualidade da planta, com rastreabilidade e documentação por lote.',
    },
  ],
  'marcas-proprias': [
    {
      question: 'O que é o serviço de marca própria da MSM?',
      answer:
        'Desenvolvemos e produzimos produtos com a sua marca, da formulação ao envase com rótulo exclusivo, usando toda a nossa estrutura industrial.',
    },
    {
      question: 'Posso personalizar embalagem e rótulo?',
      answer:
        'Sim. A identidade visual, embalagem e apresentação são personalizadas conforme o posicionamento e o canal de venda da sua marca.',
    },
    {
      question: 'Qual o volume mínimo para marca própria?',
      answer:
        'O volume é ajustável à evolução do seu negócio. Avaliamos o mínimo viável conforme o produto no primeiro contato comercial.',
    },
    {
      question: 'Vocês ajudam no desenvolvimento do produto?',
      answer:
        'Sim. Nossa equipe acompanha o caminho do briefing à prateleira, avaliando formulação, testes e adequação às necessidades da marca.',
    },
    {
      question: 'Consigo ter exclusividade de formulação?',
      answer:
        'Possibilidades de exclusividade são avaliadas caso a caso e definidas em contrato. Fale com nossa equipe para entender as condições.',
    },
  ],
  distribuicao: [
    {
      question: 'Como me torno um distribuidor MSM?',
      answer:
        'Use o botão "Seja um representante" ou fale com nossa equipe comercial para conhecer a política de distribuição, territórios e condições de parceria.',
    },
    {
      question: 'Existem territórios disponíveis na minha região?',
      answer:
        'A disponibilidade de territórios varia por região. Nossa equipe comercial informa as áreas abertas no momento do contato.',
    },
    {
      question: 'Quais produtos posso distribuir?',
      answer:
        'O portfólio disponível para distribuição é apresentado conforme o perfil do parceiro e a região de atuação.',
    },
    {
      question: 'A MSM oferece suporte aos distribuidores?',
      answer:
        'Sim. Distribuidores parceiros contam com suporte comercial, materiais de venda e atendimento estruturado.',
    },
    {
      question: 'Como funciona a logística de entrega?',
      answer:
        'Operamos com expedição organizada e rede de parceiros logísticos selecionados para garantir prazo e integridade do produto no transporte.',
    },
  ],
};
