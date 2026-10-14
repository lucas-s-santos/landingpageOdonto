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
const PORTA = 4503;
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
  '.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.png':'image/png',
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
// Falhar ALTO se a porta estiver ocupada.
//
// Antes isto era `listen(PORTA, r)` sem tratar erro, e o script usava a
// porta 4321 — a mesma do `astro dev`. Com um servidor de dev rodando, as
// capturas vinham DELE e não de `dist/`, com a barra de ferramentas do Astro
// no meio da página. Um teste que mede a coisa errada é pior que nenhum.
await new Promise((resolver, rejeitar) => {
  servidor.once('error', (e) =>
    rejeitar(
      new Error(
        `não consegui subir o servidor de teste na porta ${PORTA} (${e.code}). ` +
          `Há outro processo nela — talvez um \`astro dev\`. Encerre-o ou mude PORTA.`
      )
    )
  );
  servidor.listen(PORTA, () => resolver(undefined));
});

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

// Sem o 3D, marcador e botão que não fazem nada não podem aparecer.
diz(await pg.evaluate(() =>
  [...document.querySelectorAll('[data-hotspot]')].every((h) => h.hidden) &&
  document.querySelector('[data-controles]')?.hidden === true),
  'antes do 3D, os marcadores e os botões "Ver por dentro" estão escondidos');

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
  // VER POR DENTRO — os controles de verdade, por teclado. Os marcadores
  // sobre o modelo são atalho de ponteiro (fora do Tab, aria-hidden).
  diz(await pg.evaluate(() => !document.querySelector('[data-controles]').hidden),
    'com o 3D montado, a fileira "Ver por dentro" aparece');
  const legendaAntes = await pg.evaluate(() => document.querySelector('[data-estado-corte]').textContent.trim());
  await pg.locator('[data-ver="colo"]').focus();
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(900);
  const porDentro = await pg.evaluate(() => ({
    botao: document.querySelector('[data-ver="colo"]').getAttribute('aria-pressed'),
    inteiro: document.querySelector('[data-ver=""]').getAttribute('aria-pressed'),
    marcador: document.querySelector('[data-hotspot="colo"]').getAttribute('aria-pressed'),
    legenda: document.querySelector('[data-estado-corte]').textContent.trim(),
  }));
  diz(porDentro.botao === 'true' && porDentro.inteiro === 'false' && porDentro.marcador === 'true',
    '"Colo do dente" pelo teclado: o botão e o marcador ficam pressionados');
  diz(porDentro.legenda !== legendaAntes && porDentro.legenda.startsWith('Em corte'),
    `a legenda diz o que está aceso: "${porDentro.legenda.slice(0, 48)}..."`);
  await pg.locator('[data-ver=""]').click();
  await pg.waitForTimeout(700);
  diz(await pg.evaluate(() => !document.querySelector('[data-prancha]').hasAttribute('data-ativa') &&
    !document.querySelector('[data-estado-corte]').textContent.trim().startsWith('Em corte') &&
    document.querySelector('[data-ver=""]').getAttribute('aria-pressed') === 'true'),
    '"Inteiro" fecha o corte e a legenda volta ao convite');

  // TOCAR NO DENTE. Um toque curto no próprio modelo escolhe a parte que
  // está embaixo do dedo — aqui, em cima da coroa, perto do marcador do
  // esmalte (mas fora dele, para o clique não cair no botão).
  const toque = await pg.evaluate(async () => {
    const canvas = document.querySelector('[data-canvas]');
    const m = document.querySelector('[data-hotspot="esmalte"]').getBoundingClientRect();
    const x = m.left + m.width / 2 - 4;
    const y = m.top + m.height / 2 + 26;
    const base = { bubbles: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', isPrimary: true };
    canvas.dispatchEvent(new PointerEvent('pointerdown', base));
    canvas.dispatchEvent(new PointerEvent('pointerup', base));
    await new Promise((r) => setTimeout(r, 600));
    return document.querySelector('[data-prancha]').hasAttribute('data-ativa')
      ? document.querySelector('[data-hotspot][aria-pressed="true"]')?.dataset.hotspot
      : null;
  });
  diz(toque === 'esmalte' || toque === 'dentina',
    `tocar na coroa escolhe uma parte da coroa (${toque})`);
  await pg.locator('[data-ver=""]').click();
  await pg.waitForTimeout(1600);

  // --- os fios nunca podem passar por cima do texto ---------------
  //
  // Eles saem de pontos que se movem com a rotação e chegam a rótulos
  // parados. Numa janela estreita o corredor entre a prancha e a coluna de
  // texto some, e o fio passava por cima das letras — medido em 920px, o fio
  // chegava a x=543 com o texto começando em 539.
  const medirFios = () =>
    pg.evaluate(() => {
      const svg = document.querySelector('[data-fios]');
      const rSvg = svg.getBoundingClientRect();
      const textos = [...document.querySelectorAll('.prancha__item dd, .prancha__item dt')].map((e) => {
        const b = e.getBoundingClientRect();
        return { x1: b.left, y1: b.top, x2: b.right, y2: b.bottom };
      });
      let cruzam = 0;
      let visiveis = 0;
      for (const p of svg.querySelectorAll('path')) {
        // Fio escondido não cruza nada, e sem `d` não tem geometria.
        if (+getComputedStyle(p).opacity === 0 || !p.getAttribute('d')) continue;
        visiveis++;
        const L = p.getTotalLength();
        for (let i = 0; i <= 80; i++) {
          const pt = p.getPointAtLength((L * i) / 80);
          const x = rSvg.left + pt.x;
          const y = rSvg.top + pt.y;
          if (textos.some((t) => x > t.x1 + 2 && x < t.x2 - 2 && y > t.y1 + 2 && y < t.y2 - 2)) cruzam++;
        }
      }
      return { cruzam, visiveis };
    });

  const largo = await medirFios();
  diz(largo.cruzam === 0, `em 1440px nenhum fio passa por cima do texto (${largo.visiveis} fios visíveis)`);

  await pg.setViewportSize({ width: 960, height: 900 });
  await pg.evaluate(() => document.querySelector('#anatomia').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(1200);
  const estreito = await medirFios();
  diz(
    estreito.cruzam === 0,
    `em 960px também não (${estreito.visiveis} fios visíveis — sem corredor, o fio some)`
  );
  await pg.setViewportSize({ width: 1440, height: 900 });
  await pg.waitForTimeout(600);

  // o cursor customizado segue o mouse e ficaria congelado na captura
  // PARADO, NÃO DESENHA. O laço só renderiza quando algo se move; com a
  // cena quieta, a placa de vídeo descansa. Conta as chamadas de desenho do
  // WebGL até achar uma janela de 1,5s sem nenhuma (no máximo 25s — o WebGL
  // por software deste teste anda a poucos quadros por segundo).
  const parado = await pg.evaluate(async () => {
    const gl = document.querySelector('[data-canvas]').getContext('webgl2');
    if (!gl) return -1;
    let n = 0;
    const original = gl.drawElements.bind(gl);
    gl.drawElements = (...a) => {
      n++;
      return original(...a);
    };
    const inicio = performance.now();
    while (performance.now() - inicio < 25000) {
      n = 0;
      await new Promise((r) => setTimeout(r, 1500));
      if (n === 0) return 0;
    }
    return n;
  });
  diz(parado === 0, `com a cena parada, nenhum quadro é desenhado (${parado} chamadas na última janela)`);

  await pg.evaluate(() => document.querySelector('.cursor')?.remove());
  await pg.screenshot({ path: 'screenshots/_dente.png', clip: await pg.locator('[data-palco]').boundingBox() });
  console.log('  captura da prancha em screenshots/_dente.png');
}

await navegador.close();
servidor.close();
console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
