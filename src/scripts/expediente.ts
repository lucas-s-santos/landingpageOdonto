/**
 * Aberta ou fechada, no fuso da clínica.
 *
 * Saiu de dentro do Agendar.astro quando a abertura passou a dizer a mesma
 * coisa embaixo do primeiro botão. Duas cópias desta conta divergiriam na
 * primeira correção — e uma página que diz "aberta" no topo e "fechada" no
 * formulário destrói exatamente a confiança que ela existe para construir.
 *
 * FUSO DA CLÍNICA, não do aparelho. `Date.getHours()` devolve a hora de quem
 * visita: brasileiro no exterior procurando dentista para a volta leria
 * "aberta agora" às 3h da manhã de Alfenas.
 *
 * Não promete prazo de resposta — isso não depende do site.
 */

export type Faixa = { dias: number[]; abre: string; fecha: string };

export type Estado =
  | { aberta: true; fecha: string }
  | { aberta: false; quando: string; abre: string };

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const paraHora = (hhmm: string) => {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

const emMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

/** Dia da semana e minutos desde a meia-noite, no fuso da clínica. */
function agoraNaClinica(fuso: string) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const achar = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // hourCycle h23 devolve '24' à meia-noite em alguns motores.
  const h = Number(achar('hour')) % 24;
  return { dia: semana.indexOf(achar('weekday')), minutos: h * 60 + Number(achar('minute')) };
}

/**
 * `null` quando não dá para afirmar nada — expediente vazio (modo cliente,
 * horário ainda [PREENCHER]) ou fuso desconhecido. Melhor calar do que errar.
 */
export function estadoAgora(faixas: Faixa[], fuso = 'America/Sao_Paulo'): Estado | null {
  if (!faixas.length) return null;

  const { dia, minutos } = agoraNaClinica(fuso);
  if (dia < 0) return null;

  const faixaDoDia = (d: number) => faixas.find((f) => f.dias.includes(d));
  const hoje = faixaDoDia(dia);

  if (hoje && minutos >= emMinutos(hoje.abre) && minutos < emMinutos(hoje.fecha)) {
    return { aberta: true, fecha: paraHora(hoje.fecha) };
  }

  if (hoje && minutos < emMinutos(hoje.abre)) {
    return { aberta: false, quando: 'hoje', abre: paraHora(hoje.abre) };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const f = faixaDoDia(d);
    if (f) return { aberta: false, quando: i === 1 ? 'amanhã' : `na ${DIAS[d]}`, abre: paraHora(f.abre) };
  }
  return null;
}

/** Lê as faixas que o servidor deixou no atributo `data-expediente`. */
export function lerFaixas(el: HTMLElement): Faixa[] {
  try {
    return JSON.parse(el.dataset.expediente ?? '[]');
  } catch {
    return [];
  }
}
