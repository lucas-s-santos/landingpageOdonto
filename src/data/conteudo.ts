/**
 * Toda a copy da página em um lugar só.
 *
 * REGRAS QUE VALEM PARA CADA STRING DESTE ARQUIVO (BRIEF seções 3 e 10):
 *
 * 1. Resolução CFO-196/2019. Proibido: preço, valor, "a partir de", desconto,
 *    parcelamento, promoção, depoimento de paciente, antes/depois, superlativo
 *    ("a melhor", "referência", "a mais moderna"), garantia ou promessa de
 *    resultado. Descumprir gera processo ético contra o dentista.
 *
 * 2. Nada de dado do cliente inventado. Nome, CRO, endereço, telefone, horário
 *    e especialidade registrada vão como [PREENCHER]. CRO inventado é
 *    falsificação.
 *
 * 3. Tom: alguém explicando com calma, não vendendo. Sentence case, voz ativa,
 *    frases curtas, duração honesta.
 */

/**
 * MODO DE OPERAÇÃO
 *
 * `demo`    — a página que a CalmDev mostra para vender. Dados fictícios,
 *             com uma faixa no topo dizendo que são.
 * `cliente` — a página de um cliente real. Dados vazios, marcados
 *             `[PREENCHER]`, para ninguém publicar sem preencher.
 *
 * Trocar aqui troca a página inteira.
 */
export const MODO: 'demo' | 'cliente' = 'demo';

export const EH_DEMO = MODO === 'demo';

/**
 * DUAS COISAS NÃO SÃO INVENTADAS NEM NO MODO DEMO, e não é burocracia:
 *
 * 1. O NÚMERO DO CRO. É registro público. Um número plausível pode ser o de
 *    um dentista real, e a página passaria a atribuir o registro dele a uma
 *    pessoa que não existe. Zeros nunca são emitidos: preenchem o espaço no
 *    layout e não colidem com ninguém.
 *
 * 2. O TELEFONE DE UM TERCEIRO. Um número plausível inventado tocaria na
 *    casa de alguém que nunca ouviu falar desta clínica. Por isso o telefone
 *    do demo é o da própria CalmDev, real e com dono conhecido — nunca um
 *    número tirado do nada.
 */
const DEMO = {
  // "Clínica Marena" foi descartada: `Marena Odontologia & Bem Estar` é uma
  // clínica REAL em São Paulo, com site, CNPJ e o handle `clinicamarena` no
  // Facebook. Nome de clínica plausível quase sempre já existe no Brasil —
  // "Vertente Odontologia", a segunda tentativa, existe no Rio. "Clínica
  // Sobrado" não retorna nenhuma clínica odontológica no país, e o nome cai
  // bem numa praça central de cidade do interior de Minas.
  nome: 'Clínica Sobrado',
  responsavelTecnico: 'Helena Ribeiro Castro',
  croResponsavel: 'CRO-MG 00.000',
  // Endereço conferido: a Praça Getúlio Vargas fica no Centro de Alfenas e o
  // CEP é 37130-073. Os consultórios que existem de verdade nela estão nos
  // números 245, 262 e 329 — a numeração não chega perto de 1000, então este
  // endereço não é de ninguém.
  endereco: 'Praça Getúlio Vargas, 1000 — Centro',
  cidade: 'Alfenas',
  uf: 'MG',
  cep: '37130-073',
  // Telefone e WhatsApp são o MESMO número, e é um número real: o da
  // CalmDev. Numa demo isso é proposital — o dono do consultório clica em
  // "Agendar avaliação", o WhatsApp abre com a mensagem pronta e ela cai com
  // quem está vendendo. Ele testa o fluxo inteiro e vira lead na mesma ação.
  //
  // Mostrar um telefone falso ao lado de um WhatsApp que funciona deixaria a
  // demo incoerente: quem ligasse não seria atendido. Para separar os dois,
  // basta trocar `telefone` aqui de volta por um não atribuível.
  telefone: '(35) 98886-2172',
  whatsapp: '5535988862172',
  perfilGoogle: 'https://www.google.com/maps',
} as const;

