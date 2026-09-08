/**
 * FASE A — verificação do relatório de canal.
 *
 *   npm run medicao
 *
 * A medição nasce desligada (`MEDICAO.provedor === 'nenhum'`), então não há
 * o que testar no build normal. Este script LIGA o Plausible num arquivo
 * temporário, reconstrói, testa, e devolve tudo ao estado desligado —
 * inclusive o `dist/`, para não deixar artefato inconsistente para os
 * outros scripts da cadeia.
 *
 * O script do provedor é interceptado e trocado por um espião: nada sai da
 * máquina, e não é preciso conta em lugar nenhum para rodar isto.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTE TESTE EXISTE PARA IMPEDIR
 * ═══════════════════════════════════════════════════════════════════════
 *
 * O formulário coleta nome e motivo, e o motivo inclui "Estou com dor" e
 * "Gengiva sangrando". Isso é dado pessoal sensível (LGPD, art. 5º, II).
 * Mandar para uma ferramenta de analytics transformaria a CalmDev em
 * operadora de dado de saúde por acidente — sem contrato, sem base legal e
 * sem política de retenção.
 *
 * As asserções abaixo preenchem um formulário de verdade, clicam no botão,
 * e conferem que NADA daquilo saiu junto. É a linha que separa "conto de
 * onde vem o paciente" de "guardo o problema de saúde dele".
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, extname, resolve, sep } from 'node:path';

const CFG = resolve('src/data/medicao.ts');
const original = readFileSync(CFG, 'utf8');

let restaurado = false;
const restaurar = () => {
  if (restaurado) return;
  restaurado = true;
  writeFileSync(CFG, original);
  // Reconstrói com a config desligada: sem isto o dist/ ficaria com o
  // script do Plausible dentro, e o próximo script da cadeia mediria a
  // página errada.
  try {
    execSync('npx astro build', { stdio: 'pipe' });
  } catch {
    console.error('AVISO: nao consegui reconstruir. Rode `npx astro build`.');
  }
  console.log('\nconfig e build restaurados (provedor: nenhum)');
};
process.on('exit', restaurar);
process.on('SIGINT', () => process.exit(1));

let falhou = false;
const diz = (ok, m) => {
  if (!ok) falhou = true;
  console.log(`  ${ok ? 'ok    ' : 'FALHA '} ${m}`);
};

console.log('Medicao de canal — fase A do PLANO-CLINICA.md\n');

// --- liga o Plausible e reconstrói -----------------------------------
writeFileSync(
  CFG,
  original
    .replace("provedor: 'nenhum' as Provedor,", "provedor: 'plausible' as Provedor,")
    .replace("dominio: '[PREENCHER domínio no Plausible]',", "dominio: 'exemplo.test',")
);
execSync('npx astro build', { stdio: 'pipe' });

const RAIZ = resolve('dist');
const PORTA = 4505;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.glb': 'model/gltf-binary', '.wasm': 'application/wasm',
};

const servidor = createServer(async (req, res) => {
  try {
    let caminho = resolve(RAIZ, '.' + decodeURIComponent(req.url.split('?')[0]));
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

await new Promise((ok, no) => {
  servidor.once('error', (e) =>
    no(new Error(`porta ${PORTA} ocupada (${e.code}). Encerre o processo ou mude PORTA.`))
  );
  servidor.listen(PORTA, ok);
});

const html = readFileSync(resolve('dist/index.html'), 'utf8');

console.log('com o provedor ligado:');
diz(html.includes('plausible.io/js/script.js'), 'o script do provedor entra no HTML');
diz(html.includes('data-domain="exemplo.test"'), 'com o dominio configurado');
diz(html.includes('data-medicao'), 'o elemento com as chaves de canal entra');

// Os TEXTOS dos canais ("pelo Instagram") estao no HTML de proposito: o
// Agendar.astro precisa deles para montar a mensagem do WhatsApp, e sao copy
// publica. O que precisa carregar so as chaves e o elemento de medicao —
// dimensao de relatorio e `ig`, nao a frase.
const attrMedicao = (html.match(/data-medicao\s+data-canais="([^"]*)"/) || [])[1] ?? '';
const chavesNoHtml = attrMedicao.replace(/&quot;/g, '"');
diz(
  chavesNoHtml.includes('"ig"') && !chavesNoHtml.includes('pelo '),
  `o elemento de medicao carrega so as chaves: ${chavesNoHtml}`
);

const navegador = await chromium.launch();

/** Abre a página com o script do provedor trocado por um espião local. */
async function abrir(url) {
  const ctx = await navegador.newContext();
  await ctx.route('**/plausible.io/**', (rota) =>
    rota.fulfill({
      contentType: 'text/javascript',
      body:
        'window.plausible=function(n,o){window.__eventos=window.__eventos||[];' +
        'window.__eventos.push({nome:n,props:(o||{}).props||{}});};',
    })
  );
  const pg = await ctx.newPage();
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(700);
  return { ctx, pg, eventos: () => pg.evaluate(() => window.__eventos ?? []) };
}

