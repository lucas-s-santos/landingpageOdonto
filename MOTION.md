# MOTION — especificação de movimento

Duas famílias de movimento nesta página, e elas seguem regras opostas.

**Movimento por ação da pessoa** (mouse, clique, arraste): pode estar em todo lugar. É
resposta, mostra o que mudou, e é o que dá a sensação de página viva.

**Movimento automático** (acontece sozinho ao rolar): quase proibido. Um único momento
orquestrado na página inteira. Fade-and-slide-up em cada seção que entra na viewport é
o tell número um de página gerada por IA — não use em lugar nenhum.

Se estiver em dúvida se um movimento entra: ele responde a algo que a pessoa fez? Entra.
Ele acontece sozinho? Provavelmente sai.

**Rolar é algo que a pessoa faz** (acrescentado em 14/10/2026). Movimento *preso* à
rolagem — a posição do scroll é a posição da animação, para quando ela para e volta
quando ela volta — pertence à primeira família. Movimento *disparado* pela rolagem —
entra na tela e anima sozinho, uma vez — continua na segunda, e continua proibido.
Cada movimento preso à rolagem carrega informação da seção, e é no máximo um por
seção. Os seis estão na seção 11.

---

## 0. Base

```js
// Lenis — scroll suave. Desligado no touch: no celular atrapalha.
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, syncTouch: false })
gsap.ticker.add(t => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
lenis.on('scroll', ScrollTrigger.update)
```

Tudo daqui pra frente vai dentro de `gsap.matchMedia()`:

```js
const mm = gsap.matchMedia()
mm.add({
  desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
  mobile:  '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
  calmo:   '(prefers-reduced-motion: reduce)'
}, (ctx) => { const { desktop, mobile, calmo } = ctx.conditions; ... })
```

Em `calmo`: nenhum movimento, vídeo trocado pelo poster, dente renderizado em pose fixa,
tudo visível de saída. Não é degradação — é uma versão completa e estática.

---

## 1. Cursor

Um ponto de 10px que segue o mouse com atraso. O atraso é o efeito inteiro — instantâneo
não sente nada.

```js
let mx = 0, my = 0, cx = 0, cy = 0
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
gsap.ticker.add(() => {
  cx += (mx - cx) * 0.12          // 0.12 = o valor. 0.3 fica nervoso, 0.05 fica lento
  cy += (my - cy) * 0.12
  gsap.set(cursor, { x: cx, y: cy })
})
```

- Sobre link, botão e hotspot: escala 3.2, `mix-blend-mode: difference`, 0.3s power2.out
- Sobre vídeo e imagem: escala 5, sem preenchimento, borda de 1px
- Sobre a lista de tratamentos: vira um traço horizontal fino
- Desligado abaixo de 900px e sob `pointer: coarse`
- O cursor nativo continua existindo: `cursor: none` só no wrapper, e restaurado em
  qualquer campo de formulário
- Nasce escondido e aparece no primeiro `mousemove`, já em cima do ponteiro (acrescentado
  em 14/10/2026). Antes ficava pintado no canto de cima até a pessoa mexer o mouse — o
  laço não escreve posição enquanto não há diferença — e depois voava do meio da tela

## 2. Ímã nos botões

Atração de poucos pixels quando o mouse chega perto. Sutil — se dá pra perceber
claramente, está forte demais.

```js
const RAIO = 90, FORCA = 0.32
el.addEventListener('mousemove', e => {
  const r = el.getBoundingClientRect()
  const dx = e.clientX - (r.left + r.width / 2)
  const dy = e.clientY - (r.top + r.height / 2)
  if (Math.hypot(dx, dy) < RAIO)
    gsap.to(el, { x: dx * FORCA, y: dy * FORCA, duration: 0.4, ease: 'power3.out' })
})
el.addEventListener('mouseleave', () =>
  gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }))
```

Aplicar **só** no CTA principal e nos hotspots do dente. Em ícone de rodapé e link de
menu vira ruído.

