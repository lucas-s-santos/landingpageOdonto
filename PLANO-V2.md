# PLANO V2 — rolagem que explica

Status: **aprovado em 14/10/2026 e implementado.** O que foi feito, e os
defeitos encontrados no caminho, estão no `HANDOFF.md`, Parte 4C. Os valores
finais de cada movimento estão no `MOTION.md`, seção 11.

Pedido de origem (14/10/2026): deixar a página com visual profissional para
vender a clínicas, com elementos que se mexem ao rolar, usando como ideia os
componentes Skiper UI listados e os sites spell.sh, originkit.dev, reactbits.dev
e inspora.design.

---

## 0. O que isto muda no BRIEF (precisa de ok explícito)

O BRIEF (seção 6) e o `MOTION.md` dizem: *movimento automático ao rolar é quase
proibido; um único momento orquestrado na página.* O pedido novo é o contrário.

A proposta é separar duas coisas que o BRIEF trata como uma só:

| Tipo | O que é | Regra |
|---|---|---|
| **Disparado pela rolagem** | o elemento entra na tela e anima sozinho, uma vez | **Continua proibido.** É o fade-and-slide-up, o tell número um. Ficam só os dois que já existem: abertura e cascata dos fios |
| **Preso à rolagem** (scrub) | a posição do scroll *é* a posição da animação. Para quando a pessoa para, volta quando ela volta | **Passa a valer como movimento por ação da pessoa** |

Não é uma regra inventada agora: é o critério que o `MOTION.md` já usa para
justificar o dente — *"rotação por scroll é a pessoa manipulando o objeto"*.

Duas travas para não virar página que flutua:

1. **Cada movimento preso à rolagem carrega informação da seção.** Se tirar o
   movimento e a seção não perder nada além do enfeite, ele sai.
2. **No máximo um por seção.** O dente continua sendo o ponto mais alto da página.

Se aprovar, atualizo a seção 6 do BRIEF e o `MOTION.md` com essa distinção antes de
codar.

---

## 1. Skiper UI — usar as ideias, não instalar os componentes

**Recomendação: não rodar os `pnpm dlx shadcn add`.** Três motivos:

1. **11 dos 18 são Pro**: 6, 8, 13, 21, 29, 32, 35, 42, 55, 71 e 76. Sem a
   licença (US$ 129) o `shadcn add` devolve 404.
2. **Os 7 gratuitos são React + framer-motion**, e o projeto é Astro sem React.
   React, ReactDOM e framer-motion juntos pesam mais que a primeira carga inteira
   de hoje (68,5 KB), e entrariam no caminho do celular. Esse é justamente o
   caminho de onde o GSAP foi tirado: com ele, o Lighthouse mobile dava 63–71
   (registrado em `src/scripts/movimento.ts`). Hoje dá 98. Quem visita é a
   mulher no celular à noite, não quem compra o site.
3. **A versão gratuita exige crédito ao Skiper UI no rodapé**, no site do cliente.

**O que entra no lugar: CSS scroll-driven animations** (`animation-timeline:
view()`). O navegador roda no compositor, com 0 KB de JavaScript, e funciona no
celular, inclusive onde o GSAP não pode estar. Suporte: Chrome, Edge, Samsung
Internet e Safari 26+. Onde não houver suporte, aparece a versão estática completa,
a mesma do `prefers-reduced-motion`. Nada fica escondido esperando animação.

No desktop o GSAP continua só com o que já faz: cursor, ímã e Lenis.

Reimplementar a ideia com outro código, em outra tecnologia, não carrega a
exigência de crédito do Skiper.

---

## 2. Os seis momentos

Na ordem da página. Cada um diz a objeção que serve, de onde veio a ideia, e o
que acontece no celular e sem movimento.

### 2.1 Abertura — a câmera chega perto do dente
*Objeção: "é clínica séria?" · Ideia: Skiper 55 (parallax image) e 29 (Siena)*

Ao rolar para fora da abertura, o vídeo **aproxima dentro da própria moldura**
(escala 1 → 1,12), como quem chega perto para olhar. Prepara a seção 3, que
abre o dente. A moldura não cresce: nada de full-bleed, o 720p não aguenta.

- Celular: igual, em CSS. É o único movimento do topo no celular, onde hoje não há nenhum.
- Sem movimento: vídeo parado no poster, como hoje.
- Custo: só `transform`, sem layout.

### 2.2 Como atendemos — a frase que acende
*Objeção: "vão me julgar?" · Ideia: React Bits (Scroll Reveal), Spell (Blur
Reveal, Words Stagger), Skiper 28 sem o 3D*

A última frase da seção, *"Você decide depois, com a informação na mão e sem
ninguém em cima."*, sobe para o tamanho de título. As palavras passam de
apagadas a acesas conforme a frase atravessa o meio da tela, no ritmo de leitura
de quem rola. Os três parágrafos ficam como estão.