console.log('\nos tres eventos do funil:');
{
  const { ctx, eventos } = await abrir(`http://localhost:${PORTA}/`);
  const ev = await eventos();
  diz(
    ev.some((e) => e.nome === 'visita' && e.props.canal === 'site'),
    'sem parametro: visita canal=site'
  );
  await ctx.close();
}
{
  const { ctx, eventos } = await abrir(`http://localhost:${PORTA}/?de=ig`);
  diz((await eventos()).some((e) => e.nome === 'visita' && e.props.canal === 'ig'),
    '?de=ig: visita canal=ig');
  await ctx.close();
}
{
  const { ctx, eventos } = await abrir(`http://localhost:${PORTA}/primeira-consulta/?de=cartao`);
  diz((await eventos()).some((e) => e.nome === 'preparo' && e.props.canal === 'cartao'),
    'a pagina de preparo dispara preparo canal=cartao');
  await ctx.close();
}
{
  // Chave fora da lista nao pode virar dimensao: sem a validacao, qualquer
  // um monta ?de=<texto> e suja o painel da clinica com conteudo proprio.
  const { ctx, eventos } = await abrir(
    `http://localhost:${PORTA}/?de=${encodeURIComponent('<script>sujeira')}`
  );
  const canais = (await eventos()).map((e) => e.props.canal);
  diz(canais.every((c) => c === 'site'), `chave invalida cai no padrao: ${JSON.stringify(canais)}`);
  await ctx.close();
}

console.log('\no que NUNCA pode ser enviado:');
{
  const { ctx, pg, eventos } = await abrir(`http://localhost:${PORTA}/?de=google`);
  await pg.fill('#ag-nome', 'Ana Paula Ferreira');
  await pg.selectOption('#ag-motivo', 'Estou com dor');
  await pg.selectOption('#ag-horario', 'À noite');
  await pg.waitForTimeout(300);

  // Deixa o clique acontecer, mas sem sair da pagina para o WhatsApp.
  await pg.evaluate(() => {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => a.removeAttribute('target'));
    addEventListener('click', (e) => e.preventDefault(), true);
  });
  await pg.click('[data-link-whatsapp]');
  await pg.waitForTimeout(400);

  const ev = await eventos();
  const tudo = JSON.stringify(ev);
  diz(ev.some((e) => e.nome === 'contato' && e.props.canal === 'google'),
    'o clique no WhatsApp dispara contato canal=google');
  diz(!tudo.includes('Ana Paula'), 'o NOME digitado nunca e enviado');
  diz(!/dor/i.test(tudo), 'o MOTIVO ("Estou com dor") nunca e enviado — e dado de saude');
  diz(!/noite/i.test(tudo), 'o horario escolhido nunca e enviado');
  diz(
    ev.every((e) => Object.keys(e.props).length === 1 && 'canal' in e.props),
    `todo evento carrega SO a chave canal: ${tudo}`
  );

  // Ancora interna e navegacao, nao contato. Contar aquilo inflaria a
  // conversao com gente que so rolou a pagina.
  const antes = ev.filter((e) => e.nome === 'contato').length;
  await pg.evaluate(() => document.querySelector('a[href="#agendar"]')?.click());
  await pg.waitForTimeout(300);
  const depois = (await eventos()).filter((e) => e.nome === 'contato').length;
  diz(antes === depois, 'clicar numa ancora #agendar NAO conta como contato');
  await ctx.close();
}

console.log('\nquando o script do provedor e bloqueado:');
{
  // Boa parte do publico usa bloqueador. Medicao e secundaria; o botao do
  // WhatsApp funcionando e que nao e.
  const ctx = await navegador.newContext();
  await ctx.route('**/plausible.io/**', (rota) => rota.abort());
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', (e) => erros.push(e.message));
  await pg.goto(`http://localhost:${PORTA}/?de=ig`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(800);
  diz(erros.length === 0, `nenhum erro de pagina (${erros.length})`);
  const href = await pg.getAttribute('[data-link-whatsapp]', 'href');
  diz(!!href && href.includes('wa.me'), 'e o botao do WhatsApp continua funcionando');
  await ctx.close();
}

await navegador.close();
servidor.close();

console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exitCode = falhou ? 1 : 0;
