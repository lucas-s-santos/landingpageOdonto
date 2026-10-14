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
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
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
  // Os momentos presos à rolagem são CSS: rodam no celular sem biblioteca.
  diz(await mob.evaluate(() => (document.querySelector('.pilha__folha')?.getAnimations() ?? [])
    .some((a) => a.timeline?.constructor?.name === 'ViewTimeline')),
    'a pilha da esterilização recua por rolagem, sem JavaScript');
  await mob.close();
}

// ------------------------------------------- a entrada e o fecho do rodapé
console.log('\na entrada e o encerramento:');
{
  const pg = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  await pg.route(/\.(mp4|webm|glb)$/, (r) => r.abort());
  await pg.goto(url, { waitUntil: 'commit' });
  await pg.waitForSelector('.entrada', { state: 'attached' });
  const naHora = await pg.evaluate(() => {
    const e = document.querySelector('.entrada');
    const c = getComputedStyle(e);
    return { display: c.display, nome: c.animationName, eventos: c.pointerEvents };
  });
  diz(naHora.display !== 'none' && naHora.nome === 'entrada-sobe' && naHora.eventos === 'none',
    'a vinheta de entrada cobre a tela no começo e deixa clicar através dela');
  // A abertura NÃO espera a vinheta: o título já está subindo por baixo.
  const tituloAnimando = await pg.evaluate(() =>
    document.querySelector('.abertura__texto h1 .linha > span').getAnimations().length > 0);
  diz(tituloAnimando, 'a abertura anima por baixo dela, sem esperar (o LCP não atrasa)');
  await pg.evaluate(() =>
    Promise.all(document.querySelector('.entrada').getAnimations().map((a) => a.finished.catch(() => {}))));
  diz(await pg.evaluate(() => getComputedStyle(document.querySelector('.entrada')).visibility === 'hidden'),
    'e some de vez no fim');
  // No celular ela não existe: custava ~4 pontos de Lighthouse mobile.
  {
    const cel = await navegador.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await cel.route(/\.(mp4|webm|glb)$/, (r) => r.abort());
    await cel.goto(url, { waitUntil: 'commit' });
    await cel.waitForSelector('.entrada', { state: 'attached' });
    diz(await cel.evaluate(() => getComputedStyle(document.querySelector('.entrada')).display === 'none'),
      'no celular não há vinheta: a página abre direto');
    await cel.close();
  }

  // O ENCERRAMENTO: a faixa fica parada no pé da janela, EMBAIXO da página,
  // e é descoberta no fim da rolagem. Três provas: no começo ela está
  // coberta; no fim, aparece; no meio do trecho final, a marca está pela
  // metade — o efeito acompanha a rolagem.
  const pecas = await pg.evaluate(() => {
    const letra = getComputedStyle(document.querySelector('.encerramento__palavra path'));
    const ponto = getComputedStyle(document.querySelector('.encerramento__palavra circle'));
    const fio = getComputedStyle(document.querySelector('.encerramento__fio'));
    return [letra, ponto, fio].map((c) => `${c.animationName}@${c.animationTimeline}`);
  });
  diz(pecas.join() === 'encerra-letra@scroll(root),encerra-ponto@scroll(root),encerra-fio@scroll(root)',
    `o encerramento: letras, ponto e fio presos à rolagem (${pecas.join(', ')})`);
  const quemEstaNoPe = () => pg.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight - 30);
    return el?.closest('.encerramento') ? 'faixa' : el?.closest('.pagina') ? 'pagina' : String(el?.tagName);
  });
  await pg.evaluate(() => scrollTo(0, 0));
  await pg.waitForTimeout(300);
  diz(await quemEstaNoPe() === 'pagina', 'no começo a faixa está coberta pela página');
  const { max, h } = await pg.evaluate(() => ({
    max: document.documentElement.scrollHeight - innerHeight,
    h: document.querySelector('.encerramento').offsetHeight,
  }));
  await pg.evaluate((y) => scrollTo(0, y), Math.round(max - h * 0.5));
  await pg.waitForTimeout(500);
  const noMeio = await pg.evaluate(() => getComputedStyle(document.querySelector('.encerramento__fio')).scale);
  await pg.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await pg.waitForTimeout(600);
  const noFim = await pg.evaluate(() => ({
    letra: getComputedStyle(document.querySelector('.encerramento__palavra path')).translate,
    fio: getComputedStyle(document.querySelector('.encerramento__fio')).scale,
    estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  diz(await quemEstaNoPe() === 'faixa', `no fim a página sobe e descobre a faixa (${h}px de altura)`);
  diz(noMeio !== '1' && noMeio !== '1 1' && noMeio !== 'none',
    `no meio do trecho final o fio ainda está correndo (scale ${noMeio})`);
  diz((noFim.letra === '0px' || noFim.letra === 'none') && (noFim.fio === '1' || noFim.fio === '1 1' || noFim.fio === 'none'),
    `no fim a marca está inteira e o fio chega à borda (${noFim.letra}, ${noFim.fio})`);
  diz(noFim.estouro <= 0, `o fio para na borda da janela, sem rolagem lateral (${noFim.estouro}px)`);
  await pg.close();
}

// ----------------------------- a abertura não invade a seção seguinte
// O texto da abertura tem parallax no desktop. Quando ele descia atrasado
// (`yPercent: 40`), o botão e o "Aberta agora" passavam por cima do título
// da seção 2 em telas baixas: 91px em 1280×720. Percorre a rolagem da
// abertura e mede. 1093×614 é um notebook 1366×768 com zoom de 125%.
console.log('\na abertura e a seção seguinte:');
for (const [vw, vh] of [[1280, 720], [1024, 768], [1093, 614]]) {
  const pg = await navegador.newPage({ viewport: { width: vw, height: vh } });
  await pg.route(/\.(mp4|webm|glb)$/, (r) => r.abort());
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(3500); // o GSAP entra no tempo ocioso
  let pior = -Infinity;
  for (let y = 0; y <= vh * 1.3; y += 40) {
    await pg.evaluate((y) => scrollTo(0, y), y);
    await pg.waitForTimeout(50);
    pior = Math.max(pior, await pg.evaluate(() =>
      document.querySelector('.abertura__texto').getBoundingClientRect().bottom -
      document.querySelector('#atendimento-titulo').getBoundingClientRect().top));
  }
  diz(pior <= 0, `em ${vw}×${vh} o texto da abertura nunca passa por cima da seção 2 (folga mínima ${Math.round(-pior)}px)`);
  await pg.close();
}

// ------------------------------------------------- a abertura e o menu
console.log('\na abertura e o menu de dúvidas:');
{
  const pg = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(url, { waitUntil: 'commit' });
  await pg.waitForSelector('.abertura__cortina');
  // O ponto de partida vem dos quadros-chave da própria animação, não de
  // uma amostra no carregamento: numa máquina rápida a primeira amostra já
  // pegava a cortina em 72% do caminho e o teste falhava sem defeito nenhum.
  const cortinaNoInicio = await pg.evaluate(() => {
    const a = document.querySelector('.abertura__cortina').getAnimations()[0];
    const de = a?.effect?.getKeyframes()[0]?.transform ?? 'none';
    return de === 'none' ? 0 : new DOMMatrixReadOnly(de).a;
  });
  // Espera a entrada TERMINAR, em vez de contar tempo: o relógio começa
  // quando o estilo aplica, que pode ser bem depois do primeiro byte.
  await pg.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('.abertura__cortina, .rotulo-hero *')]
        .flatMap((el) => el.getAnimations())
        .filter((a) => a.timeline === document.timeline)
        .map((a) => a.finished.catch(() => {}))
    )
  );
  const fim = await pg.evaluate(() => ({
    cortina: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.abertura__cortina')).transform).a,
    rotulo: +getComputedStyle(document.querySelector('.rotulo-hero__texto')).opacity,
    fioV: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.rotulo-hero__fio--v')).transform).d,
    estado: (() => { const e = document.querySelector('.abertura__estado'); return e && !e.hidden ? e.textContent.trim() : null; })(),
  }));
  // Todos os recuos do `inset()` em zero, seja qual for a forma que o
  // navegador escolheu para escrever: `inset(0px)`, `inset(0px 0px 0%)`...
  // A cortina é uma folha que recolhe por scaleX: cobre tudo no começo
  // (escala perto de 1) e some no fim (0). Só `transform`, de propósito —
  // ver o comentário em Abertura.astro.
  diz(cortinaNoInicio > 0.5 && fim.cortina === 0,
    `a cortina recolhe e descobre o vídeo (escala ${cortinaNoInicio.toFixed(2)} → ${fim.cortina})`);
  diz(fim.fioV === 1 && fim.rotulo === 1,
    `o fio desce e o rótulo da coroa aparece no fim da entrada (opacidade ${fim.rotulo})`);
  diz(!!fim.estado, `aberta/fechada embaixo do botão: "${fim.estado}"`);

  // O menu: abre, prende o foco, fecha no Esc e devolve o foco ao botão.
  await pg.click('[data-abre-indice]');
  await pg.waitForTimeout(700);
  const aberto = await pg.evaluate(() => ({
    open: document.querySelector('#indice').open,
    foco: document.activeElement?.closest('#indice') !== null,
    itens: document.querySelectorAll('#indice .indice__ligacao').length,
  }));
  diz(aberto.open && aberto.foco, `o menu abre e o foco entra nele (${aberto.itens} dúvidas)`);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(700);
  diz(await pg.evaluate(() => !document.querySelector('#indice').open &&
    document.activeElement?.hasAttribute('data-abre-indice')), 'Esc fecha e o foco volta ao botão');

  // Cada dúvida leva à seção certa, com o título VISÍVEL. Já houve um
  // defeito em que o salto deixava o título preso no estado de "antes" da
  // revelação — invisível, embora a página tivesse rolado certo.
  const quebrados = [];
  for (const ancora of await pg.evaluate(() =>
    [...document.querySelectorAll('#indice [data-ancora]')].map((a) => a.dataset.ancora))) {
    await pg.click('[data-abre-indice]');
    await pg.waitForTimeout(600);
    await pg.click(`#indice a[data-ancora="${ancora}"]`);
    await pg.waitForTimeout(1900);
    const r = await pg.evaluate((id) => {
      const h = document.getElementById(id);
      const t = h.getBoundingClientRect().top;
      return { naTela: t >= -1 && t < innerHeight, visivel: h.classList.contains('revelado') || !h.classList.contains('revela'), foco: document.activeElement === h };
    }, ancora);
    if (!(r.naTela && r.visivel && r.foco)) quebrados.push(`${ancora} ${JSON.stringify(r)}`);
  }
  diz(quebrados.length === 0, `cada dúvida leva ao título certo, visível e com foco${quebrados.length ? ': ' + quebrados.join('; ') : ''}`);
  await pg.close();

  const mob = await navegador.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await mob.goto(url, { waitUntil: 'networkidle' });
  await mob.waitForTimeout(2500);
  await mob.tap('[data-abre-indice]');
  await mob.waitForTimeout(700);
  await mob.tap('#indice a[data-ancora="estrutura-titulo"]');
  await mob.waitForTimeout(1900);
  const m = await mob.evaluate(() => {
    const h = document.getElementById('estrutura-titulo');
    return { topo: Math.round(h.getBoundingClientRect().top), revelado: h.classList.contains('revelado') };
  });
  diz(m.revelado && m.topo >= 0, `no celular também: título revelado e inteiro na tela (topo ${m.topo}px)`);
  await mob.close();
}