## 3. Abertura — o único momento automático

Roda uma vez, no load, depois nunca mais. Em CSS, não GSAP: roda fora da main thread e
continua suave enquanto o resto baixa (em GSAP custava 5,2 s de bootup no perfil mobile).
Revisada em 14/10/2026 para a abertura ocupar a primeira tela e ganhar o rótulo.

```
0.00s  a cena abre como cortina, da direita para a esquerda
       clip-path inset(0 0 0 100%) → inset(0), 1.3s ease-entra-sai
0.00s  o vídeo assenta de scale 1.06 → 1, 1.6s
0.20s  linhas do título sobem por máscara (overflow hidden + translateY 100% → 0)
       90 ms entre elas, 0.9s, ease-saida
0.70s  linha de apoio, fade curto
0.90s  CTA aparece com scale 0.96 → 1
1.10s  aberta / fechada, embaixo do CTA
1.25s  um ponto acende na coroa do dente
1.40s  o fio corre na horizontal até o canto
1.80s  o fio desce
2.05s  o rótulo ("Esmalte") aparece por máscara
```

Máscara de linha, não `opacity: 0 → 1` com `translateY(30px)`. A diferença entre parecer
caro e parecer template está exatamente aí.

**O rótulo vem por último de propósito:** primeiro a promessa (o título diz que a gente
explica), depois a prova (a página já explicando uma parte do dente). É a linguagem da
seção 3 aparecendo no topo.

**O ponto fica preso ao QUADRO do vídeo**, não à tela. O vídeo cobre a cena com
`object-fit: cover`, então a posição sai da mesma conta que o navegador faz para o cover,
em unidades de contêiner: `escala = max(100cqw / 1280, 100cqh / 720)`, e o ponto da coroa
(600, 250 no quadro de 1280×720) cai em `50cqw + (600 − 640) · escala`,
`50cqh + (250 − 360) · escala`. Trocou o vídeo, mede de novo o ponto.

**Mouse, no desktop** (movimento por ação, `movimento.ts`): a cena anda até 14px na
direção oposta ao cursor e o título até 4px a favor — dois planos em velocidades
diferentes. A cena é 16px maior que a moldura de cada lado, então o curso nunca abre
fresta. `gsap.quickTo`, 1.1s power3.out.

**No scroll**: o vídeo desce a `yPercent: 12` enquanto o texto sobe a `yPercent: -10`, com
`scrub: true` (GSAP, desktop). Era `yPercent: 40` no texto: ele descia atrasado e, com a
abertura ocupando a tela inteira, o botão passava por cima do título da seção 2 (91px em
1280×720). `npm run motion` mede em 1280×720, 1024×768 e 1093×614. E, presos à rolagem em CSS, a câmera chega perto e o rótulo
se apaga (seção 11.1).

Sem efeito de fundo. Aurora, partícula e gradiente animado são o item 3 da seção 9 do
BRIEF; o que faz o topo ser vivo é ele já estar explicando alguma coisa.

## 4. Dente 3D — rotação presa ao scroll

Girar por scroll, nunca em loop automático: loop automático é decoração, rotação por
scroll é a pessoa manipulando o objeto.

**Sem pin. A versão pinada foi construída e revertida** — está registrada aqui para não
ser reintroduzida. Era `trigger: '#anatomia', start: 'top top', end: '+=220%', pin: true,
scrub: 1`. O problema é que `#anatomia` tem **1394px de altura**: pinar um elemento mais
alto que a viewport prende na tela um bloco que não cabe nela. Medido em 1440×900:

- 494px da seção ficavam abaixo da dobra, **inalcançáveis**, porque o elemento estava preso
- o quarto rótulo ("Raiz") terminava 310px abaixo da borda, cortado no meio da frase
- e isso durava os **1980px de scroll** em que a página não andava

O que sobrou foi uma seção que parecia travada com o texto picotado. O pin-spacer ainda
somava 1980px mortos à altura do documento.

