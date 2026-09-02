/**
 * Lighthouse em perfil MOBILE sobre `dist/`.
 *
 *   npm run lighthouse
 *
 * O piso do CLAUDE.md é performance >= 90 no celular. Roda contra o build
 * de produção servido localmente, com o Chromium do Playwright — não precisa
 * de Chrome instalado.
 *
 * Números locais são otimistas: aqui não há latência de rede real nem CPU de
 * celular de verdade, ainda que o Lighthouse simule as duas. Serve para
 * pegar regressão e problema estrutural, não para prometer o número que o
 * cliente vai ver.
 */
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const RAIZ = resolve('dist');
const PORTA = 4504;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.json': 'application/json',
};
const servidor = createServer(async (req, res) => {
  try {
    let p = resolve(RAIZ, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (p !== RAIZ && !p.startsWith(RAIZ + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
    res.writeHead(200, {
      'Content-Type': MIME[extname(p)] ?? 'application/octet-stream',
      // o deploy real serve comprimido; sem isto o número sai injustamente ruim
      'Cache-Control': 'public, max-age=31536000',
    });
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

// SEM flags de GL por software.
//
// `--use-angle=swiftshader` (necessário para testar WebGL no headless, e é
// o que scripts/dente-check.mjs usa) força a rasterização a acontecer na
// CPU. Toda composição fica ~5x mais cara e o Lighthouse credita isso à
// página: com a flag, 84 e 570 ms de TBT; sem ela, 98 e 0 ms. O número com
// a flag não descrevia a página, descrevia o ambiente de teste.
const navegador = await chromium.launch({ args: ['--remote-debugging-port=9222'] });

const resultado = await lighthouse(
  `http://localhost:${PORTA}/`,
  { port: 9222, output: ['html', 'json'], logLevel: 'error' },
  undefined
);

const lhr = resultado.lhr;
await writeFile('screenshots/lighthouse.html', resultado.report[0]);

const cats = ['performance', 'accessibility', 'best-practices', 'seo'];
console.log('Lighthouse — perfil mobile\n');
let falhou = false;
for (const c of cats) {
  const nota = Math.round((lhr.categories[c]?.score ?? 0) * 100);
  const piso = c === 'performance' ? 90 : 90;
  const ok = nota >= piso;
  if (!ok) falhou = true;
  console.log(`  ${ok ? 'ok   ' : 'FALHA'}  ${lhr.categories[c].title.padEnd(16)} ${nota}`);
}

console.log('\n  métricas:');
for (const id of ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index']) {
  const a = lhr.audits[id];
  if (a) console.log(`    ${a.title.padEnd(30)} ${a.displayValue ?? '—'}`);
}

const problemas = Object.values(lhr.audits)
  .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
  .slice(0, 12);
if (problemas.length) {
  console.log('\n  auditorias abaixo de 0.9:');
  for (const a of problemas) {
    console.log(`    ${(a.score ?? 0).toFixed(2)}  ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`);
  }
}

console.log('\n  relatório completo: screenshots/lighthouse.html');
await navegador.close();
servidor.close();
console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
