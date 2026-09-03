/**
 * Varredura de conformidade com a Resolução CFO-196/2019.
 *
 *   npm run build && node scripts/conformidade.mjs
 *
 * Lê o HTML RENDERIZADO em dist/, não o código-fonte: o que importa é o que
 * a visitante vê. Descumprir a resolução gera processo ético contra o
 * dentista, de advertência a suspensão do exercício profissional — por isso
 * isto é um teste automatizado e não uma revisão de olho.
 *
 * Sai com código 1 se encontrar qualquer proibição. Serve para CI.
 *
 * Este script NÃO substitui leitura humana: ele pega o que é padrão de texto,
 * não julga contexto. Um superlativo escrito de forma criativa passa.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve('dist/index.html'), 'utf8');

// texto visível: sem script, sem style, sem tags, entidades resolvidas
const visivel = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ');

const PROIBIDO = [
  {
    nome: 'preço, valor, desconto, parcelamento',
    re: /R\$|\bpre[çc]os?\b|\bvalor(es)?\b|a partir de|\bparcel\w+|\bdescontos?\b|promo[çc][ãa]o|\bgr[áa]tis\b|sem custo|primeira consulta gratuita/gi,
  },
  {
    nome: 'superlativo ou comparação',
    re: /\b[ao] melhor\b|\bos? melhores\b|\bl[íi]der\b|\brefer[êe]ncia\b|[ao] mais moderno?a?\b|de ponta\b|excel[êe]ncia|\b[úu]nica cl[íi]nica\b|\bo maior\b/gi,
  },
  {
    nome: 'garantia ou promessa de resultado',
    re: /\bgarant(ia|imos|ido|ida)\b|\bassegura(mos)?\b|resultado garantido|\bprometemos\b|\bsem d[oó]r\b/gi,
  },
  {
    nome: 'depoimento de paciente',
    re: /\bdepoimentos?\b|\bo que dizem\b|\bavalia[çc][õo]es de pacientes\b|\bnossos pacientes dizem\b/gi,
  },
  { nome: 'antes e depois', re: /antes e depois|\bantes\s*\/\s*depois\b/gi },
  {
    nome: 'clichê proibido (BRIEF seção 10)',
    re: /transforme seu sorriso|sorriso dos sonhos|cuidamos de voc[êe] como voc[êe] merece|excel[êe]ncia em odontologia/gi,
  },
  {
    // Zeros passam de propósito: é o que a página usa no modo demo, e zero
    // nunca é emitido como registro. Qualquer outro dígito reprova — um
    // número plausível pode ser o de um dentista real, e a página passaria a
    // atribuir o registro dele a alguém que não existe.
    nome: 'número de CRO com dígito diferente de zero (registro real de outra pessoa)',
    re: /CRO-[A-Z]{2}[\s:]*[\d.]*[1-9][\d.]*/gi,
  },
];

const OBRIGATORIO = [
  { nome: 'responsável técnico nomeado no rodapé', re: /respons[áa]vel t[ée]cnico/i },
  { nome: 'menção a CRO no rodapé', re: /\bCRO\b/i },
];

let falhou = false;

console.log('CFO-196/2019 — varredura do HTML renderizado\n');
console.log('proibido:');
for (const { nome, re } of PROIBIDO) {
  const achados = [...new Set(visivel.match(re) ?? [])];
  if (achados.length) {
    falhou = true;
    console.log(`  FALHA  ${nome} → ${JSON.stringify(achados)}`);
  } else {
    console.log(`  ok     ${nome}`);
  }
}

console.log('\nobrigatório:');
for (const { nome, re } of OBRIGATORIO) {
  if (re.test(visivel)) {
    console.log(`  ok     ${nome}`);
  } else {
    falhou = true;
    console.log(`  FALHA  ${nome}`);
  }
}

const pendentes = visivel.match(/\[PREENCHER[^\]]*\]/g) ?? [];
const ehDemo = /Demonstra[çc][ãa]o\./.test(visivel);

console.log('');
if (ehDemo) {
  console.log('modo DEMO: a faixa que declara os dados como fictícios está na página.');
  if (pendentes.length) {
    // Numa demo, [PREENCHER] na tela quebra a venda: o dono do consultório
    // vê um site inacabado em vez de vê-lo pronto com o nome dele.
    falhou = true;
    console.log(`  FALHA  ${pendentes.length} marcador(es) [PREENCHER] visível(is) na tela:`);
    for (const p of [...new Set(pendentes)]) console.log(`         ${p}`);
  } else {
    console.log('  ok     nenhum [PREENCHER] visível');
  }
} else {
  console.log(`${pendentes.length} marcador(es) [PREENCHER] — dado do cliente ainda não inventado.`);
  if (pendentes.length === 0) {
    console.log('Nenhum [PREENCHER] restante: confirme que tudo foi preenchido com dado real.');
  }
}

console.log(falhou ? '\nREPROVADO' : '\nAPROVADO');
process.exit(falhou ? 1 : 0);
