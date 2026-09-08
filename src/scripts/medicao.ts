/**
 * FASE A — instrumentação do relatório de canal.
 *
 * Este módulo só é baixado quando `MEDICAO.provedor` não é `'nenhum'`. Com o
 * provedor desligado ele não existe no build da página.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE NUNCA SAI DAQUI — leia antes de acrescentar qualquer evento
 * ═══════════════════════════════════════════════════════════════════════
 *
 * O formulário tem três campos: nome, motivo e melhor horário. O motivo é
 * uma lista que inclui "Estou com dor" e "Gengiva sangrando".
 *
 * `Nome: Ana Paula. Motivo: estou com dor.` é DADO PESSOAL SENSÍVEL — a
 * LGPD (art. 5º, II) classifica dado referente à saúde como sensível, com
 * regime mais rígido que dado comum. Mandar isso para uma ferramenta de
 * analytics transformaria a CalmDev em operadora de dado de saúde por
 * acidente, sem contrato, sem base legal e sem política de retenção.
 *
 * Por isso este arquivo NÃO LÊ O FORMULÁRIO. Nem para contar caracteres.
 * O manipulador de clique não toca em `input` nem em `select`, e a única
 * coisa que ele envia é a CHAVE do canal — `ig`, `google`, `cartao` — que
 * veio da URL e foi validada contra uma lista fechada.
 *
 * A chave, não o texto: `ig` é dimensão de relatório. O texto ("pelo
 * Instagram") é copy, e copy muda.
 *
 * Se um dia alguém precisar saber QUAL motivo mais aparece, a resposta não
 * é instrumentar aqui — é a seção 4 do PLANO-CLINICA.md, com contrato de
 * operador e base legal. Não dá para chegar lá por atalho.
 */
import { MEDICAO, type Evento } from '../data/medicao';

declare global {
  interface Window {
    plausible?: (evento: string, opcoes?: { props?: Record<string, string> }) => void;
    umami?: { track: (evento: string, dados?: Record<string, string>) => void };
  }
}

/**
 * Despacha para o provedor configurado.
 *
 * Falha em silêncio de propósito: se o script do provedor foi bloqueado por
 * um adblock — e boa parte do público bloqueia —, `window.plausible` não
 * existe. Isso não pode derrubar a página. Medição é secundária; o botão do
 * WhatsApp funcionando é que não é.
 */
function enviar(evento: Evento, dados: Record<string, string>): void {
  try {
    if (MEDICAO.provedor === 'plausible') window.plausible?.(evento, { props: dados });
    else if (MEDICAO.provedor === 'umami') window.umami?.track(evento, dados);
  } catch {
    /* medição nunca quebra a página */
  }
}

/**
 * O canal, lido da URL e validado contra a lista fechada que o servidor
 * renderizou em `data-canais`.
 *
 * Mesma regra do botão do WhatsApp (ver `Agendar.astro`): a URL só ESCOLHE
 * UMA CHAVE. Sem a validação, qualquer um monta `?de=<texto>` e injeta esse
 * texto como dimensão no relatório da clínica — sujando o painel dela com
 * conteúdo de terceiro.
 */
function canalAtual(): string {
  const raiz = document.querySelector<HTMLElement>('[data-medicao]');
  const padrao = raiz?.dataset.canalPadrao || 'site';

  let permitidas: string[] = [];
  try {
    permitidas = JSON.parse(raiz?.dataset.canais ?? '[]');
  } catch {
    return padrao;
  }

  const chave = new URLSearchParams(location.search).get('de');
  return chave && permitidas.includes(chave) ? chave : padrao;
}

const canal = canalAtual();

// --- visita: o denominador do funil ---------------------------------
enviar('visita', { canal });

// --- preparo: a página que a recepção manda pelo WhatsApp -----------
if (location.pathname.replace(/\/$/, '').endsWith('/primeira-consulta')) {
  enviar('preparo', { canal });
}

/**
 * contato: a única conversão que esta página tem.
 *
 * Escuta no documento, não em cada botão. O link do WhatsApp tem o `href`
 * reescrito a cada tecla digitada no formulário, e um ouvinte preso ao
 * elemento continuaria valendo — mas os links da página de preparo são
 * outros, e um ouvinte por elemento viraria uma lista para manter.
 *
 * `wa.me` é o critério, não a classe do botão: as âncoras `#agendar` do
 * cabeçalho e da barra fixa são navegação interna, não contato. Contar
 * aquilo inflaria a conversão com gente que só rolou a página.
 */
addEventListener(
  'click',
  (e) => {
    const alvo = (e.target as Element | null)?.closest?.('a[href*="wa.me/"]');
    if (alvo) enviar('contato', { canal });
  },
  { passive: true, capture: true }
);
