# PLANO DE DESIGN — passo 1 da ordem de trabalho

Status: **escrito, aguardando aprovação do Lucas.** Nenhuma linha de código de aplicação
foi escrita ainda. Este arquivo é a saída do passo 1 do `CLAUDE.md`.

Se algo aqui conflitar com o `BRIEF.md`, o BRIEF vence.

---

## 1. Conceito

**A página é uma prancha de estudo, não um anúncio.**

A Resolução CFO-196/2019 tira a prova social (sem depoimento, sem antes/depois, sem
preço). O que sobra como fonte de confiança é didática. Então a página inteira se
comporta como a página de um atlas de anatomia: fundo de papel, fio de 1px, rótulo
ancorado na margem, texto explicando o que está acontecendo. A visitante não é
convencida — ela é informada, e decide sozinha.

Isso resolve três coisas de uma vez:

- é a única direção que a lei permite;
- é a que franquia de baixo custo não copia (elas vendem preço, e preço não cabe aqui);
- é o que justifica o dente 3D existir. Sem esse conceito, o 3D vira enfeite.

**Regra de disciplina:** a ousadia inteira mora na seção 3. As outras oito seções são
deliberadamente quietas. Se a seção 5 começar a ficar interessante, ela roubou do dente.

**A página não faz:** não centraliza nada além do rodapé, não usa card, não usa sombra,
não repete o mesmo espaçamento entre seções, não tem ícone.

---

## 2. Paleta

Os seis tokens do BRIEF, sem alterar valor. O que este plano acrescenta é o **papel de
cada um** e o **teto de uso** — token sem regra de uso vira decoração.

| Token | Hex | Papel | Teto de uso |
|---|---|---|---|
| `--osso` | `#EFEDE6` | fundo padrão da página | ~70% da área |
| `--tinta` | `#1C211F` | todo o texto sobre osso | — |
| `--eucalipto` | `#33473F` | fundo de duas seções (anatomia, agendar) + preenchimento do CTA | ~22% |
| `--carvalho` | `#C6A47E` | só superfície fotográfica e bloco de textura. **Nunca em preenchimento de UI** | ~5% |
| `--linha` | `#C8CCC4` | fio de 1px: régua da prancha, divisor de tratamento, borda de campo | 1px sempre |
| `--ambar` | `#B8862F` | **só** o ponto de hotspot ativo na seção 3 | ~6 pontos de 10px na página |

### Contraste medido (WCAG 2.1) — já calculado, não precisa refazer

| Par | Razão | Veredito |
|---|---|---|
| tinta sobre osso | 13,6:1 | AAA |
| eucalipto sobre osso | 8,6:1 | AAA |
| osso sobre eucalipto | 8,6:1 | AAA |
| tinta sobre carvalho | 6,9:1 | AAA |
| linha sobre eucalipto | 6,2:1 | fio bem visível no escuro |
| **âmbar sobre eucalipto** | **3,1:1** | passa como componente gráfico, **reprova como texto** |
| **carvalho sobre eucalipto** | **4,3:1** | **reprova texto pequeno** |
| linha sobre osso | 1,4:1 | decorativo apenas |

Três regras que saem direto desses números:

1. **O âmbar nunca recebe texto e nunca vira fundo.** É um ponto de 10px e o brilho de
   um fio. Nada mais.
2. **Nunca escrever em carvalho sobre eucalipto.** Texto secundário no fundo escuro é
   `--osso` a 78% de opacidade (dá 5,9:1).
3. **Foco de teclado:** contorno 2px `--tinta` com `outline-offset: 2px` sobre osso;
   `--osso` sobre eucalipto. Nunca `outline: none`. **Nunca âmbar no foco** — foco não
   é acento, é acessibilidade, e 3,1:1 não basta.

### Alerta para a seção 3

O hotspot âmbar tem 3,1:1 contra o eucalipto. Suficiente para componente gráfico, mas
significa que "esta parte está ativa" **não pode depender só da cor**. O estado ativo é
âmbar + fio engrossado para 1,5px + rótulo em peso 500. Três sinais, não um.

