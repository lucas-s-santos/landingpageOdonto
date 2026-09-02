/**
 * Checagem final do MOTION.md, automatizada.
 *
 *   npm run motion
 *
 * Verifica o que a seção 10 do MOTION.md exige e o que dá para provar por
 * máquina:
 *
 *   - a máscara de linha da abertura de fato DESLOCA e termina em zero
 *     (não basta estar visível no fim: fade sem movimento passaria)
 *   - o accordion anima a altura, abre, e abrir um fecha o outro
 *   - os títulos de seção ganham linhas mascaradas
 *   - sob prefers-reduced-motion a página está COMPLETA e imóvel, e o
 *     bundle de movimento nem chega a ser baixado
 *   - o cursor só existe onde deve existir
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const RAIZ = resolve('dist');
const PORTA = 4502;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm',
};
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

const url = `http://localhost:${PORTA}/`;
const navegador = await chromium.launch();
let falhou = false;
const diz = (ok, texto) => { if (!ok) falhou = true; console.log(`  ${ok ? 'ok   ' : 'FALHA'}  ${texto}`); };

// ---------------------------------------------------------------- movimento
console.log('com movimento:');
{
  const pg = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  const scripts = [];
  pg.on('request', (q) => { if (q.resourceType() === 'script') scripts.push(q.url().split('/').pop()); });
  await pg.goto(url, { waitUntil: 'domcontentloaded' });

  // A abertura anima em CSS: o elemento que se move é o <span> interno de
  // cada `.linha`, e a `.linha` é a máscara com overflow hidden.
  const amostras = [];
  for (let i = 0; i < 7; i++) {
    amostras.push(await pg.evaluate(() =>
      [...document.querySelectorAll('.abertura__texto h1 .linha > span')].map((l) =>
        Math.round(new DOMMatrixReadOnly(getComputedStyle(l).transform).m42))));
    await pg.waitForTimeout(160);
  }
  diz(amostras.some((a) => a.some((v) => Math.abs(v) > 2)),
    'a abertura desloca as linhas do título (máscara de linha, não fade)');
  // Esperar as animações TERMINAREM em vez de contar amostras: a última
  // linha tem 0,38 s de atraso mais 0,9 s de duração, e sete amostras de
  // 160 ms acabam antes disso.
  await pg.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('.abertura__texto h1 .linha > span')]
        .flatMap((l) => l.getAnimations())
        .map((a) => a.finished.catch(() => {}))
    )
  );
  const fim = await pg.evaluate(() =>
    [...document.querySelectorAll('.abertura__texto h1 .linha > span')].map((l) =>
      Math.round(new DOMMatrixReadOnly(getComputedStyle(l).transform).m42)));
  diz(fim.every((v) => v === 0), `e todas terminam em zero (${fim.join(', ')})`);
  diz(await pg.evaluate(() =>
    [...document.querySelectorAll('.abertura__texto h1 .linha')].every(
      (l) => getComputedStyle(l).overflow === 'hidden')),
    'cada linha é uma máscara de verdade (overflow hidden)');
  diz(await pg.evaluate(() => document.querySelectorAll('h2.revela').length > 0),
    'títulos de seção entram no estado de revelação');
  diz(await pg.evaluate(() => !!document.querySelector('.cursor')), 'cursor existe no desktop');

  await pg.waitForTimeout(1200);
  const alturas = [];
  // `locator.click()` espera o elemento ficar estável, e com a seção do
  // dente pinada nada fica parado — a espera consumia a animação inteira
  // antes da primeira amostra. Disparar direto no DOM é o que este teste
  // precisa: ele mede a animação, não a interação.
  await pg.evaluate(() =>
    document.querySelector('details.item summary').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )
  );
  for (let i = 0; i < 5; i++) {
    alturas.push(await pg.evaluate(() =>
      Math.round(document.querySelector('details.item .item__corpo')?.getBoundingClientRect().height ?? 0)));
    await pg.waitForTimeout(130);
  }
  diz(alturas[0] < alturas.at(-1) && alturas.at(-1) > 20, `accordion anima a altura (${alturas.join(' → ')})`);
  diz(await pg.evaluate(() => document.querySelector('details.item')?.open === true), 'e fica aberto no fim');

  await pg.evaluate(() =>
    document.querySelectorAll('details.item summary')[2].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )
  );
  await pg.waitForTimeout(1200);
  diz(await pg.evaluate(() => document.querySelectorAll('details.item[open]').length) === 1,
    'abrir um fecha o outro');
  diz(scripts.some((s) => s.startsWith('movimento')), 'o bundle de movimento é baixado');

  // A revelação do título tem que ACONTECER, não só existir a classe.
  await pg.evaluate(() => document.querySelector('#tratamentos h2')?.scrollIntoView({ block: 'center' }));
  let revelou = true;
  try {
    await pg.waitForFunction(
      () => document.querySelector('#tratamentos h2')?.classList.contains('revelado'),
      null, { timeout: 4000 });
  } catch { revelou = false; }
  diz(revelou, 'o título revela ao entrar na viewport');
  // Compara o estado ANTES e DEPOIS em vez de interpretar o formato do
  // valor: o `clip-path` computado varia de forma entre navegadores, e o
  // que importa é que ele deixou de cortar.
  const antesDepois = await pg.evaluate(async () => {
    const h = document.querySelector('#tratamentos h2');
    if (!h) return null;
    await Promise.all(h.getAnimations().map((a) => a.finished.catch(() => {})));
    const depois = getComputedStyle(h).clipPath;
    const sonda = document.createElement('h2');
    sonda.className = 'revela';
    sonda.style.position = 'absolute';
    sonda.textContent = 'x';
    h.parentElement.appendChild(sonda);
    const antes = getComputedStyle(sonda).clipPath;
    sonda.remove();
    return { antes, depois };
  });
  diz(
    !!antesDepois && antesDepois.antes !== antesDepois.depois,
    `e a máscara abre: ${antesDepois?.antes} → ${antesDepois?.depois}`
  );

  // GSAP não pode estar no caminho do celular.
  diz(scripts.some((s) => s.startsWith('gsap')), 'no desktop o GSAP é carregado');
  await pg.close();

  const mob = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  const scriptsMob = [];
  mob.on('request', (q) => { if (q.resourceType() === 'script') scriptsMob.push(q.url().split('/').pop()); });
  await mob.goto(url, { waitUntil: 'networkidle' });

  await mob.waitForTimeout(2500);
  console.log('\nno celular:');
  diz(!scriptsMob.some((s) => s.startsWith('gsap')), 'GSAP NÃO é baixado');
  diz(!scriptsMob.some((s) => s.startsWith('lenis')), 'Lenis NÃO é baixado');
  diz(scriptsMob.some((s) => s.startsWith('movimento')), 'a camada base é baixada');
  diz(!(await mob.evaluate(() => !!document.querySelector('.cursor'))), 'não há cursor customizado');
  await mob.close();
}

// --------------------------------------------------------- reduced motion
console.log('\ncom prefers-reduced-motion: reduce:');
{
  const pg = await navegador.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const scripts = [];
  pg.on('request', (q) => { if (q.resourceType() === 'script') scripts.push(q.url().split('/').pop()); });
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(1800);

  diz(!scripts.some((s) => s.startsWith('movimento')),
    'o bundle de movimento NÃO é baixado (0 byte de JS de animação)');
  diz(!(await pg.evaluate(() => !!document.querySelector('.cursor'))), 'não há cursor customizado');
  const est = await pg.evaluate(() => ({
    h2ocultos: [...document.querySelectorAll('h2')].filter((h) =>
      h.getBoundingClientRect().height === 0 || +getComputedStyle(h).opacity < 0.9).length,
    linhas: [...document.querySelectorAll('.abertura__texto h1 .linha')].filter((l) =>
      l.getBoundingClientRect().height > 0 && +getComputedStyle(l).opacity > 0.9).length,
    totalLinhas: document.querySelectorAll('.abertura__texto h1 .linha').length,
    texto: document.body.innerText.length,
  }));
  diz(est.h2ocultos === 0, `nenhum título oculto (${est.h2ocultos} de ${await pg.evaluate(() => document.querySelectorAll('h2').length)})`);
  diz(est.linhas === est.totalLinhas, `todas as linhas da abertura visíveis (${est.linhas}/${est.totalLinhas})`);
  diz(est.texto > 4000, `a página está completa: ${est.texto} caracteres de texto visível`);
  await pg.close();
}

await navegador.close();
servidor.close();
console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
