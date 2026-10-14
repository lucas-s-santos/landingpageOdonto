/**
 * Prepara as imagens do Google Flow para a página.
 *
 *   npm run imagem
 *
 * Entrada: `_origem/imagem-flow/` — saída crua do Flow, 2752×1536 (16:9),
 * 2,3 a 2,7 MB cada.
 *
 * Saída: `src/assets/flow/*.jpg`, já no recorte final e numa largura que
 * ainda sobra para tela 2x. NÃO é o que vai para o navegador: o
 * `<Picture>` do Astro lê estes arquivos no build e gera WebP e AVIF em
 * várias larguras, com `srcset`. O celular baixa a versão de 480px, não
 * esta.
 *
 * Por que recortar aqui e não no `<Picture>`: o `position` do serviço de
 * imagem só aceita palavra-chave (centro, esquerda...), e duas imagens
 * pedem um deslocamento fino. A receita fica escrita, e rodar de novo dá o
 * mesmo resultado.
 *
 * Por que não ficam em `public/`: arquivo em `public/` vai para o deploy
 * como está, 2,5 MB por imagem. Em `src/assets/` ele só existe como matéria
 * para o build.
 *
 * COR: as onze foram medidas antes de entrar (média R−B do quadro inteiro,
 * a mesma régua do lote de vídeos). Todas entre −12 e +15; o alvo é até
 * +18. Nenhuma precisou de correção. Se uma nova sair acima disso, a
 * correção entra na receita, nunca como `filter` de CSS.
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { join, parse, resolve } from 'node:path';

const ENTRADA = resolve('_origem/imagem-flow');
const SAIDA = resolve('src/assets/flow');

/**
 * `proporcao` — largura / altura do recorte final.
 *   16:10 nas pranchas da esterilização: cabem empilhadas numa janela de
 *         768px de altura sem cortar o texto da prancha da frente.
 *   3:2   nos tratamentos: a imagem divide a linha com o texto e não pode
 *         empurrar o parágrafo para baixo da dobra ao expandir.
 * `x` — de 0 a 1, onde cai o recorte dentro da sobra horizontal. 0.5 é o
 *   centro. A limpeza vai para a direita para não perder a escova
 *   interdental, que o Flow pôs encostada na borda.
 * `largura` — largura do arquivo gerado. Sobra para a maior exibição em
 *   tela 2x: a prancha ocupa ~720px no desktop, o tratamento ~480px.
 */
const RECEITAS = {
  'esteril-1-lavagem': { proporcao: 16 / 10, x: 0.45, largura: 1600 },
  'esteril-2-inspecao': { proporcao: 16 / 10, x: 0.6, largura: 1600 },
  'esteril-3-embalagem': { proporcao: 16 / 10, x: 0.5, largura: 1600 },
  'esteril-4-autoclave': { proporcao: 16 / 10, x: 0.5, largura: 1600 },
  'trat-limpeza': { proporcao: 3 / 2, x: 0.75, largura: 1200 },
  'trat-restauracao': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
  'trat-canal': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
  'trat-gengiva': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
  'trat-implante': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
  'trat-protese': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
  'trat-clareamento': { proporcao: 3 / 2, x: 0.5, largura: 1200 },
};

await mkdir(SAIDA, { recursive: true });

const arquivos = (await readdir(ENTRADA)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const faltando = Object.keys(RECEITAS).filter((n) => !arquivos.some((f) => parse(f).name === n));
if (faltando.length) {
  console.error(`faltam em _origem/imagem-flow/: ${faltando.join(', ')}`);
  process.exit(1);
}

for (const arquivo of arquivos) {
  const nome = parse(arquivo).name;
  const receita = RECEITAS[nome];
  if (!receita) {
    console.log(`  ignorado   ${arquivo} (sem receita)`);
    continue;
  }

  const origem = sharp(join(ENTRADA, arquivo));
  const { width, height } = await origem.metadata();

  // Recorta pela altura inteira e escolhe a janela horizontal.
  let w = Math.round(height * receita.proporcao);
  let h = height;
  if (w > width) {
    w = width;
    h = Math.round(width / receita.proporcao);
  }
  const left = Math.round((width - w) * receita.x);
  const top = Math.round((height - h) / 2);

  const destino = join(SAIDA, `${nome}.jpg`);
  const info = await origem
    .extract({ left, top, width: w, height: h })
    .resize({ width: receita.largura })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(destino);

  console.log(
    `  ${nome.padEnd(22)} ${width}×${height} → ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`
  );
}
