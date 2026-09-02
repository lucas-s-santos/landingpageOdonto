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

export const CLINICA = {
  nome: '[PREENCHER nome da clínica]',
  responsavelTecnico: '[PREENCHER nome completo do responsável técnico]',
  croResponsavel: '[PREENCHER número do CRO]',
  endereco: '[PREENCHER rua, número, bairro]',
  cidade: '[PREENCHER cidade]',
  uf: 'MG',
  cep: '[PREENCHER CEP]',
  telefone: '[PREENCHER telefone]',
  /**
   * Só dígitos, com código do país. Ex.: 5531999999999
   * Enquanto não for preenchido, o botão do WhatsApp fica desabilitado —
   * ver `linkWhatsApp()` mais abaixo.
   */
  whatsapp: '[PREENCHER]',
  horario: '[PREENCHER horário de atendimento]',
  /** URL do perfil no Google. As avaliações ficam lá, nunca republicadas aqui. */
  perfilGoogle: '[PREENCHER link do perfil no Google]',
} as const;

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
};

export const CTA = 'Agendar avaliação';

export const COMO_ATENDEMOS = {
  titulo: 'Ninguém aqui vai te dar sermão.',
  paragrafos: [
    'Muita gente chega depois de anos sem consultar. Às vezes por medo, às vezes porque nunca sobrou dinheiro no mês certo, às vezes porque uma experiência ruim ficou. A gente já ouviu todas essas, e nenhuma delas muda a forma como você vai ser atendido.',
    'Na avaliação a gente olha, explica o que encontrou e diz quais são os caminhos. Se der para tratar em etapas, a gente monta as etapas. Se der para esperar, a gente fala que dá.',
    'Você decide depois, com a informação na mão e sem ninguém em cima.',
  ],
} as const;

export const ANATOMIA = {
  titulo: 'O dente por dentro',
  intro:
    'Quase todo tratamento depende de onde o problema está. A mesma dor pode ser uma coisa no esmalte e outra bem diferente na raiz. Vale conhecer as quatro regiões.',
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
        'É a camada de fora e a mais dura do corpo. Não tem nervo, por isso um problema que ainda está só aqui costuma não doer. É também por isso que dá para encontrar em exame antes de virar dor.',
      tratamento: 'limpeza',
    },
    {
      id: 'dentina',
      rotulo: 'Dentina',
      x: 41.0,
      y: 31.0,
      texto:
        'Fica logo abaixo do esmalte e é cheia de canais finos que chegam até o nervo. Quando ela fica exposta, aparece aquela sensibilidade curta no gelado, no quente ou no doce.',
      tratamento: 'restauracao',
    },
    {
      id: 'colo',
      rotulo: 'Colo do dente',
      x: 47.0,
      y: 53.5,
      texto:
        'É onde a coroa encontra a raiz, na linha da gengiva. É a região que mais sofre com escovação forte demais e com inflamação de gengiva.',
      tratamento: 'gengiva',
    },
    {
      id: 'raiz',
      rotulo: 'Raiz',
      x: 17.3,
      y: 70.8,
      texto:
        'Ancora o dente no osso e guarda o canal, onde ficam o nervo e os vasos. Dor forte que aparece sozinha, principalmente à noite, costuma estar aqui.',
      tratamento: 'canal',
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
    nome: 'Limpeza e prevenção',
    duracao: 'cerca de 40 minutos',
    texto:
      'Remoção de placa e tártaro, aplicação de flúor e revisão da sua escovação. É a consulta que encontra problema pequeno enquanto ele ainda é pequeno. Raspar tártaro perto da gengiva pode incomodar; se incomodar, avisa que a gente anestesia.',
  },
  {
    id: 'restauracao',
    nome: 'Restauração',
    duracao: 'de 30 a 60 minutos por dente',
    texto:
      'Quando a cárie passou do esmalte, a parte afetada sai e o dente é reconstruído com resina da cor dele. Feito com anestesia. Depois de algumas horas o dente volta a funcionar normal, e é comum sentir uma sensibilidade leve por alguns dias.',
  },
  {
    id: 'canal',
    nome: 'Tratamento de canal',
    duracao: 'de 1 a 3 sessões, de cerca de 1 hora',
    texto:
      'Indicado quando a inflamação chegou ao nervo. O canal é limpo, desinfetado e preenchido, e depois o dente recebe uma restauração ou coroa. É feito sob anestesia — a fama de dolorido vem da dor que leva a pessoa até a cadeira, não do procedimento.',
  },
  {
    id: 'gengiva',
    nome: 'Tratamento de gengiva',
    duracao: 'de 1 a 4 sessões, conforme a extensão',
    texto:
      'Gengiva que sangra na escovação está inflamada. O tratamento limpa abaixo da linha da gengiva e acompanha a resposta ao longo de algumas semanas. Sangramento na escovação é sinal para marcar consulta, não para escovar mais devagar.',
  },
  {
    id: 'implante',
    nome: 'Implante',
    duracao: 'cirurgia de cerca de 1 hora, com meses de espera até a prótese',
    texto:
      'Um pino de titânio substitui a raiz perdida e recebe a prótese depois que o osso cicatriza em volta. O tempo de espera varia com cada caso. É o tratamento que mais depende de avaliação e exame de imagem antes de qualquer plano.',
  },
  {
    id: 'protese',
    nome: 'Prótese',
    duracao: 'de 2 a 5 sessões',
    texto:
      'Fixa ou removível, para repor um dente ou vários. Envolve moldagem, prova e ajuste — e o ajuste é normal, quase ninguém sai com a prótese perfeita na primeira prova.',
  },
  {
    id: 'clareamento',
    nome: 'Clareamento',
    duracao: 'de 1 a 3 sessões, ou uso em casa por algumas semanas',
    texto:
      'Feito no consultório, em casa com moldeira, ou os dois. O resultado muda de pessoa para pessoa e depende da causa da cor. Sensibilidade durante o processo é comum e passa.',
  },
] as const;

export const EQUIPE = [
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

export const ESTRUTURA = {
  titulo: 'Onde você vai sentar',
  paragrafos: [
    'Todo instrumental que entra na sua boca passa por lavagem, embalagem e autoclave, e sai de lá selado. A embalagem é aberta na sua frente, no começo do atendimento.',
    'O que não dá para esterilizar é descartável e vai fora depois de um uso só.',
  ],
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

/** Marcador de origem: é como a clínica sabe que o contato veio do site. */
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
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