// ------------------------------------------------------- presos à rolagem
// MOTION.md §11. Duas classes de defeito que já aconteceram e que este
// bloco existe para não deixar voltar:
//
//   1. O minificador do build juntava `animation-timeline` dentro do atalho
//      `animation:`, o Chrome descartava o atalho e a animação morria SEM
//      ERRO — no Chrome 151, cinco dos seis momentos saíam `animation:
//      none`. Por isso aqui se confere a animação viva, ligada a uma
//      ViewTimeline, e não só que o CSS existe.
//   2. A pilha da esterilização soltava a última prancha primeiro, e o
//      miolo da anterior aparecia embaixo dela.
console.log('\npresos à rolagem (MOTION.md §11):');
{
  const pg = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(url, { waitUntil: 'networkidle' });

  const vivas = await pg.evaluate(() => {
    const porRolagem = (el, nome) =>
      !!el && el.getAnimations().some(
        (a) => a.animationName === nome && a.timeline?.constructor?.name === 'ViewTimeline');
    const fio = getComputedStyle(document.querySelector('.etapas'), '::before');
    return {
      'abertura: a câmera chega perto': porRolagem(document.querySelector('.abertura__cena video'), 'chegar-perto'),
      'abertura: o rótulo se apaga': porRolagem(document.querySelector('.rotulo-hero'), 'apagar-rotulo'),
      'como atendemos: a frase acende': porRolagem(document.querySelector('.fecho__palavra'), 'acender'),
      'esmalte: a fenda abre': (() => {
        const t = getComputedStyle(document.querySelector('.textura'), '::before');
        return t.animationName === 'recolher-tira' && t.animationTimeline === '--fenda';
      })(),
      'estrutura: a prancha recua': porRolagem(document.querySelector('.pilha__folha'), 'recuar'),
      'consulta: a etapa acende': porRolagem(document.querySelector('.etapa__numero'), 'acender-etapa'),
      'consulta: o relógio conta': porRolagem(document.querySelector('.relogio__numero'), 'relogio-consulta'),
      'consulta: o fio desenha': fio.animationName === 'desenhar-fio' && fio.animationTimeline === '--etapas',
    };
  });
  for (const [nome, ok] of Object.entries(vivas)) diz(ok, `${nome} — animação viva, presa à rolagem`);

  // O estado apagado da frase precisa passar AA para texto grande (3:1).
  const fecho = await pg.evaluate(() => {
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((c) => {
        c /= 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const p = document.querySelector('.fecho__palavra');
    const op = +getComputedStyle(p).opacity;
    const tinta = getComputedStyle(p).color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const osso = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const mist = `rgb(${tinta.map((c, i) => Math.round(c * op + osso[i] * (1 - op))).join(',')})`;
    const a = lum(mist), b = lum(`rgb(${osso.join(',')})`);
    return { op, razao: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), px: parseFloat(getComputedStyle(p).fontSize) };
  });
  diz(fecho.op < 1 && fecho.razao >= 3 && fecho.px >= 24,
    `a frase apagada (opacidade ${fecho.op}) dá ${fecho.razao.toFixed(2)}:1 em ${fecho.px}px — AA de texto grande`);

  // A pilha sai inteira: percorre a lista e mede se alguma prancha anterior
  // aparece abaixo do fundo da última.
  const { ini, fim } = await pg.evaluate(() => {
    const r = document.querySelector('.pilha').getBoundingClientRect();
    return { ini: r.top + scrollY, fim: r.bottom + scrollY };
  });
  let vazou = 0;
  for (let y = ini - 900; y < fim; y += 60) {
    await pg.evaluate((y) => window.scrollTo(0, y), y);
    await pg.waitForTimeout(40);
    vazou = Math.max(vazou, await pg.evaluate(() => {
      const itens = [...document.querySelectorAll('.pilha__item')];
      const ult = itens.at(-1).getBoundingClientRect();
      if (ult.top >= innerHeight || ult.bottom <= 0) return 0;
      return Math.max(0, ...itens.slice(0, -1).map((it) =>
        Math.min(it.getBoundingClientRect().bottom, innerHeight) - Math.max(ult.bottom, 0)));
    }));
  }
  diz(vazou <= 2, `a pilha sai inteira: nenhuma prancha aparece embaixo da última (pior ${Math.round(vazou)}px)`);
  await pg.close();

  // No celular as pranchas soltavam em momentos diferentes (a altura do
  // texto variava) e o miolo de uma aparecia por cima da seguinte. Mede,
  // em cada passo da rolagem: com a prancha seguinte já presa, quanto da
  // anterior aparece além da própria aba. Tem que ser zero.
  for (const [vw, vh] of [[390, 844], [360, 740]]) {
    const mob = await navegador.newPage({ viewport: { width: vw, height: vh }, isMobile: true, hasTouch: true });
    await mob.route(/\.(mp4|webm)$/, (r) => r.abort());
    await mob.goto(url, { waitUntil: 'domcontentloaded' });
    await mob.evaluate(() => document.fonts.ready);
    const faixa = await mob.evaluate(() => {
      const r = document.querySelector('.pilha').getBoundingClientRect();
      return { ini: r.top + scrollY, fim: r.bottom + scrollY };
    });
    let pior = 0;
    for (let y = faixa.ini - vh; y < faixa.fim; y += 30) {
      await mob.evaluate((y) => window.scrollTo(0, y), y);
      await mob.waitForTimeout(30);
      pior = Math.max(pior, await mob.evaluate(() => {
        const itens = [...document.querySelectorAll('.pilha__item')];
        if (getComputedStyle(itens[0]).position !== 'sticky') return 0;
        const css = getComputedStyle(document.querySelector('.pilha'));
        const px = (v) => parseFloat(v) * (v.endsWith('rem') ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1);
        const degrau = px(css.getPropertyValue('--degrau').trim());
        const topo = px(css.getPropertyValue('--topo').trim());
        let exposto = 0;
        for (let k = 0; k < itens.length - 1; k++) {
          const a = itens[k].getBoundingClientRect();
          const b = itens[k + 1].getBoundingClientRect();
          const presa = b.top <= topo + (k + 1) * degrau + 1;
          if (presa && b.top < innerHeight && a.bottom > 0) exposto = Math.max(exposto, b.top - a.top - degrau);
        }
        return exposto;
      }));
    }
    diz(pior <= 2, `em ${vw}px a pilha não deixa o miolo de uma prancha aparecer por cima da seguinte (pior ${Math.round(pior)}px)`);
    await mob.close();
  }
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
    // O título do menu de dúvidas fica de fora: com o <dialog> fechado ele
    // está oculto, como tem que estar.
    h2ocultos: [...document.querySelectorAll('h2')].filter((h) => !h.closest('dialog')).filter((h) =>
      h.getBoundingClientRect().height === 0 || +getComputedStyle(h).opacity < 0.9).length,
    linhas: [...document.querySelectorAll('.abertura__texto h1 .linha')].filter((l) =>
      l.getBoundingClientRect().height > 0 && +getComputedStyle(l).opacity > 0.9).length,
    totalLinhas: document.querySelectorAll('.abertura__texto h1 .linha').length,
    texto: document.body.innerText.length,
  }));
  diz(est.h2ocultos === 0, `nenhum título oculto (${est.h2ocultos} de ${await pg.evaluate(() => document.querySelectorAll('main h2, footer h2').length)})`);
  diz(est.linhas === est.totalLinhas, `todas as linhas da abertura visíveis (${est.linhas}/${est.totalLinhas})`);
  diz(est.texto > 4000, `a página está completa: ${est.texto} caracteres de texto visível`);

  // Os momentos presos à rolagem não podem rodar aqui. A regra global de
  // reduced-motion só zera DURAÇÃO, e animação de rolagem ignora duração —
  // por isso cada uma mora num @media (prefers-reduced-motion:
  // no-preference). Isto confere que ficou mesmo de fora.
  const imovel = await pg.evaluate(() => {
    const comRolagem = [...document.querySelectorAll('*')].filter((el) =>
      el.getAnimations().some((a) => a.timeline?.constructor?.name === 'ViewTimeline')).length;
    return {
      comRolagem,
      palavrasApagadas: [...document.querySelectorAll('.fecho__palavra')].filter(
        (p) => +getComputedStyle(p).opacity < 1).length,
      pilhaGrudada: [...document.querySelectorAll('.pilha__item')].filter(
        (p) => getComputedStyle(p).position === 'sticky').length,
      fenda: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.textura'), '::before').transform).d,
      relogio: getComputedStyle(document.querySelector('.relogio')).display,
    };
  });
  diz(imovel.comRolagem === 0, `nenhuma animação presa à rolagem (${imovel.comRolagem})`);
  diz(imovel.palavrasApagadas === 0, 'a frase de fecho está toda acesa');
  diz(imovel.pilhaGrudada === 0, 'as pranchas da esterilização são uma lista comum, sem sticky');
  diz(imovel.fenda === 0, 'a faixa de esmalte está inteira, sem fenda');
  diz(imovel.relogio === 'none', 'o relógio da consulta não aparece');
  const semVinheta = await pg.evaluate(() => ({
    entrada: getComputedStyle(document.querySelector('.entrada')).display,
    letra: getComputedStyle(document.querySelector('.encerramento__palavra path')).translate,
    fio: getComputedStyle(document.querySelector('.encerramento__fio')).scale,
  }));
  diz(semVinheta.entrada === 'none', 'a vinheta de entrada não existe');
  diz((semVinheta.letra === 'none' || semVinheta.letra === '0px') && semVinheta.fio === 'none',
    'o encerramento já está inteiro, parado');
  await pg.close();
}

await navegador.close();
servidor.close();
console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