- **Contraste medido:** o estado apagado é tinta a 55% (`#7B7D79`), **3,55:1**
  sobre osso. Passa AA para texto grande. Nenhuma palavra fica ilegível em
  momento nenhum, e o Lighthouse não perde o 100 de acessibilidade.
- Leitor de tela lê a frase inteira uma vez (cópia visualmente oculta; as
  palavras animadas ficam `aria-hidden`).
- Do Skiper 28 sai a ideia de uma frase grande guiada pela rolagem. O texto
  inclinado a 30° fica de fora: em movimento ele não se lê.

### 2.3 O dente — fica como está
A rotação por scroll e a cascata já existem e funcionam. É o pico da página e
continua sendo.

### 2.4 Faixa de esmalte — a fenda que abre
*Ideia: Skiper 71 (image reveal)*

A faixa entre Tratamentos e Quem atende hoje tem parallax só no desktop. Passa a
**abrir de uma fenda horizontal até o bloco inteiro** (`clip-path`) enquanto
atravessa a tela, no celular também. É o item de menor valor da lista. Entra por
ser barato e por ser a transição entre a seção densa e a de pessoas.

### 2.5 Estrutura — as pranchas da esterilização empilham
*Objeção: "é limpo? é seguro?" · Ideia: Skiper 16 (sticky cards)*

É a mudança grande e a que mais vende. Hoje a seção diz em um parágrafo que o
instrumental é lavado, embalado e autoclavado. Passa a **mostrar a cadeia**, em
cinco pranchas que grudam no topo e se empilham conforme a pessoa rola:

```
1  Lavagem        sai do uso e vai para a lavagem                    [foto]
2  Inspeção       seca e é conferido peça por peça, contra a luz     [foto]
3  Embalagem      entra num envelope próprio e é selado              [foto]
4  Autoclave      vapor sob pressão; a fita do envelope muda de cor  [foto]
5  Na sua frente  chega fechado e é aberto no começo do atendimento  [vídeo atual]
```

- A borda de cada prancha anterior continua visível em cima da seguinte, com o
  número. A pilha mostra quantas etapas o instrumento já passou.
- **Numeração legítima:** é sequência real (item 13 da seção 9 permite).
- Não são cards: largura da grade, raio 0, sem sombra, fundo osso com fio de
  1px em cima. A prancha de trás só diminui (escala 0,96).
- A sala vazia e o título "Onde você vai sentar" ficam na primeira fileira,
  como hoje. As pranchas substituem a segunda fileira. Isso também resolve um
  defeito visto no screenshot de 1440: o título flutua sozinho à direita com
  ~400px de vazio em volta.
- Celular: `position: sticky` é CSS puro e barato. Foto em cima, texto embaixo,
  cada prancha cabe em 844 − 83px de barra fixa.
- Sem movimento: as cinco viram uma lista normal, sem sticky.
- **A página cresce cerca de 1.600px no desktop.** É o custo, e é o único item
  que alonga a página.
- Copy das etapas no modo cliente vai como `[CONFERIR]`: é afirmação sobre o
  processo daquela clínica.

Precisa de 4 imagens novas. Os prompts estão na página do Flow.

### 2.6 Primeira consulta — o fio e o relógio
*Objeção: "quanto tempo?" · Ideia: Skiper 19 (line path) + React Bits (Count Up)*

A seção que o BRIEF chama de mais subestimada. A lista de 6 etapas fica igual e
ganha duas coisas presas à rolagem:

- **O fio:** uma linha de 1px desce pela coluna dos números conforme a lista
  passa. Cada número acende (peso 500, opacidade cheia) quando o fio chega nele.
  É a linguagem da prancha anatômica estendida à seção que é sequência de verdade.
- **O relógio:** ao lado da lista, um contador vai de *minuto 0* a *minuto 55*
  acompanhando a etapa que está sendo lida. É a resposta literal à objeção da
  seção, e é a soma das durações que já estão escritas.

O contador é CSS (`@property` inteiro + `counter()`), sem JavaScript, e é
`aria-hidden`: o total em texto ("Somando, cerca de 55 minutos") continua lá.
No celular o relógio gruda no topo da lista enquanto ela passa.

---

## 3. Fora da rolagem

**Tratamentos ganham imagem na expansão.** A seção 5 do BRIEF pede *"item de
tratamento expande revelando texto e imagem"*, e hoje expande só texto. São 7
imagens de material e modelo didático (escova e fio, resina, limas, sonda,
modelo de implante, coroa, moldeira), sem boca e sem procedimento. Fica para a
**fase 2**, depois de ver o que o Flow entrega: imagem gerada de material
odontológico erra com frequência, e erro de anatomia ou de instrumento num site
de dentista é pior que não ter imagem.