Sem o pin, a prancha inteira — figura mais os quatro rótulos — tem 815px e **cabe** numa
janela de 900px: ela se monta na tela e a pessoa lê tudo de uma vez.

```js
// medido dentro do laço de render, na fase de leitura — sem ouvinte de scroll,
// o que também funciona com o Lenis, que move o scroll por conta própria
const r = prancha.getBoundingClientRect()          // a PRANCHA, não a seção
const alvo = clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1)

progresso = lerp(progresso, alvo, 0.12)            // a inércia que era do scrub

grupo.rotation.y = (progresso - 0.5) * Math.PI * 1.0   // 0.7 no mobile
grupo.rotation.x = Math.sin(progresso * Math.PI) * 0.18
camera.position.z = 3.4 - Math.sin(progresso * Math.PI) * 0.6
```

Três decisões dentro disso:

**Ancorar na prancha, não na seção.** A seção carrega 368px de respiro e o título;
ancorada nela, metade do giro era gasta com a figura ainda fora da tela.

**Giro centrado — `(progresso - 0.5)`, não `progresso`.** Saindo de 0 até 1.6π, o dente
passava por 144° exatamente quando a prancha ficava centralizada: de costas na hora de
ler, com os quatro pontos apontando para faces invisíveis. Centrado, a pose frontal cai
no meio do percurso e o giro acontece na entrada e na saída. ±90° nos extremos, ±27° na
janela de leitura.

**Aproximação centrada também.** `sin(progresso · π)` em vez de rampa: o dente chega
mais perto quando está sendo lido e recua ao sair, em vez de estar mais longe justamente
no começo da leitura.

A inércia que o `scrub: 1` dava não se perdeu — virou o `lerp(0.12)` do laço de render,
que já existia para o mobile. Um caminho só agora, desktop e celular.

**A figura é `position: sticky`** acima de 768px, com `align-self: start` (item de grid
estica por padrão e sticky não teria para onde correr). Ela segura no máximo 254px, a
diferença de altura entre a coluna dos rótulos e ela. Não é o pin de volta: a página
rola o tempo todo. Existe pelas telas baixas — em 1440×900 nem chega a atuar, mas num
notebook de 1366×768, com ~660px de viewport, a figura sairia por cima enquanto a pessoa
lê o quarto rótulo.

Arraste com o mouse também gira, somando à rotação do scroll. Ao soltar, a rotação
manual volta a zero por interpolação no laço, em ~1.2s.

## 4B. Ver por dentro (acrescentado em 14/10/2026)

Escolher uma parte — pela fileira de botões "Ver por dentro", pelo marcador, pelo título
na lista ou tocando no próprio dente — **corta o modelo ao meio**, como a prancha de um
livro de anatomia. Movimento por ação da pessoa.

- **O corte** é um plano de recorte fixo no mundo, de frente para a câmera
  (`clippingPlanes`). A constante dele caminha de 0,65 (nada cortado) a 0 (ao meio) com
  `lerp(0.075)` e `smoothstep`: o plano atravessa o dente de frente para trás.
- **O miolo** aparece porque o shader pinta o lado de dentro das faces com cor chapada —
  esmalte branco-frio, dentina marfim, polpa rosada. Cortada, a malha lê como maciça.
- **As camadas internas** são cópias reduzidas das partes do GLB: dentina = coroa a 80%,
  câmara da polpa = coroa a 42%, canais = raízes afinadas a 28%. Ilustração, não tomografia.
- **Ao cortar**, o dente vira de frente e para de girar com o scroll (o corte só lê de
  frente); a câmera chega perto da parte escolhida (`FOCO` em `dente3d.ts`); a camada
  escolhida acende e as outras vão 70% para um cinza-sálvia, guardando 30% da cor.
- **Os marcadores** vão para cima do corte, na camada que nomeiam, interpolando com o corte.
- **Tocar no dente**: toque curto (< 8px, < 450ms) lança um raio e escolhe a parte
  atingida, ignorando o que o plano cortou. Com mouse, a parte sob o cursor se ilumina.
