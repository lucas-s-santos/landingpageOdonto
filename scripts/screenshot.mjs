/**
 * Screenshot de `dist/` em 1440px e 390px — as duas larguras que o BRIEF
 * (seção 11) exige antes de dizer que um passo acabou.
 *
 *   npm run build && node scripts/screenshot.mjs [pasta-de-saida]
 *
 * Sobe um servidor estático próprio em vez de usar `astro preview` para não
 * depender de um processo em paralelo. Espera as fontes carregarem antes de
 * fotografar: sem isso o screenshot pega o fallback do sistema e a crítica
 * tipográfica sai errada.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const RAIZ = resolve('dist');
const SAIDA = resolve(process.argv[2] ?? 'screenshots');
const PORTA = 4321;

const LARGURAS = [
  { nome: '1440', width: 1440, height: 900 },
  { nome: '390', width: 390, height: 844 },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

const servidor = createServer(async (req, res) => {
  try {
    let caminho = join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
    if ((await stat(caminho)).isDirectory()) caminho = join(caminho, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[extname(caminho)] ?? 'application/octet-stream' });
    res.end(await readFile(caminho));
  } catch {
    res.writeHead(404);
    res.end('404');
  }
});

await mkdir(SAIDA, { recursive: true });
await new Promise((r) => servidor.listen(PORTA, r));

const navegador = await chromium.launch();

for (const { nome, width, height } of LARGURAS) {
  const pagina = await navegador.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: join(SAIDA, `${nome}.png`), fullPage: true });
  console.log(`  ${nome}px → ${join(SAIDA, `${nome}.png`)}`);

  if (nome === '1440') {
    const computado = await pagina.evaluate(() => {
      const corpo = getComputedStyle(document.body);
      const titulo = document.querySelector('h1');
      return {
        fundo: corpo.backgroundColor,
        texto: corpo.color,
        fonteCorpo: corpo.fontFamily.split(',')[0],
        fonteTitulo: titulo ? getComputedStyle(titulo).fontFamily.split(',')[0] : null,
        tamanhoTitulo: titulo ? getComputedStyle(titulo).fontSize : null,
        pesoTitulo: titulo ? getComputedStyle(titulo).fontWeight : null,
      };
    });
    const fontes = await pagina.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`)
    );
    console.log('\n  computado:', JSON.stringify(computado, null, 2).replace(/\n/g, '\n  '));
    console.log('  fontes carregadas:', fontes.join(' · ') || '(nenhuma!)');

    // Nenhum scroll horizontal: o piso de qualidade exige funcionar em 360px.
    const estouro = await pagina.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log(`  estouro horizontal: ${estouro}px`);
  }
}

// 360px é o piso declarado no CLAUDE.md. Conferir estouro, sem fotografar.
const estreita = await navegador.newPage({ viewport: { width: 360, height: 800 } });
await estreita.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' });
const estouro360 = await estreita.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
console.log(`\n  estouro horizontal em 360px: ${estouro360}px`);

await navegador.close();
servidor.close();
console.log('\nok');