---

## 3. Tipografia

**Display:** Cabinet Grotesk · pesos 400 e 500 apenas
**Texto:** Switzer · pesos 400 e 500 apenas

Quatro `.woff2` locais, `font-display: swap`, `preload` só no arquivo do display (é o
LCP). **Nada de peso 700** — negrito grosso em display grande é assinatura de template.

> Sobre a licença do Cabinet Grotesk, ver a seção "Fontes" do `HANDOFF.md`. O zip que
> está hoje em `public/fonts/` **não serve para uso comercial**.

| Papel | Família / peso | Tamanho | Entrelinha | Tracking |
|---|---|---|---|---|
| Abertura | Cabinet 500 | `clamp(2.6rem, 6.8vw, 5rem)` | 0.98 | −0.022em |
| Título de seção | Cabinet 500 | `clamp(1.85rem, 3.2vw, 2.9rem)` | 1.06 | −0.015em |
| Nome de tratamento | Switzer 500 | `clamp(1.15rem, 1.6vw, 1.4rem)` | 1.25 | −0.005em |
| Corpo | Switzer 400 | `1.0625rem` | 1.6 | 0 |
| Corpo em coluna estreita | Switzer 400 | `1rem` | 1.62 | 0 |
| Rótulo da prancha | Switzer 500 | `0.875rem` | 1.35 | 0 |
| Rodapé / CRO | Switzer 400 | `0.9375rem` | 1.55 | 0 |

**Medida de linha:** `max-width: 62ch` no corpo, `54ch` no texto ao lado da prancha.

**Regras negativas** (cada uma corresponde a um item da seção 9 do BRIEF):
sentence case em 100% do texto, inclusive rótulo e botão · zero caixa alta com tracking
positivo · nenhuma palavra do título em cor diferente · nenhuma monoespaçada em lugar
nenhum, nem em número · sem travessão espaçado como ornamento · sem seta colada em link
ou botão.

---

## 4. Grade e ritmo vertical

Grade de 12 colunas, gutter 24px, margem lateral `clamp(20px, 6vw, 88px)`.

A primeira coluna é **a margem da prancha**: calha vertical reservada onde vivem os fios
e os rótulos anatômicos. Fora da seção 3 ela fica vazia de propósito — é o vazio que faz
a página parecer folha de estudo e não grade de agência.

### Ritmo deliberadamente irregular

```
abertura          → como atendemos     96px     encosta, cria urgência de leitura
como atendemos    → anatomia          208px     respiro máximo, prepara o momento
anatomia (pin)                      +220% vh    a seção mais longa da página
anatomia          → tratamentos        56px     colapso brusco: entra o denso
tratamentos (itens entre si)           0px      divididos por fio de 1px, nada mais
tratamentos       → textura esmalte     0px     o bloco de vídeo encosta na lista
textura esmalte   → quem atende       152px
quem atende       → estrutura         112px
estrutura         → 1ª consulta       184px     segundo maior respiro da página
1ª consulta       → agendar           128px
```

**Fundos:** osso por padrão; eucalipto em *anatomia* e em *agendar*. Duas trocas de
fundo na página inteira. Separação por cor e por espaço — `box-shadow: none` global,
sem exceção.

**Radius:** 2px em `input` e `select`. `0` em todo o resto, botão CTA incluído.

---

## 5. Wireframe — 1440px

