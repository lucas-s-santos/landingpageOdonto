/**
 * Prepara os vídeos do Google Flow para a página.
 *
 *   npm run video
 *
 * Entrada: `_origem/video-flow/*.mp4` — saída crua do Flow, 1920×1080, 8 s,
 * com faixa de áudio AAC.
 *
 * Saída: `public/video/` com `.webm`, `.mp4` e `-poster.webp` de cada um,
 * em 1280×720 e sem áudio.
 *
 * O que este script resolve, e por que cada coisa importa:
 *
 * 1. TIRA O ÁUDIO. O Veo gera som junto. O BRIEF exige que todos os vídeos
 *    da página sejam mudos, e a faixa só ocuparia banda.
 *
 * 2. FECHA O LOOP. Nenhum gerador entrega um loop que fecha, e um corte a
 *    cada 8 segundos é a diferença entre parecer acabado e parecer colado.
 *    Duas estratégias, escolhidas pelo tipo de movimento:
 *
 *    `dissolve` — para cena quase parada. Mistura o fim com o começo. O
 *    resultado fica alguns décimos mais curto que o original.
 *
 *    `pingue-pongue` — para cena com travelling. A sala vazia tem um
 *    movimento de câmera para dentro do quarto: começa na porta e termina
 *    lá dentro. Dissolve não resolve isso, porque a escala muda. Tocar de
 *    ida e volta fecha exato e, num movimento lento, lê como respiração.
 *
 * 3. NORMALIZA PARA 1280×720. É o tamanho de todos os assets da página, e
 *    1080p num bloco contido é peso sem ganho.
 *
 * 4. CORRIGE A COR NO ENCODE, não em CSS. A página tinha um
 *    `filter: saturate() hue-rotate()` aplicado a todo vídeo, que custava
 *    cerca de 250 ms de renderização medidos no Lighthouse. Assar a
 *    correção no arquivo custa zero em tempo de execução — e permite
 *    corrigir cada vídeo na direção certa, que é o que este lote precisa:
 *    a abertura saiu fria demais e a sala saiu no ponto.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const executar = promisify(execFile);

const ENTRADA = resolve('_origem/video-flow');
const SAIDA = resolve('public/video');

/**
 * `dissolve` recebe a duração da mistura em segundos. Quanto mais a cena se
 * move entre o primeiro e o último frame, maior precisa ser.
 */
const RECEITAS = {
  // Saiu com R−B de −15 e o alvo é +9: azulada demais. Esquenta no encode.
  'hero-molar': {
    loop: 'dissolve',
    mistura: 0.7,
    crf: 34,
    cor: 'colorchannelmixer=rr=1.07:gg=1.005:bb=0.92',
  },
  esmalte: { loop: 'dissolve', mistura: 1.0, crf: 36 },
  'instrumental-selado': { loop: 'dissolve', mistura: 0.9, crf: 40 },
  // `cortar` usa só os primeiros N segundos da origem antes do
  // pingue-pongue. Oito segundos de travelling ida-e-volta dariam 16 s e
  // quase 1 MB para um bloco decorativo. Cinco segundos percorrem menos
  // distância, ficam mais perto do "câmera quase parada" que o vídeo devia
  // ter, e cabem no orçamento.
  'sala-vazia': { loop: 'pingue-pongue', cortar: 5, crf: 40 },
};

/** Frame usado como poster, em segundos. Nunca o primeiro: ele é o menos
 *  representativo, e o poster é o que fica no lugar do vídeo sob
 *  `prefers-reduced-motion`. */
const POSTER = {
  'hero-molar': 4.0,
  esmalte: 3.5,
  'instrumental-selado': 4.5,
  'sala-vazia': 5.0,
};

const ff = (args) => executar('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args]);

async function duracao(arquivo) {
  const { stdout } = await executar('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    arquivo,
  ]);
  return parseFloat(stdout.trim());
}

