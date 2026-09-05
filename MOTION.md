# MOTION — especificação de movimento

Duas famílias de movimento nesta página, e elas seguem regras opostas.

**Movimento por ação da pessoa** (mouse, clique, arraste): pode estar em todo lugar. É
resposta, mostra o que mudou, e é o que dá a sensação de página viva.

**Movimento automático** (acontece sozinho ao rolar): quase proibido. Um único momento
orquestrado na página inteira. Fade-and-slide-up em cada seção que entra na viewport é
o tell número um de página gerada por IA — não use em lugar nenhum.

Se estiver em dúvida se um movimento entra: ele responde a algo que a pessoa fez? Entra.
Ele acontece sozinho? Provavelmente sai.

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

Roda uma vez, no load, depois nunca mais.

```
0.0s  vídeo entra com scale 1.06 → 1.00, 1.6s power2.out
0.2s  linhas do título sobem por máscara (overflow hidden + yPercent 100 → 0)
      stagger 0.09, duração 0.9, ease 'expo.out'
0.7s  linha de apoio, fade curto
0.9s  CTA aparece com scale 0.96 → 1
```

Máscara de linha, não `opacity: 0 → 1` com `translateY(30px)`. A diferença entre parecer
caro e parecer template está exatamente aí.

No scroll da abertura: o vídeo sobe a `yPercent: 12` enquanto o título sobe a
`yPercent: 40`, com `scrub: true`. Velocidades diferentes = profundidade.

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