```
┌─────────────────────────────────────────────────────────────────────┐
│ [PREENCHER clínica]                            Agendar avaliação    │ header estático (não fixo),
├─────────────────────────────────────────────────────────────────────┤ sem borda, sem fundo próprio
│                                                                     │
│  1 · ABERTURA                        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                      ░░░░ hero-molar-loop ░░░░░░░░░ │ vídeo sangra pela direita,
│  Antes de tratar,                  ░░░░░░ 8s · muted · loop ░░░░░░░ │ altura 78vh, sem borda
│  a gente explica ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ▓ = linha do título com
│  o que está acontecendo. ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ fundo osso sólido atrás,
│                                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ invadindo o vídeo
│  Uma frase de apoio, duas linhas,  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  sem promessa e sem superlativo.   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                     │
│  ┌────────────────────┐                                             │ CTA: eucalipto sólido,
│  │ Agendar avaliação  │                                             │ radius 0, sem seta, com ímã
│  └────────────────────┘                                             │
│                                                                     │ ← 96px
│  2 · COMO ATENDEMOS                                                 │
│                                                                     │
│         Ninguém aqui vai te dar sermão.                             │ título deslocado 2 colunas
│                                                                     │ à direita — quebra a régua
│         Três parágrafos curtos, 62ch, coluna deslocada.             │ do topo de propósito
│         Sem lista, sem ícone, sem bullet. Texto corrido.            │
│         É a seção mais silenciosa da página, e isso é o ponto.      │
│                                                                     │
│                                                                     │ ← 208px
├═════════════════════════════════════════════════════════════════════┤ troca p/ fundo eucalipto
│▓▓▓▓▓▓▓▓▓▓▓▓ 3 · O DENTE — seção pinada, +220% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                                     │
│  esmalte ○────────────┐                                             │ fio 1px --linha
│                       │        ╱▔▔▔╲                                │ ponta ancorada em
│  dentina ○────────────┤       │  ●  │  ← canvas WebGL               │ coordenada 3D projetada,
│                       │       │ ╱ ╲ │     dente gira por scroll     │ reposicionada por frame
│  colo do              │       │╱   ╲│     scrub: 1                  │
│  dente   ○────────────┤       ╲     ╱                               │ ● = hotspot --ambar
│                       │        ╲   ╱                                │   (o único da página)
│  raiz    ○────────────┘         ╲ ╱                                 │
│                                                                     │
│         ┌───────────────────────────────────────┐                   │ painel de texto: entra ao
│         │ Parágrafo curto da parte selecionada, │                   │ clicar no hotspot, some
│         │ e o link para o tratamento ligado.    │                   │ ao trocar de parte
│         └───────────────────────────────────────┘                   │
├═════════════════════════════════════════════════════════════════════┤ volta p/ osso  ← 56px
│                                                                     │
│  4 · TRATAMENTOS                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│   Implante dentário                                              +  │ linha inteira é <button>
│  ─────────────────────────────────────────────────────────────────  │ aria-expanded, hover
│   Canal (endodontia)                                             +  │ desloca 12px à direita
│  ─────────────────────────────────────────────────────────────────  │
│   Clareamento                                                    −  │ aberto: altura 0→auto
│      ┌─────────────────────────┐  Texto do que é, quanto tempo      │ nunca dois abertos
│      │      foto/estrutura     │  leva, e o que a pessoa sente.     │
│      └─────────────────────────┘  Sem preço. Sem garantia.          │
│  ─────────────────────────────────────────────────────────────────  │
│   [PREENCHER demais especialidades registradas no CRO]           +  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │ ← 0px, encosta
│  ░░░░░░░░░░░░░ texture-enamel-loop · faixa 46vh ░░░░░░░░░░░░░░░░░░░ │ contido (não full-bleed),
│  ░░░░░░░░░░░░░ contido na margem · parallax 0.15 ░░░░░░░░░░░░░░░░░░ │ margem lateral preservada
│                                                                     │ ← 152px
│  5 · QUEM ATENDE                                                    │
│                                                                     │
│  ┌──────────────┐   [PREENCHER nome completo]                       │ retrato 4:5, sem radius,
│  │              │   [PREENCHER especialidade registrada]            │ sem moldura, sem sombra
│  │   retrato    │   CRO-MG [PREENCHER]                              │
│  │              │                                                   │ CRO como texto normal,
│  └──────────────┘   Duas linhas sobre como essa pessoa atende.      │ não como "badge"
│                                                                     │
│      ┌──────────────┐   [PREENCHER segundo profissional]            │ segundo bloco desalinhado
│      │   retrato    │   ...                                         │ do primeiro de propósito
│      └──────────────┘                                               │
│                                                                     │ ← 112px
│  6 · ESTRUTURA                                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░  A parede é dessa cor. É esse o lugar.  │ clinic-room em bloco de
│  ░░░░  clinic-room     ░░░░  Duas frases sobre esterilização e      │ 7 colunas, texto em 4,
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░  fluxo de material.                     │ 1 coluna de calha vazia
│                                                                     │ ← 184px
│  7 · O QUE ACONTECE NA PRIMEIRA CONSULTA                            │
│                                                                     │
│   1   Você chega e preenche uma ficha curta.          ~5 min        │ numeração legítima:
│   2   Conversa sobre o que te trouxe.                ~10 min        │ é sequência real.
│   3   Exame clínico.                                 ~15 min        │ duração à direita,
│   4   Radiografia, se for necessária.                ~10 min        │ alinhada por tabular-nums
│   5   Explicação do que foi encontrado.              ~10 min        │ do Switzer, não mono
│   6   Você sai com o plano por escrito.               ~5 min        │
│                                                                     │ ← 128px
├═════════════════════════════════════════════════════════════════════┤ eucalipto
│  8 · AGENDAR                                                        │
│                                                                     │
│  Manda uma mensagem.          Nome ____________________             │ 3 campos, radius 2px,
│  A gente responde no          O que te trouxe aqui  [ v ]           │ borda 1px --linha,
│  horário que você marcar.     Melhor horário        [ v ]           │ label acima, sempre
│                                                                     │ visível (sem placeholder
│                               ┌────────────────────┐                │ fazendo papel de label)
│                               │ Agendar avaliação  │                │
│                               └────────────────────┘                │ monta link do WhatsApp
├─────────────────────────────────────────────────────────────────────┤
│  9 · RODAPÉ                                                         │
│  [PREENCHER clínica]      Endereço [PREENCHER]      ┌─────────────┐ │
│  Responsável técnico:     Telefone [PREENCHER]      │  mapa/link  │ │
│  [PREENCHER] · CRO-MG     Horário  [PREENCHER]      └─────────────┘ │
│  [PREENCHER]                                                        │
│                           Ver avaliações no Google (link externo)   │ link, não widget:
└─────────────────────────────────────────────────────────────────────┘ avaliação não é
                                                                        republicada aqui
```

