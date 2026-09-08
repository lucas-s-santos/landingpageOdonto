/**
 * FASE A do PLANO-CLINICA.md — o relatório de canal.
 *
 * A pergunta que a clínica não sabe responder hoje é "qual canal me traz
 * paciente?". O `?de=` já responde metade: ele chega escrito na mensagem do
 * WhatsApp. Falta a outra metade, que é contar — e contar exige alguém
 * contando.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * NASCE DESLIGADO, E ISSO É PROPOSITAL
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Com `provedor: 'nenhum'`, o `Base.astro` não injeta script nenhum e o
 * módulo de medição nem é baixado. Zero requisição de terceiro, zero byte,
 * zero efeito no Lighthouse — que hoje está em 98 no perfil mobile e é piso
 * de contrato, não meta.
 *
 * Trocar `provedor` é o que liga tudo. Uma linha.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * QUAL FERRAMENTA — a decisão ainda é do Lucas
 * ═══════════════════════════════════════════════════════════════════════
 *
 *   'plausible'  hospedado por eles, mensalidade baixa, nada para manter.
 *                Escolha se você não quer administrar servidor.
 *
 *   'umami'      auto-hospedado, sem mensalidade, mas o servidor é seu:
 *                atualização, backup e uptime por sua conta. Escolha se
 *                você já tem onde hospedar.
 *
 * Os dois são sem cookie e não guardam dado pessoal, então não pedem banner
 * de consentimento. Não é o caso de Google Analytics, que usa cookie e faz
 * perfilamento — se algum dia entrar aqui, entra com banner e com uma
 * conversa sobre LGPD que hoje não precisamos ter.
 *
 * QUANDO LIGAR, MEÇA DE NOVO. Script de terceiro entra no orçamento de
 * performance. Rode `npm run lighthouse` antes e depois; se cair abaixo de
 * 90, o script sai — o piso vale mais que o relatório.
 */

export type Provedor = 'nenhum' | 'plausible' | 'umami';

export const MEDICAO = {
  provedor: 'nenhum' as Provedor,

  /** Plausible: o domínio exatamente como cadastrado lá. */
  dominio: '[PREENCHER domínio no Plausible]',

  /** Umami: a URL completa do script e o id do site no painel. */
  umamiScript: '[PREENCHER URL do script do Umami]',
  umamiSite: '[PREENCHER id do site no Umami]',
} as const;

/**
 * Os eventos, e a razão de existir de cada um.
 *
 * São três porque três é o funil inteiro. Mais que isso vira painel que
 * ninguém abre.
 *
 *   visita   alguém abriu a página, e por qual canal. É o denominador.
 *   contato  alguém clicou para abrir o WhatsApp. É o numerador — a única
 *            conversão que esta página tem.
 *   preparo  alguém abriu /primeira-consulta. Mede se a página que a
 *            recepção manda está sendo lida de verdade.
 *
 * Com os dois primeiros a clínica lê a frase que ela quer: "o Instagram
 * trouxe 40 visitas e 6 contatos; o Google trouxe 120 e 22".
 */
export const EVENTOS = ['visita', 'contato', 'preparo'] as const;
export type Evento = (typeof EVENTOS)[number];