- **"Inteiro"** fecha o corte e devolve a rotação ao scroll.
- **Só o que foi escolhido** (acrescentado depois, no mesmo dia): ao escolher, a parte fica
  sólida e cortada, o resto do dente vira fantasma a 7% — só o contorno de fora — e as
  camadas de dentro que não são a escolhida somem. Uma terceira condição, **oca**, não
  desenha cor mas ocupa a profundidade: é o que faz o esmalte sozinho aparecer como casca
  oca, e a dentina sozinha com a polpa vazia dentro. Os marcadores e fios das outras partes
  saem. Os materiais desenham numa passada só (`forceSinglePass`): com duas, o miolo saía
  iluminado durante toda a troca e só virava corte no último quadro.
- **Parado, não desenha.** O laço só chama o render quando algo está se movendo (scroll,
  corte, arraste, opacidade, mouse). Antes redesenhava 60 vezes por segundo a mesma imagem.
  `npm run dente` mede: zero chamadas de desenho com a cena quieta. Pixel ratio no máximo
  1,5.

Quatro correções de modelo feitas em código, medidas: o colo do GLB vem com as faces
viradas para dentro (aparecia como faixa bege chapada — `orientarParaFora` desvira pelo
volume com sinal); as partes têm tampas planas nas junções que, no corte, viravam uma
lâmina escura (`tirarTampa`); o GLB não traz normais (`mergeVertices` +
`computeVertexNormals`); e as raízes começam mais largas que o colo — 0,206 do eixo contra
0,155 em y = −0,02 —, então a boca delas saía do colo como um funil, com a borda de dentro
à mostra (`encaixarRaiz` puxa o topo de cada raiz para dentro do colo e solta até a forma
original em −0,26).

## 5. Prancha anatômica — a cascata

O único outro momento automático da página, e roda `once: true`.

Fio de 1px sai de cada parte do dente até o rótulo na margem. Os fios se desenham por
`stroke-dashoffset`, o rótulo entra logo atrás:

```js
gsap.timeline({ scrollTrigger: { trigger: '#anatomia', start: 'top 60%', once: true } })
  .to('.fio', { strokeDashoffset: 0, duration: 0.8, stagger: 0.14, ease: 'power2.inOut' })
  .from('.rotulo', { opacity: 0, x: -8, duration: 0.5, stagger: 0.14 }, '-=0.7')
```

Os fios são SVG sobreposto ao canvas, com as pontas ancoradas em coordenadas 3D
projetadas para 2D (`vector.project(camera)`) e reposicionadas a cada frame. É o que faz
o rótulo continuar grudado na raiz enquanto o dente gira.

Hotspot no hover: ponto cresce de 6px pra 10px, o `--ambar` acende, o fio engrossa pra
1.5px. No clique: a câmera se anima até um ângulo pré-definido daquela parte (1.1s,
`power3.inOut`), o parágrafo daquela parte entra, as outras partes caem pra `opacity 0.25`
no material.

## 6. Tratamentos — lista que expande

Não são cards. São linhas horizontais separadas por fio de 1px.

- Hover: a linha desloca 12px pra direita (0.4s `power3.out`), o fio de baixo se
  ilumina, o nome do tratamento ganha peso
- Clique: expande revelando texto e imagem. Altura animada de 0 até `auto` medido,
  0.55s `power3.inOut`, com `overflow: hidden`
- Abrir um fecha o outro
- `aria-expanded` e `<button>` de verdade — a expansão tem que funcionar por teclado

## 7. Parallax de fundo

Só em dois lugares: no vídeo da abertura e no bloco de textura de esmalte entre as
seções 4 e 5. Em mais lugares que isso, a página começa a flutuar e a leitura sofre.

```html
<div data-parallax="0.15">
```
```js
gsap.utils.toArray('[data-parallax]').forEach(el => {
  gsap.to(el, { yPercent: -parseFloat(el.dataset.parallax) * 100,
    ease: 'none', scrollTrigger: { trigger: el, scrub: true } })
})
```