---

## 6. Wireframe — 390px

```
┌───────────────────────────────┐
│ [PREENCHER]                   │  header só com o nome
├───────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  vídeo passa a ficar
│ ░░░ hero-molar-loop 42vh ░░░░ │  ACIMA do título no
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  mobile — sobreposição
├───────────────────────────────┤  de texto em 390px é
│ Antes de tratar,              │  risco de legibilidade
│ a gente explica o que         │
│ está acontecendo.             │
│                               │
│ Frase de apoio.               │
│ ┌───────────────────────────┐ │  CTA em largura total
│ │    Agendar avaliação      │ │  só nesta ocorrência
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ Ninguém aqui vai te dar       │
│ sermão.                       │
│ Texto corrido.                │
├═══════════════════════════════┤  eucalipto · SEM pin
│      ╱▔▔▔╲                    │  dente gira por
│     │  ●  │  canvas           │  IntersectionObserver
│     │ ╱ ╲ │  + arraste do     │  + progresso simples
│      ╲   ╱   dedo             │
│                               │  fios NÃO saem para a
│  ○ esmalte  ○ dentina         │  margem: viram chips
│  ○ colo     ○ raiz            │  tocáveis de 44px
│  ┌─────────────────────────┐  │  abaixo do canvas
│  │ texto da parte ativa    │  │
│  └─────────────────────────┘  │
├═══════════════════════════════┤
│ Implante dentário          +  │  alvo de toque 56px
│ ───────────────────────────── │
│ Canal                      +  │
│ ───────────────────────────── │
│ Clareamento                −  │
│   texto + foto empilhados     │
│ ───────────────────────────── │
├───────────────────────────────┤
│ ░ texture-enamel 30vh ░░░░░░░ │  sem parallax no mobile
├───────────────────────────────┤
│ ┌─────────┐                   │
│ │ retrato │ [PREENCHER]       │  empilha
│ └─────────┘ CRO-MG [PREENCH.] │
├───────────────────────────────┤
│ ░ clinic-room ░░░░░░░░░░░░░░░ │
│ Texto da estrutura.           │
├───────────────────────────────┤
│ 1  Você chega...      ~5 min  │
│ 2  Conversa...       ~10 min  │
│ ...                           │
├═══════════════════════════════┤
│ Nome _______________________  │
│ O que te trouxe      [ v ]    │
│ Melhor horário       [ v ]    │
│ ┌───────────────────────────┐ │
│ │    Agendar avaliação      │ │
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ rodapé empilhado + CRO        │
└───────────────────────────────┘
╔═══════════════════════════════╗
║      Agendar avaliação        ║  barra fixa, entra após
╚═══════════════════════════════╝  a seção 3, mesmo verbo
                                   e mesma cor. safe-area
                                   inset-bottom respeitado
```

