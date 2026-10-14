/**
 * Checagem de acessibilidade e teclado sobre `dist/`.
 *
 *   npm run a11y
 *
 * Cobre o que o piso de qualidade do CLAUDE.md exige e o que dá para checar
 * por máquina: hierarquia de títulos, alt em imagem, ordem de Tab com foco
 * visível em todas as paradas, o accordion abrindo por Enter, o JSON-LD
 * parseando e o idioma do documento.
 *
 * Não substitui teste com leitor de tela de verdade.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const RAIZ = resolve('dist');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm'};
const s=createServer(async(req,res)=>{try{let p=resolve(RAIZ,'.'+decodeURIComponent(req.url.split('?')[0]));if(p!==RAIZ&&!p.startsWith(RAIZ+sep)){res.writeHead(403);res.end();return;}if((await stat(p)).isDirectory())p=join(p,'index.html');res.writeHead(200,{'Content-Type':MIME[extname(p)]??'application/octet-stream'});res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>s.listen(4400,r));
const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1440,height:900}});
await pg.goto('http://localhost:4400/',{waitUntil:'networkidle'});
await pg.evaluate(()=>document.fonts.ready);

console.log('--- hierarquia de titulos ---');
console.log((await pg.evaluate(()=>[...document.querySelectorAll('h1,h2,h3')].map(h=>`${h.tagName} ${h.textContent.trim().slice(0,44)}`))).join('\n'));

console.log('\n--- imagens sem alt ---');
const semAlt = await pg.evaluate(()=>[...document.querySelectorAll('img')].filter(i=>!i.alt&&i.getAttribute('aria-hidden')!=='true').map(i=>i.src));
console.log(semAlt.length? semAlt : '  nenhuma');

console.log('\n--- ordem de Tab ---');
const ordem=[];
for(let i=0;i<16;i++){
  await pg.keyboard.press('Tab');
  const info=await pg.evaluate(()=>{const a=document.activeElement;if(!a||a===document.body)return null;
    const cs=getComputedStyle(a); const r=a.getBoundingClientRect();
    return {tag:a.tagName,txt:(a.innerText||a.value||a.getAttribute('aria-label')||'').trim().slice(0,38),
      outline:cs.outlineWidth+' '+cs.outlineStyle, visivel:r.width>0&&r.height>0};});
  if(!info)break; ordem.push(info);
}
ordem.forEach((o,i)=>console.log(`  ${String(i+1).padStart(2)}. ${o.tag.padEnd(8)} outline=${o.outline.padEnd(12)} vis=${o.visivel?'s':'N'}  ${o.txt}`));
const semFoco=ordem.filter(o=>o.outline.startsWith('0px')||o.outline.includes('none'));
console.log(semFoco.length?`  [!] ${semFoco.length} elemento(s) sem foco visivel`:'  ok: todos com foco visivel');

console.log('\n--- accordion por teclado ---');
const r1=await pg.evaluate(()=>{const d=document.querySelector('details.item');return {aberto:d.open};});
await pg.evaluate(()=>document.querySelector('details.item summary').focus());
await pg.keyboard.press('Enter');
const r2=await pg.evaluate(()=>({aberto:document.querySelector('details.item').open}));
console.log(`  antes=${r1.aberto} depois de Enter=${r2.aberto} -> ${r1.aberto!==r2.aberto?'ok':'[!] nao alterna'}`);

console.log('\n--- JSON-LD ---');
const ld=await pg.evaluate(()=>document.querySelector('script[type="application/ld+json"]')?.textContent);
try{const o=JSON.parse(ld);console.log('  ok parse. @type =',o['@type']);}catch(e){console.log('  [!] JSON invalido:',e.message);}

console.log('\n--- link do WhatsApp ---');
console.log(' ',await pg.evaluate(()=>{const a=document.querySelector('[data-link-whatsapp]');return a?a.href:'(nao renderizado: numero e [PREENCHER], mostra aviso)';}));

console.log('\n--- lang / titulo ---');
console.log(' ',await pg.evaluate(()=>`lang=${document.documentElement.lang} · title=${document.title.slice(0,60)}`));
await b.close(); s.close();
