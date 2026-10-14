/**
 * Gera o que aparece quando o link da página é compartilhado.
 *
 *   npm run og
 *
 * Saída em `public/`:
 *
 *   og.jpg                1200×630. É a prévia do link no WhatsApp, no
 *                         Instagram, no Facebook e no LinkedIn. A clínica
 *                         distribui a página justamente por esses canais
 *                         (bio, status, conversa com a recepção); sem a
 *                         imagem, o link chegava como um retângulo cinza.
 *   favicon.svg           o ícone da aba.
 *   apple-touch-icon.png  180×180, para quem salva a página na tela inicial.
 *
 * O texto sai do `conteudo.ts` — nome, cidade e as linhas do título —, então
 * a prévia nunca diz uma coisa e a página outra. RODAR DE NOVO ao trocar de
 * MODO ou ao preencher os dados do cliente.
 *
 * Recusa gerar com [PREENCHER] em qualquer campo: uma prévia com
 * "[PREENCHER nome da clínica]" circulando no WhatsApp é pior que nenhuma.
 *
 * O favicon é o da demo: o ponto e o fio da prancha anatômica, a única forma
 * da página que não é texto. No cliente ele dá lugar à marca da clínica.
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const { CLINICA, ABERTURA } = await import('../src/data/conteudo.ts');

const campos = { nome: CLINICA.nome, cidade: CLINICA.cidade, uf: CLINICA.uf };
const vazios = Object.entries(campos).filter(([, v]) => !v || String(v).includes('[PREENCHER'));
if (vazios.length) {
  console.error(
    `não gero a prévia com campo vazio: ${vazios.map(([k]) => k).join(', ')}.\n` +
      'Preencha o conteudo.ts primeiro.'
  );
  process.exit(1);
}

const dataUri = async (caminho, tipo) =>
  `data:${tipo};base64,${(await readFile(resolve(caminho))).toString('base64')}`;

const fonte = await dataUri('public/fonts/CabinetGrotesk-Medium.woff2', 'font/woff2');
const texto = await dataUri('public/fonts/Switzer-Regular.woff2', 'font/woff2');
const poster = await dataUri('public/video/hero-molar-poster.webp', 'image/webp');

const escapar = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A mesma composição da abertura: título à esquerda, o dente sangrando pela
// direita com a borda dissolvida. Sem botão: prévia de link não é clicável
// por partes, e um "Agendar avaliação" desenhado ali seria um botão falso.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Cabinet; src: url(${fonte}); font-weight: 500; }
  @font-face { font-family: Switzer; src: url(${texto}); font-weight: 400; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #efede6; color: #1c211f; position: relative; overflow: hidden; }
  .dente { position: absolute; inset: 0 0 0 520px; background: url(${poster}) center / cover;
           -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 38%); }
  .texto { position: absolute; left: 72px; top: 64px; bottom: 64px; width: 720px;
           display: flex; flex-direction: column; justify-content: space-between; }
  .nome { font: 500 30px/1 Cabinet; letter-spacing: -0.01em; }
  h1 { font: 500 76px/0.98 Cabinet; letter-spacing: -0.022em; }
  h1 span { display: block; }
  .local { font: 400 24px/1 Switzer; }
</style></head><body>
  <div class="dente"></div>
  <div class="texto">
    <p class="nome">${escapar(CLINICA.nome)}</p>
    <h1>${ABERTURA.tituloLinhas.map((l) => `<span>${escapar(l)}</span>`).join('')}</h1>
    <p class="local">${escapar(CLINICA.cidade)}, ${escapar(CLINICA.uf)}</p>
  </div>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
const png = await pagina.screenshot({ type: 'png' });
await navegador.close();

const og = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
await writeFile(resolve('public/og.jpg'), og);

// Eucalipto chapado, o ponto e o fio da prancha em osso. Raio zero, como o
// resto da página. Em 16px o fio de 2 unidades ainda aparece.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#33473f"/>
  <circle cx="11" cy="16" r="4.5" fill="#efede6"/>
  <rect x="15" y="15" width="11" height="2" fill="#efede6"/>
</svg>
`;
await writeFile(resolve('public/favicon.svg'), favicon);
await sharp(Buffer.from(favicon), { density: 600 })
  .resize(180, 180)
  .png()
  .toFile(resolve('public/apple-touch-icon.png'));

console.log(`og.jpg ${Math.round(og.length / 1024)} KB · favicon.svg · apple-touch-icon.png`);