const CLIENTE = {
  nome: '[PREENCHER nome da clínica]',
  responsavelTecnico: '[PREENCHER nome completo do responsável técnico]',
  croResponsavel: '[PREENCHER número do CRO]',
  endereco: '[PREENCHER rua, número, bairro]',
  cidade: '[PREENCHER cidade]',
  uf: 'MG',
  cep: '[PREENCHER CEP]',
  telefone: '[PREENCHER telefone]',
  /**
   * Só dígitos, com código do país. Ex.: 5535999999999
   * Enquanto não for preenchido, o botão do WhatsApp mostra o telefone em
   * vez de um link quebrado — ver `linkWhatsApp()` no fim do arquivo.
   */
  whatsapp: '[PREENCHER]',
  /** URL do perfil no Google. As avaliações ficam lá, nunca republicadas aqui. */
  perfilGoogle: '[PREENCHER link do perfil no Google]',
} as const;

export const CLINICA = EH_DEMO ? DEMO : CLIENTE;

/* ==========================================================================
   EXPEDIENTE — horário como DADO, não como frase
   ==========================================================================

   Era uma string solta: 'Segunda a sexta, das 8h às 19h. Sábado, das 8h às
   12h.' Isso quebrava duas coisas ao mesmo tempo.

   1. O JSON-LD. `openingHours` do schema.org espera `Mo-Fr 08:00-19:00`.
      Recebendo prosa, o Google descarta o campo — e o horário é justamente
      o que o painel local mostra para quem procura dentista de madrugada.
      Estava escrito no site e invisível para a busca.

   2. O botão. Sem saber quando a clínica abre, o CTA diz a mesma coisa às
      10h da manhã e às 23h. A visitante do BRIEF (seção 1) está no celular,
      à noite: ela manda mensagem, ninguém responde, e ela conclui que a
      clínica não responde.

   Uma fonte só. A frase do rodapé é GERADA daqui, então rodapé, JSON-LD e
   botão nunca discordam. */

/** 0 = domingo … 6 = sábado, a mesma convenção de Date.getDay(). */
export type Faixa = { readonly dias: readonly number[]; readonly abre: string; readonly fecha: string };

const EXPEDIENTE_DEMO: readonly Faixa[] = [
  { dias: [1, 2, 3, 4, 5], abre: '08:00', fecha: '19:00' },
  { dias: [6], abre: '08:00', fecha: '12:00' },
];

/** Vazio = não preenchido. O rodapé mostra [PREENCHER] e o botão não
    arrisca palpite nenhum sobre estar aberto. */
const EXPEDIENTE_CLIENTE: readonly Faixa[] = [];

export const EXPEDIENTE = EH_DEMO ? EXPEDIENTE_DEMO : EXPEDIENTE_CLIENTE;

/**
 * O fuso da clínica, não o de quem visita.
 *
 * `new Date().getHours()` devolve a hora do aparelho. Alguém consultando de
 * outro fuso — e brasileiro fora do país procurando dentista para a volta
 * não é caso raro — leria "aberta agora" às 3h da manhã de Alfenas.
 */
export const FUSO = 'America/Sao_Paulo';