## 8. Títulos de seção

Máscara de linha, e **só nos títulos de seção**. Nada mais no corpo da página aparece
por scroll — parágrafo, imagem e lista já nascem visíveis.

```js
gsap.from(linhas, {
  yPercent: 100, duration: 0.9, stagger: 0.08, ease: 'expo.out',
  scrollTrigger: { trigger: titulo, start: 'top 82%', once: true }
})
```

## 9. Mobile

Desligado: cursor, ímã, parallax, scroll suave do Lenis, pin da seção do dente.
Ligado também no celular: os momentos presos à rolagem da seção 11, que são CSS puro.
Mantido: abertura, máscara nos títulos, expandir tratamento, dente girando por arraste
do dedo (sem pin — a seção rola normal e o dente gira com `IntersectionObserver` +
progresso simples).

O 3D no mobile roda com `powerPreference: 'low-power'`, `antialias: false`,
`setPixelRatio(Math.min(devicePixelRatio, 2))` e para de renderizar quando sai da tela.

## 10. Checagem final

- [ ] Nenhuma seção usa fade-and-slide-up genérico
- [ ] Existe exatamente um momento automático além da abertura
- [ ] Com `prefers-reduced-motion: reduce` a página está completa e imóvel
- [ ] Navegação inteira por Tab funciona e o foco é visível
- [ ] 60fps no scroll em um celular intermediário
- [ ] Three.js não está no bundle inicial
- [ ] Nada anima `top`, `left`, `width` ou `height` fora do accordion; só transform e opacity

## 11. Presos à rolagem (acrescentado em 14/10/2026)

Origem: `PLANO-V2.md`. A regra está no topo deste arquivo: rolar é algo que a pessoa
faz, então movimento **preso** à rolagem é resposta. Cada um carrega informação da seção,
no máximo um por seção.

**Tecnologia: CSS scroll-driven animations** (`animation-timeline: view()`), não GSAP. Roda
no compositor, custa 0 KB de JavaScript, e por isso roda no celular — o caminho de onde o
GSAP foi tirado (seção 9). Chrome, Edge, Samsung Internet e Safari 26+. Onde não há
suporte, a página fica como sob reduced-motion: completa e parada.