**Defeito no celular, visto no screenshot de 390:** o CTA do cabeçalho quebra em
duas linhas dentro de uma caixa ("Agendar / avaliação"). O `PLANO-DESIGN.md`
diz que no celular o cabeçalho leva só o nome, e a barra fixa já faz o papel do
botão. Escondo abaixo de 600px.

---

## 4. Revisão contra a seção 9 do BRIEF

| Risco | Onde | Como foi evitado |
|---|---|---|
| Cards idênticos (item 4) | pranchas da esterilização | largura da grade, raio 0, sem sombra, conteúdo diferente em cada; o empilhamento mostra a sequência |
| 01/02/03 sem sequência (13) | pranchas e consulta | as duas são sequência cronológica real |
| Gradiente decorativo (3) | fenda do esmalte | a fenda é `clip-path` reto, sem degradê |
| Fade-and-slide-up (BRIEF 6) | todos | nada aparece sozinho; tudo é preso ao scroll e reversível |
| Palavra do título em outra cor (BRIEF 5) | frase que acende | é a frase inteira passando de apagada a acesa no ritmo da leitura, não uma palavra destacada. No fim fica toda na mesma cor |
| Âmbar fora do hotspot | relógio, fio | relógio e fio em tinta; o âmbar continua só no dente |

---

## 5. O que foi visto nos sites e ficou de fora

| Origem | Item | Por quê |
|---|---|---|
| Skiper 6 | hover members | o retrato precisa estar visível sem hover: é a resposta da seção 5, e celular não tem hover |
| Skiper 8 | preloader de palavras | segura a página de quem está com dor, à noite, no celular. Piora o LCP, e não há o que pré-carregar |
| Skiper 13 | menu em tela cheia | a página não tem menu de propósito: um CTA só |
| Skiper 21 | tela de login | não há login |
| Skiper 26 | toggle de tema | a paleta é a identidade; modo escuro pediria uma segunda paleta medida para AA, sem ganho para a paciente |
| Skiper 30 e 32 | galeria em colunas / grade 3D | precisam de 9 a 12 fotos da clínica. Ficam para quando um cliente tiver ensaio fotográfico real |
| Skiper 35 | hover expand | não existe no celular; tratamentos já expandem |
| Skiper 42 | ícones animados | a página não tem ícone (seção 9, item 14) |
| Skiper 48 | carrossel de cartões | é a forma do carrossel de depoimento, que a CFO-196 proíbe. Sem depoimento não há o que girar |
| Skiper 67 | player de vídeo | não há vídeo com som. Serve no futuro para um tour real da clínica |
| Skiper 76 | bloco estilo Apple | seletor de produto; não há produto |
| Spell | Signature (assinatura que se desenha) | publicar a assinatura de um dentista facilita falsificar receita e atestado |
| Spell, React Bits | Light Rays, Aurora, Silk, Particles, Animated Gradient | gradiente como decoração (seção 9, item 3) |
| Originkit | Scramble Text, Black Hole | tom de produto de tecnologia, errado para clínica |
| Inspora | — | é galeria de inspiração, não biblioteca; nada de saúde no feed |

---

## 6. Imagens geradas: demo sim, cliente não

As imagens do Flow servem para a **demo**, que declara no rodapé que é fictícia.
No modo cliente, **estrutura física tem que ser foto da clínica de verdade**:
mostrar sala e esterilização que não são dela é publicidade enganosa, e a
CFO-196 só permite mostrar estrutura por ser a estrutura real.

Isso vale também para o vídeo `sala-vazia`, que é gerado e hoje não está na lista
do HANDOFF. Entra na lista "o que falta quando virar cliente" junto com as
quatro pranchas.

---

## 7. Ordem de execução, depois do ok

1. Atualizar BRIEF seção 6 e `MOTION.md` com a regra da seção 0.
2. Base: `@supports (animation-timeline: view())` + `prefers-reduced-motion` num
   arquivo de estilo só para os momentos de rolagem.
3. Momentos na ordem de valor: 2.5 pranchas → 2.6 fio e relógio → 2.2 frase → 2.1
   abertura → 2.4 esmalte. As pranchas começam com placeholder até as imagens
   chegarem.
4. Cabeçalho no celular.
5. `scripts/movimento-check.mjs` ganha checagens novas: sob reduced-motion nada
   com opacidade < 1 nem transformado; estado apagado da frase ≥ 3:1; zero JS
   novo no bundle do celular.
6. `npm run verificar` limpo: CFO-196, a11y, movimento, dente, Lighthouse,
   screenshots 1440 e 390. Autocrítica contra a seção 9 com as imagens na tela.
7. HANDOFF atualizado.

**Metas:** Lighthouse mobile ≥ 95 (hoje 98) · 0 KB de JavaScript novo no celular ·
acessibilidade 100 · nenhum estouro em 360px.