const DIA_LONGO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** '08:00' → '8h'  ·  '12:30' → '12h30'. Como se fala, não como se digita. */
export function hora(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** [1,2,3,4,5] → 'Segunda a sexta'  ·  [6] → 'Sábado'  ·  [2,4] → 'Terça e quinta' */
function nomeiaDias(dias: readonly number[]): string {
  const d = [...dias].sort((a, b) => a - b);
  const contiguo = d.length > 2 && d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  if (contiguo) return `${DIA_LONGO[d[0]]} a ${DIA_LONGO[d[d.length - 1]].toLowerCase()}`;
  const nomes = d.map((v, i) => (i === 0 ? DIA_LONGO[v] : DIA_LONGO[v].toLowerCase()));
  return nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * A frase do rodapé, gerada do dado. Enquanto o expediente estiver vazio,
 * devolve o [PREENCHER] — mesmo comportamento de antes, sem dado inventado.
 */
export const HORARIO_TEXTO: string = EXPEDIENTE.length
  ? EXPEDIENTE.map((f) => `${nomeiaDias(f.dias)}, das ${hora(f.abre)} às ${hora(f.fecha)}.`).join(' ')
  : '[PREENCHER horário de atendimento]';

/** Nomes de dia que o schema.org aceita, na ordem de `Date.getDay()`. */
export const DIA_SCHEMA = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const ABERTURA = {
  /**
   * Uma entrada por linha do título.
   *
   * A quebra é editorial, não automática. Três linhas curtas, com a pausa
   * caindo depois de "tratar," e depois de "explica".
   *
   * A terceira linha é a mais longa de propósito: é ela que alcança e cobre
   * a borda dissolvida do vídeo no desktop. Deixada a cargo do navegador, a
   * quebra cai antes disso e a invasão não acontece.
   *
   * Cada linha vira um elemento próprio também porque o passo 4 precisa
   * disso: a máscara de linha do MOTION.md §3 anima cada uma separadamente.
   */
  tituloLinhas: ['Antes de tratar,', 'a gente explica', 'o que está acontecendo.'],
  /** Versão em texto corrido, para o <title> e para leitores de tela. */
  get titulo() {
    return this.tituloLinhas.join(' ');
  },
  apoio:
    'Você vai entender o seu caso antes de decidir qualquer coisa. Inclusive antes de decidir se vai tratar aqui.',
  /**
   * O rótulo de prancha sobre o dente do vídeo: um ponto na coroa, um fio,
   * e o nome da parte. É a linguagem da seção 3 aparecendo já no topo — a
   * primeira coisa que a página faz é explicar, que é o que o título promete.
   * "A camada mais dura do corpo" é fato de anatomia, não superlativo sobre
   * a clínica.
   */
  rotulo: {
    nome: 'Esmalte',
    apoio: 'A camada mais dura do corpo. Role para ver o dente por dentro.',
    // No celular o vídeo tem 350px de largura e o rótulo inteiro cobria
    // metade do dente. Lá ele diz só o essencial.
    apoioCurto: 'Role para ver por dentro.',
  },
};

export const CTA = 'Agendar avaliação';

/**
 * O MENU É A LISTA DE DÚVIDAS, não a lista de seções.
 *
 * Menu de site de clínica diz "Sobre · Serviços · Equipe · Contato": o nome
 * que a CLÍNICA dá às próprias partes. Mas a ordem desta página é a ordem
 * das objeções de quem visita (BRIEF seção 4) — cada seção existe para
 * responder uma pergunta. Então o menu lista as perguntas, na voz de quem
 * pergunta, e cada uma leva à parte que responde.
 *
 * Fica de fora "como eu marco?": a resposta é o botão "Agendar avaliação",
 * que está no cabeçalho ao lado. Um segundo caminho para o mesmo lugar, com
 * outro verbo, é o CTA secundário que o BRIEF proíbe.
 *
 * `ancora` é o id do título da seção. Se um título mudar de id, o teste de
 * acessibilidade acusa o link quebrado.
 */
export const INDICE = {
  titulo: 'Suas dúvidas',
  intro: 'Cada uma tem uma parte da página que responde.',
  itens: [
    { pergunta: 'Vão me julgar por ter demorado?', onde: 'Como atendemos', ancora: 'atendimento-titulo' },
    { pergunta: 'Não entendo nada de dente. E agora?', onde: 'O dente por dentro', ancora: 'anatomia-titulo' },
    { pergunta: 'Vocês fazem o que eu preciso?', onde: 'O que a gente faz', ancora: 'tratamentos-titulo' },
    { pergunta: 'Quem vai me atender?', onde: 'Quem atende', ancora: 'equipe-titulo' },
    { pergunta: 'É limpo? É seguro?', onde: 'Onde você vai sentar', ancora: 'estrutura-titulo' },
    { pergunta: 'Quanto tempo leva a primeira consulta?', onde: 'Primeira consulta', ancora: 'consulta-titulo' },
    { pergunta: 'Onde fica e que horas abre?', onde: 'Rodapé', ancora: 'onde-estamos' },
  ],
} as const;

export const COMO_ATENDEMOS = {
  titulo: 'Ninguém aqui vai te dar sermão.',
  paragrafos: [
    'Muita gente chega depois de anos sem consultar. Às vezes por medo, às vezes porque nunca sobrou dinheiro no mês certo, às vezes porque uma experiência ruim ficou. A gente já ouviu todas essas, e nenhuma delas muda a forma como você vai ser atendido.',
    'Na avaliação a gente olha, explica o que encontrou e diz quais são os caminhos. Se der para tratar em etapas, a gente monta as etapas. Se der para esperar, a gente fala que dá.',
  ],
  /**
   * A frase que fecha a seção, em tamanho de título. Era o terceiro
   * parágrafo; subiu porque é a resposta inteira à objeção da seção ("vão me
   * julgar?"). As palavras acendem no ritmo de quem rola — MOTION.md §11.
   */
  fecho: 'Você decide depois, com a informação na mão e sem ninguém em cima.',
} as const;

export const ANATOMIA = {
  titulo: 'O dente por dentro',
  /**
   * A objeção desta seção é "não entendo nada, vão me empurrar coisa"
   * (BRIEF seção 4). A intro tem que começar tirando a culpa de quem lê, não
   * mandando estudar. A versão anterior terminava em "vale conhecer as
   * quatro regiões", que é professor passando dever de casa.
   */
  intro:
    'Você não precisa saber odontologia para decidir bem. Precisa saber onde está o problema, porque é isso que muda o tratamento. São quatro regiões, e cada uma avisa de um jeito diferente.',
  /**
   * VER POR DENTRO. Escolher uma parte corta o modelo ao meio, como na
   * prancha de um livro de anatomia, e mostra as camadas: o esmalte por
   * fora, a dentina por dentro, e a polpa — a câmara e os canais — no
   * centro. A legenda abaixo diz o que está aceso.
   *
   * Conteúdo educativo é o que a CFO-196 permite e a página usa como fonte
   * de confiança: nada aqui fala da clínica, só do dente.
   */
  verPorDentro: 'Ver por dentro',
  inteiro: 'Inteiro',
  legendaInteiro: 'Toque numa parte do dente, ou num botão abaixo, para ver por dentro.',
  /**
   * `x` e `y` em porcentagem da imagem, medidos sobre o recorte em
   * public/image/anatomia-molar.webp.
   * No passo 5 essas coordenadas passam a vir da projeção 3D
   * (vector.project(camera)) e estes valores viram só o fallback estático.
   */
  partes: [
    {
      id: 'esmalte',
      rotulo: 'Esmalte',
      x: 48.1,
      y: 16.2,
      texto:
        'A camada de fora, e a mais dura do corpo. Não tem nervo: um problema que ainda está só aqui não dói. Por isso ele aparece em exame, e não em crise.',
      tratamento: 'limpeza',
      corte: 'Em corte: o esmalte é a casca branca da coroa. Fino, duro e sem nervo nenhum.',
    },
    {
      id: 'dentina',
      rotulo: 'Dentina',
      x: 41.0,
      y: 31.0,
      texto:
        'Logo abaixo do esmalte, cheia de canais finos que chegam até o nervo. Quando fica exposta, dá aquela pontada curta no gelado, no quente ou no doce. A que passa rápido e volta sempre.',
      tratamento: 'restauracao',
      corte: 'Em corte: a dentina é o miolo amarelado, embaixo do esmalte e ao longo da raiz.',
    },
    {
      id: 'colo',
      rotulo: 'Colo do dente',
      x: 47.0,
      y: 53.5,
      texto:
        'Onde a coroa encontra a raiz, na linha da gengiva. É a região que mais sofre com escovação forte demais. Se a sua gengiva sangra quando você escova, é aqui que a gente olha primeiro.',
      tratamento: 'gengiva',
      corte: 'Em corte: o colo é a cintura do dente, onde a coroa vira raiz e a gengiva se prende.',
    },
    {
      id: 'raiz',
      rotulo: 'Raiz',
      x: 17.3,
      y: 70.8,
      texto:
        'Ancora o dente no osso e guarda o canal, onde ficam o nervo e os vasos. É a dor forte que aparece sozinha, sem você encostar em nada, e que costuma piorar quando você deita.',
      tratamento: 'canal',
      corte: 'Em corte: as raízes e, dentro delas, o canal, por onde passam o nervo e os vasos.',
    },
  ],
} as const;

/**
 * ATENÇÃO LEGAL: especialidade só pode ser citada se estiver registrada no CRO
 * do profissional (BRIEF seção 3). Os itens abaixo estão escritos como
 * PROCEDIMENTO e ÁREA DE ATUAÇÃO, que é o que a clínica pode divulgar.
 * Antes de publicar, conferir a lista com o cliente e remover o que a clínica
 * não faz.
 */
export const TRATAMENTOS = [
  {
    id: 'limpeza',
    imagem: 'trat-limpeza',
    alt: 'Escova de dentes nova, fio dental e escova interdental sobre um pano branco.',
    nome: 'Limpeza e prevenção',
    duracao: 'cerca de 40 minutos',
    texto:
      'Remoção de placa e tártaro, aplicação de flúor e revisão da sua escovação. É a consulta que encontra problema pequeno enquanto ele ainda é pequeno. Raspar tártaro perto da gengiva pode incomodar; se incomodar, avisa que a gente anestesia.',
  },
  {
    id: 'restauracao',
    imagem: 'trat-restauracao',
    alt: 'Escala de cor da resina: pequenas peças em forma de dente, em tons de marfim levemente diferentes.',
    nome: 'Restauração',
    duracao: 'de 30 a 60 minutos por dente',
    texto:
      'Quando a cárie passou do esmalte, a parte afetada sai e o dente é reconstruído com resina da cor dele. Feito com anestesia. Depois de algumas horas o dente volta a funcionar normal, e é comum sentir uma sensibilidade leve por alguns dias.',
  },
  {
    id: 'canal',
    imagem: 'trat-canal',
    alt: 'Limas finas de aço usadas no tratamento de canal, com cabos coloridos na ordem da espessura.',
    nome: 'Tratamento de canal',
    duracao: 'de 1 a 3 sessões, de cerca de 1 hora',
    texto:
      'Indicado quando a inflamação chegou ao nervo. O canal é limpo, desinfetado e preenchido, e depois o dente recebe uma restauração ou coroa. É feito sob anestesia — a fama de dolorido vem da dor que leva a pessoa até a cadeira, não do procedimento.',
  },
  {
    id: 'gengiva',
    imagem: 'trat-gengiva',
    alt: 'Sonda periodontal de aço, com marcas de milímetro perto da ponta.',
    nome: 'Tratamento de gengiva',
    duracao: 'de 1 a 4 sessões, conforme a extensão',
    texto:
      'Gengiva que sangra na escovação está inflamada. O tratamento limpa abaixo da linha da gengiva e acompanha a resposta ao longo de algumas semanas. Sangramento na escovação é sinal para marcar consulta, não para escovar mais devagar.',
  },
  {
    id: 'implante',
    imagem: 'trat-implante',
    alt: 'Modelo de implante em três partes, na ordem de montagem: o pino de titânio, o pilar e a coroa de cerâmica.',
    nome: 'Implante',
    duracao: 'cirurgia de cerca de 1 hora, com meses de espera até a prótese',
    texto:
      'Um pino de titânio substitui a raiz perdida e recebe a prótese depois que o osso cicatriza em volta. O tempo de espera varia com cada caso. É o tratamento que mais depende de avaliação e exame de imagem antes de qualquer plano.',
  },
  {
    id: 'protese',
    imagem: 'trat-protese',
    alt: 'Uma coroa de cerâmica e uma ponte de quatro dentes unidos.',
    nome: 'Prótese',
    duracao: 'de 2 a 5 sessões',
    texto:
      'Fixa ou removível, para repor um dente ou vários. Envolve moldagem, prova e ajuste — e o ajuste é normal, quase ninguém sai com a prótese perfeita na primeira prova.',
  },
  {
    id: 'clareamento',
    imagem: 'trat-clareamento',
    alt: 'Par de moldeiras transparentes de clareamento, superior e inferior, sobre um pano branco.',
    nome: 'Clareamento',
    duracao: 'de 1 a 3 sessões, ou uso em casa por algumas semanas',
    texto:
      'Feito no consultório, em casa com moldeira, ou os dois. O resultado muda de pessoa para pessoa e depende da causa da cor. Sensibilidade durante o processo é comum e passa.',
  },
] as const;

const EQUIPE_DEMO = [
  {
    nome: 'Helena Ribeiro Castro',
    cro: 'CRO-MG 00.000',
    atuacao: 'Clínica geral e endodontia',
    sobre:
      'Atende há dezoito anos e gosta de explicar com a radiografia na tela. Costuma dizer que ninguém decide bem sobre o que não entende.',
  },
  {
    nome: 'Rafael Queiroz Amaral',
    cro: 'CRO-MG 00.000',
    atuacao: 'Clínica geral e prótese',
    sobre:
      'Cuida da parte de reabilitação. Prefere planejar em etapas e revisar entre uma e outra a fazer tudo de uma vez.',
  },
] as const;

const EQUIPE_CLIENTE = [
  {
    nome: '[PREENCHER nome completo]',
    cro: '[PREENCHER número do CRO]',
    atuacao: '[PREENCHER — só citar especialidade se registrada no CRO]',
    sobre: '[PREENCHER duas linhas sobre como essa pessoa atende]',
  },
  {
    nome: '[PREENCHER nome completo]',
    cro: '[PREENCHER número do CRO]',
    atuacao: '[PREENCHER — só citar especialidade se registrada no CRO]',
    sobre: '[PREENCHER duas linhas sobre como essa pessoa atende]',
  },
] as const;

/**
 * ATENÇÃO no modo cliente: "Clínica geral e endodontia" só pode ir ao ar se
 * a especialidade estiver registrada no CRO daquele profissional. É o que a
 * seção 3 do BRIEF exige, e vale conferir item por item.
 */
export const EQUIPE = EH_DEMO ? EQUIPE_DEMO : EQUIPE_CLIENTE;

/**
 * SEÇÃO 6 — a cadeia da esterilização.
 *
 * Antes era um parágrafo dizendo que o instrumental passa por lavagem,
 * embalagem e autoclave. Agora são as cinco etapas, uma prancha cada, que se
 * empilham conforme a pessoa rola (MOTION.md §11).
 *
 * ATENÇÃO, MODO CLIENTE — duas coisas a conferir antes de publicar:
 *
 * 1. As FOTOS. As quatro de `src/assets/flow/esteril-*` foram geradas no
 *    Google Flow para a demo. No site de uma clínica de verdade, estrutura
 *    tem que ser foto DELA: mostrar a esterilização de outro lugar como se
 *    fosse a sua é publicidade enganosa, e a CFO-196 só permite mostrar
 *    estrutura por ser a estrutura real. Por isso `imagem` é `null` fora da
 *    demo, e a prancha mostra um [PREENCHER] até alguém pôr a foto certa.
 *
 * 2. O TEXTO. Descreve o fluxo que a RDC 15/2012 da Anvisa exige de todo
 *    serviço de saúde. Mesmo assim é afirmação sobre o processo daquela
 *    clínica: conferir com ela, etapa por etapa.
 */
const foto = (nome: string) => (EH_DEMO ? nome : null);

export const ESTRUTURA = {
  titulo: 'Onde você vai sentar',
  cadeia: {
    titulo: 'Antes de chegar até você',
    intro:
      'Todo instrumental que entra na sua boca passa por estas cinco etapas, nesta ordem, depois de cada atendimento.',
    etapas: [
      {
        titulo: 'Lavagem',
        texto:
          'Sai do atendimento anterior direto para a lavagem. Resíduo preso no metal impede o vapor de chegar onde precisa, então esta etapa vem antes de qualquer outra.',
        imagem: foto('esteril-1-lavagem'),
        alt: 'Instrumental de aço submerso numa cuba de lavagem, com uma mão de luva apoiada na borda do cesto.',
      },
      {
        titulo: 'Inspeção',
        texto:
          'Seco, cada instrumento é conferido peça por peça, contra a luz. O que ainda tiver resíduo volta para a lavagem.',
        imagem: foto('esteril-2-inspecao'),
        alt: 'Mãos de luva erguem um instrumento contra a luz da janela para conferir a ponta.',
      },
      {
        titulo: 'Embalagem',
        texto:
          'Entra num envelope próprio para esterilização, que é selado. Fechado, ele fica protegido até ser aberto.',
        imagem: foto('esteril-3-embalagem'),
        alt: 'Mãos de luva fecham um envelope de esterilização; o instrumental aparece através do plástico.',
      },
      {
        titulo: 'Autoclave',
        texto:
          'O envelope vai para a autoclave, que esteriliza com vapor sob pressão. Uma faixa no envelope muda de cor quando o ciclo se completa.',
        imagem: foto('esteril-4-autoclave'),
        alt: 'Câmara aberta da autoclave, com envelopes fechados deitados nas bandejas.',
      },
      {
        titulo: 'Na sua frente',
        texto:
          'O envelope chega fechado até a sua cadeira e é aberto na sua frente, no começo do atendimento. O que não dá para esterilizar é descartável e vai fora depois de um uso só.',
        // A última etapa é vídeo: é a única em que o movimento conta algo.
        // Também gerado no Flow, então segue a mesma regra das fotos.
        video: foto('instrumental-selado'),
        alt: 'Mãos de luva abrem um envelope de esterilização selado sobre a bancada.',
      },
    ],
  },
  /** O vídeo da sala vazia também é gerado. Mesma regra. */
  sala: foto('sala-vazia'),
} as const;

export const PRIMEIRA_CONSULTA = {
  titulo: 'O que acontece na primeira consulta',
  intro:
    'Uma hora, mais ou menos. Sem procedimento, a não ser que você esteja com dor e a gente consiga resolver ali.',
  etapas: [
    { minutos: 5, texto: 'Você chega e preenche uma ficha curta de saúde.' },
    { minutos: 10, texto: 'Conversa sobre o que te trouxe e sobre o que te incomoda.' },
    { minutos: 15, texto: 'Exame clínico, dente por dente, e da gengiva.' },
    { minutos: 10, texto: 'Radiografia, se for necessária para enxergar o que o exame não mostra.' },
    { minutos: 10, texto: 'A gente explica o que encontrou, com a imagem na tela.' },
    { minutos: 5, texto: 'Você sai com o plano por escrito e leva para pensar.' },
  ],
} as const;

/* ==========================================================================
   PÁGINA DE PREPARO — /primeira-consulta
   ==========================================================================

   Não é uma seção da landing: é uma rota própria, feita para a recepção
   colar no WhatsApp quando confirma o horário. Ataca as duas dores mais
   caras do BRIEF (seção 2): a falta em cima da hora e o paciente que vem na
   avaliação e some.

   CFO-196: tudo aqui é conteúdo educativo e informação de estrutura, que a
   resolução permite. Nenhuma linha fala de preço, forma de pagamento,
   resultado esperado ou tempo de tratamento prometido.

   O último bloco é o que mais devolve horário para a agenda. Ele pede o
   aviso sem cobrar e sem ameaçar — quem sente que vai levar bronca não
   avisa, simplesmente não aparece. */
export const PREPARO = {
  titulo: 'Antes da sua primeira consulta',
  intro:
    'Nada aqui é obrigatório. É só o que costuma fazer a consulta render mais, e o que as pessoas mais perguntam na véspera.',

  levar: {
    titulo: 'O que trazer',
    itens: [
      'Um documento com foto.',
      'A lista dos remédios que você toma, inclusive os de uso contínuo e os naturais. Se for mais fácil, tire foto das caixas.',
      'Radiografias e exames de outros atendimentos, se você tiver, mesmo antigos.',
      'O nome do seu convênio, se usar um.',
    ],
  },

  antes: {
    titulo: 'No dia',
    itens: [
      'Coma antes de vir. Consulta em jejum costuma passar mal, e não há nenhum exame aqui que peça jejum.',
      'Tome os seus remédios de sempre no horário de sempre. Não pare nada por causa da consulta.',
      'Escove os dentes antes de sair, se der. Se não der, tem escova aqui.',
      'Chegue uns dez minutos antes: a ficha de saúde é curta, mas é melhor preencher sem pressa.',
    ],
  },

  naoPrecisa: {
    titulo: 'O que você não precisa fazer',
    itens: [
      'Não precisa se desculpar pelo estado dos dentes. A gente não está aqui para isso.',
      'Não precisa decidir nada no dia. Você sai com o plano por escrito e leva para pensar.',
      'Não precisa vir sozinha. Se for mais confortável, traga alguém.',
      'Se você tem medo de dentista, diga isso na chegada. Muda o jeito de conduzir a consulta.',
    ],
  },

  avisar: {
    titulo: 'Se não der para vir',
    texto:
      'Avise pelo WhatsApp, mesmo em cima da hora e mesmo sem motivo. O horário volta para a agenda e vai para alguém que está com dor esperando. Remarcar é uma mensagem.',
  },
} as const;

/* ==========================================================================
   PERGUNTAS — a seção 7 em forma de pergunta e resposta
   ==========================================================================

   Alimenta o JSON-LD FAQPage do Base.astro e a página de preparo. É a mesma
   informação da seção 7, dita do jeito que a pessoa pergunta.

   CFO-196 de novo: resposta diz o que ACONTECE, nunca o que a pessoa vai
   sentir nem o que vai conseguir. "Não dói" é promessa de resultado; "é
   exame e conversa, sem procedimento" é descrição do que ocorre. */
export const PERGUNTAS = [
  {
    pergunta: 'Quanto tempo dura a primeira consulta?',
    resposta:
      'Cerca de uma hora, contando a ficha de saúde, a conversa, o exame e a explicação do que foi encontrado.',
  },
  {
    pergunta: 'Vou fazer algum procedimento já na primeira consulta?',
    resposta:
      'Não. A primeira consulta é exame e conversa. A exceção é quem chega com dor: aí a gente tenta resolver a dor no mesmo dia.',
  },
  {
    pergunta: 'O que eu preciso levar?',
    resposta:
      'Um documento com foto, a lista dos remédios que você toma e, se tiver, radiografias ou exames de outros atendimentos. Nada disso impede a consulta se você esquecer.',
  },
  {
    pergunta: 'Vou sair com o tratamento marcado?',
    resposta:
      'Só se você quiser. Você sai com o plano por escrito e pode levar para pensar, pedir outra opinião ou voltar depois.',
  },
  {
    pergunta: 'Faz radiografia na hora?',
    resposta:
      'Se for necessária para enxergar o que o exame clínico não mostra. Nem todo caso precisa, e isso é decidido durante o exame.',
  },
  {
    pergunta: 'Tenho medo de dentista. Como funciona?',
    resposta:
      'Diga isso na chegada, antes de sentar. A consulta é conduzida em outro ritmo, com pausa quando você pedir, e nada é feito sem ser explicado antes.',
  },
] as const;

export const AGENDAR = {
  titulo: 'Manda uma mensagem',
  apoio:
    'A gente responde no horário que você marcar. Três campos, e o resto da conversa acontece no WhatsApp.',
  motivos: [
    'Estou com dor',
    'Quero uma avaliação geral',
    'Limpeza',
    'Gengiva sangrando',
    'Dente quebrado ou restauração caída',
    'Quero repor um dente',
    'Aparelho',
    'Outro assunto',
  ],
  horarios: ['De manhã', 'À tarde', 'À noite'],
} as const;

/* ==========================================================================
   DE ONDE VEIO O CONTATO
   ==========================================================================

   Era `ORIGEM = 'site'`, fixo. Toda mensagem chegava dizendo "vim pelo
   site", o que responde a pergunta errada: a clínica já sabe que veio do
   site, o que ela não sabe é qual canal levou a pessoa até lá. É a dor 1 do
   BRIEF (agenda com buraco) sem o dado que permitiria atacá-la — e é a base
   do relatório que a CalmDev entrega depois.

   O canal vem por parâmetro de URL: o link da bio do Instagram vira
   `/?de=ig`, o QR do balcão vira `/?de=cartao`, e a mensagem chega dizendo
   de onde veio.

   LISTA FECHADA, e isso é segurança, não capricho. O que vem da URL é texto
   de terceiro: qualquer um monta um link com `?de=<o que quiser>` e manda
   para a vítima. Sem a lista, esse texto entraria na mensagem do WhatsApp,
   e a clínica leria como se a pessoa tivesse escrito. A URL só escolhe uma
   chave; o texto sai daqui. */

export const CANAIS: Readonly<Record<string, string>> = {
  site: 'pelo site',
  ig: 'pelo Instagram',
  google: 'pelo perfil do Google',
  cartao: 'pelo cartão da clínica',
  bio: 'pelo link da bio',
  indicacao: 'por indicação',
};

/** O fragmento usado quando não há parâmetro, ou quando ele não está na lista. */
export const CANAL_PADRAO = 'site';

/** Mantido para quem ainda importa o nome antigo. */
export const ORIGEM = 'site';

/**
 * Monta o link do WhatsApp. Retorna `null` enquanto o número não estiver
 * preenchido, e nesse caso a interface mostra o telefone em vez de um botão
 * quebrado.
 *
 * `encodeURIComponent` em tudo que vem do formulário: o texto digitado pela
 * pessoa nunca é concatenado cru na URL.
 */
export function linkWhatsApp(mensagem: string): string | null {
  const numero = CLINICA.whatsapp.replace(/\D/g, '');

  // Doze dígitos é o mínimo de um celular brasileiro com código do país:
  // 55 + DDD de 2 + 8 ou 9 do assinante.
  //
  // Antes esta checagem era só `if (!numero)`, e um placeholder que
  // continha a palavra "55" no meio do texto virava `wa.me/55` — um link
  // que abre o WhatsApp e não leva a lugar nenhum. Pior que um botão
  // desabilitado, porque parece que funciona.
  if (numero.length < 12) return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