/**
 * Loop por dissolve.
 *
 * A saída é: o miolo (de `m` até `D-m`), seguido de uma mistura entre a
 * cauda (`D-m` até `D`) e a cabeça (`0` até `m`).
 *
 * Quando o vídeo reinicia, o último frame mostrado é o frame `m` do
 * original — que é exatamente onde o miolo começa. A emenda desaparece.
 */
function filtroDissolve(D, m) {
  return [
    `[0:v]trim=0:${m},setpts=PTS-STARTPTS[cabeca]`,
    `[0:v]trim=${m}:${(D - m).toFixed(3)},setpts=PTS-STARTPTS[miolo]`,
    `[0:v]trim=${(D - m).toFixed(3)}:${D},setpts=PTS-STARTPTS[cauda]`,
    `[cauda][cabeca]xfade=transition=fade:duration=${m}:offset=0[emenda]`,
    `[miolo][emenda]concat=n=2:v=1:a=0[v]`,
  ].join(';');
}

const filtroPinguePongue = () =>
  '[0:v]split[frente][tras];[tras]reverse[revertido];[frente][revertido]concat=n=2:v=1:a=0[v]';

const ESCALA = 'scale=1280:720:flags=lanczos,setsar=1';

/** Alvo de temperatura: R−B ≈ +9, que é o do fundo `--osso #EFEDE6`. */
const cadeia = (receita) => [ESCALA, receita.cor].filter(Boolean).join(',');

async function preparar(nome) {
  const receita = RECEITAS[nome];
  const origem = join(ENTRADA, `${nome}.mp4`);
  const D = receita.cortar ?? (await duracao(origem));

  const filtro =
    receita.loop === 'pingue-pongue'
      ? filtroPinguePongue()
      : filtroDissolve(D, receita.mistura);

  // MP4 primeiro: o WebM e o poster saem dele, para os três serem
  // exatamente o mesmo material.
  const mp4 = join(SAIDA, `${nome}.mp4`);
  await ff([
    ...(receita.cortar ? ['-t', String(receita.cortar)] : []),
    '-i', origem,
    '-filter_complex', `${filtro};[v]${cadeia(receita)}[saida]`,
    '-map', '[saida]',
    '-an',
    '-c:v', 'libx264', '-crf', '21', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    mp4,
  ]);

  const webm = join(SAIDA, `${nome}.webm`);
  await ff([
    '-i', mp4,
    '-an',
    '-c:v', 'libvpx-vp9', '-crf', String(receita.crf), '-b:v', '0', '-row-mt', '1',
    webm,
  ]);

  const poster = join(SAIDA, `${nome}-poster.webp`);
  await ff([
    '-i', mp4,
    '-ss', String(POSTER[nome]),
    '-frames:v', '1',
    '-c:v', 'libwebp', '-quality', '82',
    poster,
  ]);

  const dur = await duracao(mp4);
  const tam = async (f) => Math.round((await stat(f)).size / 1024);
  return {
    nome,
    loop: receita.loop,
    duracao: dur.toFixed(2),
    webm: await tam(webm),
    mp4: await tam(mp4),
    poster: await tam(poster),
  };
}

await mkdir(SAIDA, { recursive: true });

const nomes = (await readdir(ENTRADA))
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => f.replace(/\.mp4$/, ''))
  .filter((n) => n in RECEITAS);

console.log(`preparando ${nomes.length} vídeo(s)\n`);
const linhas = [];
for (const nome of nomes) {
  process.stdout.write(`  ${nome} ... `);
  linhas.push(await preparar(nome));
  console.log('ok');
}

console.log('\n  nome                  loop            dur      webm      mp4   poster');
console.log('  ' + '-'.repeat(72));
for (const l of linhas) {
  console.log(
    `  ${l.nome.padEnd(20)}  ${l.loop.padEnd(14)} ${(l.duracao + 's').padStart(6)} ` +
      `${(l.webm + ' KB').padStart(9)} ${(l.mp4 + ' KB').padStart(8)} ${(l.poster + ' KB').padStart(8)}`
  );
}
console.log('\nok');