Toda regra fica dentro de:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) { ... }
}
```

O `@media` não é redundante. A regra global de reduced-motion (`tokens.css`) só zera
**duração**, e animação de rolagem ignora duração: sem o `@media`, ela continuaria
rodando para quem pediu movimento reduzido.

**Nunca o atalho `animation:` junto com `animation-timeline`.** Escreva as propriedades
separadas (`animation-name`, `-timing-function`, `-fill-mode`, `-timeline`, `-range`). O
minificador do build junta tudo num atalho só, o Chrome descarta esse atalho e a animação
morre sem erro. Medido no Chrome 151: cinco dos seis momentos saíam `animation: none`.
`npm run motion` confere cada um vivo, ligado a uma `ViewTimeline`.

### 11.1 Abertura — a câmera chega perto (`Abertura.astro`)

`scale` 1 → 1,12 no vídeo, dentro da moldura, enquanto a abertura sai pelo topo
(`exit-crossing 0%` → `100%`). O rótulo da coroa vai de opacidade 1 a 0 no primeiro terço
desse trecho: depois disso o vídeo já aproximou e o ponto não está mais sobre a coroa. Anima `scale`, não `transform`: são propriedades que se
compõem, e o `transform` continua livre para a entrada (`aproximar`) e para o parallax do
GSAP. Se fosse `transform`, a animação de CSS venceria o estilo em linha do GSAP.

### 11.2 Como atendemos — a frase acende (`ComoAtendemos.astro`)

A frase de fecho em tamanho de título. Cada palavra vai de opacidade 0,55 a 1 numa fatia
igual do trecho `cover 30%` → `cover 55%` da frase, ou seja, enquanto o topo dela passa de
65% a 35% da altura da janela. Apagada, dá **3,55:1** — AA para texto grande, e a frase
tem no mínimo 29,6px. As palavras são `<span>` em linha, sem papel: leitor de tela lê a
frase inteira.

### 11.3 Faixa de esmalte — a fenda abre (`TexturaEsmalte.astro`)

`clip-path: inset(38% 0)` → `inset(0)`, de `entry 25%` a `cover 55%`. No contêiner, não no
vídeo, que o GSAP move por dentro no desktop. O de menor valor dos seis.

### 11.4 Estrutura — as pranchas da esterilização empilham (`Estrutura.astro`)

Cinco pranchas `position: sticky` com `top: topo + i · degrau` (degrau 3,5rem no desktop,
3rem no celular). A aba de cada uma tem a altura do degrau e fica visível em cima da
seguinte, com o número.

- **Recuo:** cada prancha vai a `scale: 0.98 − (n − i − 1) · 0.012`, guiada pela linha do
  tempo da prancha SEGUINTE (`timeline-scope` no pai), de `cover 0%` até
  `cover calc(100vh − topo − (i + 1) · degrau)` — o trecho exato em que a seguinte sobe e
  gruda.
- **Lista em flex, não grid.** Em grid, o bloco que contém o item é a área dele na grade, e
  o sticky só grudaria dentro da própria linha.
- **Saída junta.** Margem de baixo `folga + (n − 1 − i) · degrau`. Com margem igual, a
  última prancha soltava primeiro e deixava à mostra o miolo da anterior. Topo + margem
  igual para todas faz a pilha sair inteira. `npm run motion` percorre a lista e mede.
- **Só com `min-height: 700px`**, e sem reduced-motion. Fora disso é uma lista comum.

### 11.5 Primeira consulta — o fio e o relógio (`PrimeiraConsulta.astro`)

Uma régua para os três: a **altura de leitura**, 55% da janela a partir do topo.

- O fio (`.etapas::before`) vai de `scale: 1 0` a `1 1` de `cover 45vh` a
  `cover calc(100% − 55vh)` — do topo da lista cruzando a altura de leitura até o fim dela
  cruzar.
- Cada número e cada marca acendem quando o próprio topo cruza a mesma altura.
- O relógio conta `--minuto`, registrada com `@property` como `<integer>` para interpolar
  de 1 em 1. Os quadros-chave saem do `conteudo.ts`: cada etapa ocupa uma fatia igual do
  trecho, e dentro dela o relógio anda os minutos daquela etapa. `aria-hidden`; o total em
  texto continua embaixo da lista. No desktop ele fica parado na altura de leitura, na
  margem direita; no celular gruda no topo da lista.

## 12. O menu de dúvidas (acrescentado em 14/10/2026)

`Indice.astro`. O menu lista as **dúvidas de quem visita**, não as seções da clínica —
a página está na ordem das objeções (BRIEF seção 4), então cada pergunta leva à parte que
responde. O fio que liga a pergunta ao lugar é o fio da prancha.

Movimento por ação da pessoa, todo em CSS:

- **A folha entra pela esquerda**, `translateX(-100%) → 0`, 0.55s ease-entra-sai, com
  `@starting-style` para o estado de partida e `allow-discrete` em `display` e `overlay`
  para a saída também animar.
- **As perguntas sobem pela máscara**, 60 ms entre elas a partir de 0.18s — o gesto dos
  títulos de seção. Animação em `translate` e `clip-path`, nunca transição no `transform`:
  o hover usa o `transform`, e uma transição com atraso escalonado atrasaria o hover junto.
- **O fio corre** de `scale: 0` ao comprimento de repouso. No hover e no foco ele vai até o
  nome da seção; na seção que a pessoa está lendo (`aria-current="location"`) ele já fica
  inteiro. No toque (`hover: none`) fica sempre inteiro — sem hover, o fio curto deixava o
  nome da seção solto do outro lado.

`<dialog>` com `showModal()`: foco preso, Esc e devolução de foco ficam com o navegador.
Clicar numa dúvida fecha, rola até o título (pelo Lenis, quando ele existe — por isso
`window.__lenis`) e leva o foco ao título. Dois defeitos medidos e corrigidos no caminho:

- o evento `close` chega numa tarefa à parte; até lá o Lenis seguia parado e a rolagem era
  ignorada. Destrava na hora, no próprio clique;
- o título chegava invisível no celular. `.revela` recorta o título por inteiro, e o Chrome
  calcula a interseção do observador sobre a área recortada — uma linha de altura zero, que
  um salto de âncora podia deixar 0,07px acima da tela, para sempre fora. O observador
  agora olha o PAI do título (`movimento.ts`), e isso vale para qualquer âncora, não só
  para o menu.

## 13. A entrada, só no desktop (acrescentado em 14/10/2026)

`Entrada.astro`, só na demo. A marca sobe numa folha de osso, o ponto acende, o fio corre,
e a folha sobe como cortina (0,95s a 1,7s) com o fio de 1px na borda de baixo varrendo a
tela. A abertura **não espera**: anima por baixo desde o primeiro quadro, então o LCP não
atrasa.

Ponto e fio são HTML por cima do SVG das letras, nas posições lidas da marca
(`PARTES_DA_MARCA` em `src/data/marca.ts`). Animar o círculo e o retângulo dentro do SVG
não ia para o compositor.

**Só a partir de 900px.** Teste A/B alternado, mesmas condições: com a vinheta o
Lighthouse mobile deu 89, 83 e 88; sem, 92, 90 e 90. No celular a página abre direto.

## 14. A marca de fundo do agendar (acrescentada em 14/10/2026, mudou de lugar no mesmo dia)

`Agendar.astro`, só na demo. A marca Colo em tamanho de parede fica no pé da seção "Manda uma
mensagem", atrás do formulário, e se monta presa à rolagem da própria seção
(`view-timeline: --agendar`): a marca inteira chega de mais longe (`translateY(18%) scale(0.9)`
→ nada), as três letras sobem pela borda do SVG uma depois da outra, o ponto acende e o fio —
elemento HTML à parte, posicionado pela geometria da marca — corre até a borda da janela.

- **Trecho:** `cover 20%` → `cover 59%`. Começa com a seção em ~60% da janela e fecha ~140px
  depois de o topo dela passar do topo. Calibrado com o Lucas: fechando no topo (50%) lia como
  rápido demais; fechando 300px depois (68%), demorava. O fim fica antes da última posição de
  rolagem até em 1920×1080 (~70%) — quem rola até o fim nunca vê a marca pela metade.
  `npm run motion` confere isso no fim da página.
- **Tom:** 14% de osso no eucalipto, não osso cheio. Atrás de um formulário a marca inteira em
  osso disputava com os campos; assim é parede, e o texto por cima fica acima de 6:1.

**Onde ela estava antes:** num encerramento (`Fecho.astro`, removido) — a página subia e
descobria por baixo uma faixa eucalipto com a marca. Saiu do rodapé porque a seção de agendar já é
eucalipto e é onde a página pede a ação. O crédito virou parte da linha de demonstração do rodapé.

## 15. A barra de rolagem (acrescentado em 14/10/2026)

O trilho é o fio de 1px da prancha, no meio de uma faixa de osso; o traço de arrastar é
eucalipto, 6px dentro de um alvo de 14px, raio zero. Sob o mouse escurece para tinta e
engrossa. Chrome, Edge e Safari por `::-webkit-scrollbar`; Firefox por `scrollbar-color`,
só dentro de `@supports not selector(::-webkit-scrollbar)` — no Chrome, declarar
`scrollbar-color` desliga o desenho inteiro. Dentro do menu de dúvidas, que é eucalipto, a
barra inverte. Seleção de texto em eucalipto e osso.