---

## 7. Revisão contra a seção 9 do BRIEF — o que mudou e por quê

Cada linha é uma decisão de reflexo que foi descartada.

| Reflexo descartado | O que ficou no lugar | Item da seção 9 |
|---|---|---|
| Creme `#F4F1EA` + serifada + terracota `#D97757` | `--osso` (mais frio, mais cinza) + grotesca + zero terracota | 1 |
| "SOBRE NÓS" em caixa alta espaçada acima do título | número de seção só no wireframe; na página, nem isso | 5 |
| Grade de 3 cards iguais em "Tratamentos" | lista de linhas separadas por fio de 1px, expansíveis | 4 |
| `01 / 02 / 03` nas seções | numeração só na seção 7, que **é** sequência cronológica real | 13 |
| Ícone de dente/escova em círculo verde | nenhum ícone na página; as únicas formas são o dente 3D e o fio | 14, 15 |
| Abertura centralizada: título + subtítulo + dois botões | abertura assimétrica, 60% à esquerda, um botão só | 12 |
| `#111` como cor de texto | `--tinta #1C211F`, verde-escuro de verdade, com par medido | 10 |
| Inter / Poppins / Montserrat | Cabinet Grotesk + Switzer | 11 |
| Seta no fim do CTA | botão sem seta; o affordance é a cor sólida e o ímã | 7 |
| Mono em "~5 min" e no CRO | Switzer com `font-variant-numeric: tabular-nums` | 9 |
| `5 min · exame · sala 2` | frase inteira, sem ponto do meio | 6 |
| Sombra suave separando blocos | separação por troca de fundo e por espaço variável | 4 |
| Gradiente no bloco do dente | fundo eucalipto chapado; translucidez vem do material do 3D | 3 |

### Duas decisões tomadas fora do BRIEF, registradas

1. **No mobile o vídeo da abertura vai acima do título, não atrás.** O BRIEF descreve o
   título invadindo a borda do vídeo — funciona em 1440px, onde há área de osso sólida
   atrás de cada linha do título. Em 390px, sobrepor texto a 720p em movimento é abrir
   mão do contraste AA de forma que não dá pra testar com confiança. O efeito de invasão
   fica no desktop.
2. **O CTA aparece no header desde o topo, no desktop.** Não é CTA secundário: mesmo
   verbo, mesma cor, mesmo destino. O BRIEF proíbe *competição*, não repetição.
   **← esta é uma das decisões pendentes, ver `HANDOFF.md`.**

---

## 8. Copy da abertura — duas candidatas

Não é o passo 3, mas a abertura define o tom de tudo. Recomendação: **A**.

**A.** "Antes de tratar, a gente explica o que está acontecendo."
Apoio: "Você vai entender o seu caso antes de decidir qualquer coisa. Inclusive antes
de decidir se vai tratar aqui."

**B.** "Você chega com dúvida. Sai com um plano por escrito."
Apoio: "A primeira consulta é para entender o que está acontecendo na sua boca, e para
você sair sabendo o que fazer."

Nenhuma tem superlativo, promessa de resultado ou preço. A B tem uma vantagem:
descreve o que a pessoa leva embora.
