/**
 * Recorta uma seção pela caixa REAL do elemento.
 *
 *   node scripts/recortar.mjs "<seletor>" <largura> <arquivo.png>
 *   node scripts/recortar.mjs "section.estrutura" 390 screenshots/x.png
 *
 * Existe porque recortar o screenshot de página inteira por coordenada
 * chutada me fez perseguir dois defeitos que não existiam: um título que
 * parecia cortado e um ponto solto que era o cursor. A altura da página muda
 * a cada build por causa do pin da seção 3, então coordenada fixa desalinha
 * sozinha.
 *
 * Antes de fotografar: percorre a página (para disparar `loading="lazy"` e a
 * cena 3D), força o estado final da revelação dos títulos e remove o cursor
 * customizado, que num screenshot fica congelado no meio da tela.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const [seletor, largura, saida] = process.argv.slice(2);
const RAIZ=resolve('dist');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const s=createServer(async(q,r)=>{try{let p=resolve(RAIZ,'.'+decodeURIComponent(q.url.split('?')[0]));if(p!==RAIZ&&!p.startsWith(RAIZ+sep)){r.writeHead(403);r.end();return;}if((await stat(p)).isDirectory())p=join(p,'index.html');r.writeHead(200,{'Content-Type':MIME[extname(p)]??'application/octet-stream'});r.end(await readFile(p));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(4552,r));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader']});
const pg=await b.newPage({viewport:{width:+largura,height:900}});
await pg.goto('http://localhost:4552/',{waitUntil:'networkidle'});
await pg.evaluate(()=>document.fonts.ready);
await pg.evaluate(async()=>{ for(const x of document.querySelectorAll('section,footer')){x.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,220));} });
await pg.waitForTimeout(2500);
await pg.evaluate(async()=>{
  for (const el of document.querySelectorAll('.revela')) el.classList.add('revelado');
  await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));
  document.querySelector('.cursor')?.remove();
});
await pg.locator(seletor).scrollIntoViewIfNeeded();
await pg.waitForTimeout(600);
await pg.locator(seletor).screenshot({path:saida});
console.log('recortado:', seletor, '->', saida);
await b.close(); s.close();
