/**
 * A assinatura do Colo, pronta para entrar no HTML.
 *
 * O arquivo em `marca/` tem a cor fixa (eucalipto), porque é o arquivo de
 * entrega da marca. Aqui ela vira `currentColor`: a mesma palavra fica
 * eucalipto no cabeçalho, sobre osso, e osso dentro do menu, sobre
 * eucalipto — sem duas cópias para manter.
 *
 * Entra como texto do SVG, não como <img>: herda a cor, pode ter cada parte
 * animada pelo CSS, e não custa uma requisição a mais.
 */
import bruta from '../../marca/colo-assinatura.svg?raw';

const comCorDoTexto = (svg: string) => svg.replace(/fill="#[0-9a-fA-F]{3,6}"/, 'fill="currentColor"');

export const ASSINATURA = comCorDoTexto(bruta);

/*
  A GEOMETRIA DO PONTO, lida do próprio SVG — não medida à mão. Se a marca
  for redesenhada por `scripts/marca.py`, o rodapé acompanha.
*/
const numero = (re: RegExp) => {
  const m = bruta.match(re);
  if (!m) throw new Error(`marca/colo-assinatura.svg mudou de forma: não achei ${re}`);
  return Number(m[1]);
};
const [vx, vy, , vh] = (bruta.match(/viewBox="([^"]+)"/)?.[1] ?? '').split(/\s+/).map(Number);
const cx = numero(/<circle[^>]*cx="([\d.]+)"/);
const cy = numero(/<circle[^>]*cy="([\d.]+)"/);
const r = numero(/<circle[^>]*\br="([\d.]+)"/);
const fioAltura = numero(/<rect[^>]*height="([\d.]+)"/);
const fioX = numero(/<rect[^>]*\bx="([\d.]+)"/);
const fioLargura = numero(/<rect[^>]*width="([\d.]+)"/);
const larguraTotal = numero(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/);

/** Onde o SVG acaba quando o fio sai dele: na borda direita do ponto. */
const larguraSemFio = cx + r - vx;

/**
 * A palavra sem o fio, cortada na borda do ponto. No rodapé o fio é um
 * elemento à parte, que corre do ponto até a borda da tela — dentro do SVG
 * ele teria comprimento fixo.
 */
export const ASSINATURA_SEM_FIO = comCorDoTexto(bruta)
  .replace(/<rect[^>]*\/>/, '')
  .replace(/viewBox="[^"]+"/, `viewBox="${vx} ${vy} ${larguraSemFio} ${vh}"`);

/** Posição do fio, em porcentagem da caixa da palavra sem fio. */
export const FIO_DA_MARCA = {
  centro: ((cy - vy) / vh) * 100,
  espessura: (fioAltura / vh) * 100,
  /** Largura da caixa sobre a altura — para reservar o espaço certo. */
  proporcao: larguraSemFio / vh,
};

/**
 * A marca separada em partes, para a vinheta de entrada: o SVG leva só as
 * letras, e o ponto e o fio viram elementos HTML por cima, nas mesmas
 * posições. Motivo medido: animar o círculo e o retângulo DENTRO do SVG
 * não vai para o compositor — o navegador recalculava estilo a cada quadro
 * da vinheta, e o Lighthouse mobile caía de 93 para a faixa de 81 a 91.
 * Elemento HTML com `transform` anima fora da main thread.
 *
 * Tudo em porcentagem da caixa da marca inteira (com o fio).
 */
export const ASSINATURA_LETRAS = comCorDoTexto(bruta)
  .replace(/<circle[^>]*\/>/, '')
  .replace(/<rect[^>]*\/>/, '');

export const PARTES_DA_MARCA = {
  proporcao: larguraTotal / vh,
  ponto: {
    esquerda: ((cx - r - vx) / larguraTotal) * 100,
    topo: ((cy - r - vy) / vh) * 100,
    largura: ((2 * r) / larguraTotal) * 100,
  },
  fio: {
    esquerda: ((fioX - vx) / larguraTotal) * 100,
    centro: ((cy - vy) / vh) * 100,
    largura: (fioLargura / larguraTotal) * 100,
    espessura: (fioAltura / vh) * 100,
  },
};
