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
import { join, extname, resolve, sep } from 'node:path';

const RAIZ = resolve('dist');
const SAIDA = resolve(process.argv[2] ?? 'screenshots');
const PORTA = 4501;

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
  '.webp': 'image/webp', '.avif': 'image/avif',
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
    let caminho = resolve(RAIZ, '.' + decodeURIComponent(req.url.split('?')[0]));

    // Sem esta checagem, um pedido a /../../../algum/arquivo sai de dist/ e
    // serve qualquer arquivo da máquina enquanto o script roda. É servidor
    // local e efêmero, mas é traversal de verdade e o conserto é uma linha.
    if (caminho !== RAIZ && !caminho.startsWith(RAIZ + sep)) {
      res.writeHead(403);
      res.end('403');
      return;
    }

    if ((await stat(caminho)).isDirectory()) caminho = join(caminho, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[extname(caminho)] ?? 'application/octet-stream' });
    res.end(await readFile(caminho));
  } catch {
    res.writeHead(404);
    res.end('404');
  }
});

await mkdir(SAIDA, { recursive: true });
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

const navegador = await chromium.launch();

for (const { nome, width, height } of LARGURAS) {
  const pagina = await navegador.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);

  // Percorre a página inteira antes de fotografar. Sem isto, `loading="lazy"`
  // nunca dispara para o que está abaixo da dobra e o screenshot de página
  // inteira sai com buracos — foi exatamente assim que a imagem da seção 3
  // apareceu vazia no mobile. Depois volta ao topo.
  await pagina.evaluate(async () => {
    const passo = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    // Imagem dentro de <details> fechado (os tratamentos) não carrega até a
    // pessoa abrir o item, de propósito. Esperar por ela travava o script.
    await Promise.all(
      [...document.querySelectorAll('img')]
        .filter((img) => !img.complete && !img.closest('details:not([open])'))
        .map((img) => new Promise((r) => img.addEventListener('load', r, { once: true })))
    );
  });
  await pagina.waitForLoadState('networkidle');

  // Forçar o ESTADO FINAL de tudo que revela, e esperar assentar.
  //
  // A revelação dos títulos dispara por IntersectionObserver. No desktop o
  // Lenis intercepta `window.scrollTo`, então a varredura acima não rola de
  // verdade e os títulos só entram em cena quando o próprio Playwright rola
  // para montar a captura de página inteira — no meio da foto. O resultado
  // era um título cortado ao meio, que não existe na página real.
  //
  // A captura mostra o estado final. Quem prova que a animação ACONTECE é
  // `npm run motion`, que mede o deslocamento quadro a quadro.
  //
  // As animações PRESAS À ROLAGEM (MOTION.md §11) ficam de fora da espera:
  // elas não terminam nunca, só acompanham o scroll, e esperar por elas
  // travava o script para sempre. E são canceladas para a foto: numa
  // captura de página inteira tudo abaixo da dobra ficaria congelado no
  // estado de "antes" — a faixa de esmalte como uma fenda, o fio da
  // consulta sem desenhar. Cancelada, cada uma mostra a página parada e
  // completa, a mesma que o reduced-motion mostra.
  await pagina.evaluate(async () => {
    for (const el of document.querySelectorAll('.revela')) el.classList.add('revelado');
    const todas = document.getAnimations();
    const porRolagem = todas.filter((a) => a.timeline && a.timeline !== document.timeline);
    for (const a of porRolagem) a.cancel();
    // Parado, o relógio da consulta diria "0 min" — um número sem sentido
    // numa foto. Sem movimento ele nem existe na página; aqui também não.
    for (const r of document.querySelectorAll('.relogio')) r.style.display = 'none';
    await Promise.all(
      todas.filter((a) => !porRolagem.includes(a)).map((a) => a.finished.catch(() => {}))
    );
  });

  // O cursor customizado segue o mouse, e um screenshot não tem mouse: ele
  // fica congelado no meio da tela e vira um ponto escuro que não existe na
  // página real. Sai antes da foto.
  await pagina.evaluate(() => document.querySelector('.cursor')?.remove());

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
    if (estouro > 0) {
      for (const c of await culpados(pagina)) console.log(`    passa da largura: ${c}`);
    }
  }
}

/**
 * Quem está passando da largura.
 *
 * Medir o estouro sem dizer de onde ele vem transforma o teste num alarme
 * sem endereço — e foi o que aconteceu quando 2px apareceram do nada.
 */
async function culpados(pagina) {
  return pagina.evaluate(() => {
    const limite = document.documentElement.clientWidth;
    const fora = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Só o que passa à DIREITA. Elemento parado a -9999px (o link de
      // pular para o conteúdo) não gera barra de rolagem e não é culpado.
      if (r.right > limite + 0.5) {
        const nome =
          el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '');
        fora.push(`${nome}  left=${Math.round(r.left)} right=${Math.round(r.right)} (limite ${limite})`);
      }
    }
    return fora.slice(0, 8);
  });
}

// 360px é o piso declarado no CLAUDE.md. Conferir estouro, sem fotografar.
const estreita = await navegador.newPage({ viewport: { width: 360, height: 800 } });
await estreita.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' });
const estouro360 = await estreita.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
console.log(`\n  estouro horizontal em 360px: ${estouro360}px`);
if (estouro360 > 0) {
  for (const c of await culpados(estreita)) console.log(`    passa da largura: ${c}`);
}

await navegador.close();
servidor.close();
console.log('\nok');
