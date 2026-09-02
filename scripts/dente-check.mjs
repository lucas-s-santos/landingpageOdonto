/**
 * Verifica a cena 3D do passo 5.
 *
 *   npm run dente
 *
 * O que importa aqui não é "não deu erro": é que o dente REALMENTE aparece.
 * O teste lê os pixels do canvas e exige que haja forma desenhada, e checa
 * que o Three.js só é baixado quando a seção se aproxima — nunca antes.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const RAIZ = resolve('dist');
const PORTA = 4404;
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
  '.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png',
  '.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.wasm':'application/wasm' };
const servidor = createServer(async (req, res) => {
  try {
    let p = resolve(RAIZ, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (p !== RAIZ && !p.startsWith(RAIZ + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => servidor.listen(PORTA, r));

const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
let falhou = false;
const diz = (ok, t) => { if (!ok) falhou = true; console.log(`  ${ok ? 'ok   ' : 'FALHA'}  ${t}`); };

const pg = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
const pedidos = [];
pg.on('request', (q) => pedidos.push(q.url().split('/').pop()));
pg.on('pageerror', (e) => console.log('  [erro de página]', e.message.slice(0, 160)));

await pg.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(1200);

diz(!pedidos.some((u) => u.startsWith('three')), 'Three.js NÃO é baixado no carregamento inicial');
diz(!pedidos.some((u) => u.endsWith('.glb')), 'o modelo NÃO é baixado no carregamento inicial');

// aproxima da seção
await pg.evaluate(() => document.querySelector('#anatomia').scrollIntoView({ block: 'center' }));
await pg.waitForTimeout(600);

let pronto = false;
try {
  await pg.waitForFunction(() => document.querySelector('[data-palco]')?.hasAttribute('data-3d'), null, { timeout: 25000 });
  pronto = true;
} catch { /* segue e reporta */ }
diz(pronto, 'a cena 3D monta e o canvas assume o palco');
diz(pedidos.some((u) => u.startsWith('three')), 'Three.js é baixado só ao chegar perto da seção');
diz(pedidos.some((u) => u.includes('draco_decoder') && u.endsWith('.wasm')), 'o decodificador Draco (wasm) é buscado');
diz(pedidos.some((u) => u.endsWith('.glb')), 'o modelo Draco de 26 KB é buscado');

if (pronto) {
  // O dente aparece de verdade?
  //
  // Ler o canvas com drawImage NÃO funciona: um canvas WebGL só devolve
  // pixels depois do frame se `preserveDrawingBuffer: true`, e ligar isso
  // custaria memória e desempenho em produção só para permitir o teste.
  // A captura do Playwright passa pelo compositor, que é o que a pessoa vê.
  const caixa = await pg.locator('[data-palco]').boundingBox();
  const buf = await pg.screenshot({ clip: caixa });

  // Compara com a mesma região sem nada desenhado. Um PNG de área chapada
  // comprime a quase nada; com o dente ele fica muitas vezes maior. É um
  // proxy grosseiro, mas é robusto e não depende de decodificar imagem.
  await pg.evaluate(() => {
    const p = document.querySelector('[data-palco]');
    p.removeAttribute('data-3d');
    document.querySelector('[data-canvas]').hidden = true;
    document.querySelector('[data-estatica]').style.visibility = 'hidden';
  });
  await pg.waitForTimeout(200);
  const bufVazio = await pg.screenshot({ clip: caixa });
  await pg.evaluate(() => {
    const p = document.querySelector('[data-palco]');
    p.setAttribute('data-3d', '');
    document.querySelector('[data-canvas]').hidden = false;
    document.querySelector('[data-estatica]').style.visibility = '';
  });
  await pg.waitForTimeout(300);
  const diferenca = Math.abs(buf.length - bufVazio.length) / bufVazio.length;
  diz(diferenca > 0.25,
    `o canvas desenha forma: a captura com o dente é ${(diferenca * 100).toFixed(0)}% mais pesada que o palco vazio`);

  const fios = await pg.evaluate(() =>
    [...document.querySelectorAll('.fio-prancha')].map((f) => (f.getAttribute('d') || '').slice(0, 3)));
  diz(fios.length === 4, `4 fios criados (${fios.length})`);
  diz(fios.every((d) => d.startsWith('M')), 'todos os fios têm caminho desenhado');

  // clique num hotspot
  await pg.locator('[data-hotspot="raiz"]').click();
  await pg.waitForTimeout(1400);
  const est = await pg.evaluate(() => ({
    pressionado: document.querySelector('[data-hotspot="raiz"]')?.getAttribute('aria-pressed'),
    itemAtivo: !!document.querySelector('[data-parte="raiz"][data-ativa]'),
    pranchaAtiva: document.querySelector('[data-prancha]')?.hasAttribute('data-ativa'),
  }));
  diz(est.pressionado === 'true', 'o hotspot fica aria-pressed=true');
  diz(est.itemAtivo && est.pranchaAtiva, 'o rótulo correspondente é destacado');

  // Esperar o VALOR assentar, não um tempo fixo. O recuo é uma transição
  // CSS de 240ms disparada por atributo, e ler num instante arbitrário
  // pega o meio do caminho — foi exatamente o que aconteceu aqui antes.
  let recuou = true;
  try {
    await pg.waitForFunction(
      () => +getComputedStyle(document.querySelector('[data-parte="esmalte"]')).opacity < 0.6,
      null,
      { timeout: 4000 }
    );
  } catch { recuou = false; }
  const op = await pg.evaluate(() =>
    getComputedStyle(document.querySelector('[data-parte="esmalte"]')).opacity);
  diz(recuou, `as outras partes recuam (opacity ${op})`);
  // teclado
  await pg.locator('[data-hotspot="colo"]').focus();
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(900);
  diz(await pg.evaluate(() => document.querySelector('[data-hotspot="colo"]')?.getAttribute('aria-pressed')) === 'true',
    'o hotspot também responde ao teclado');

  // o cursor customizado segue o mouse e ficaria congelado na captura
  await pg.evaluate(() => document.querySelector('.cursor')?.remove());
  await pg.screenshot({ path: 'screenshots/_dente.png', clip: await pg.locator('[data-palco]').boundingBox() });
  console.log('  captura da prancha em screenshots/_dente.png');
}

await navegador.close();
servidor.close();
console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
