# HANDOFF — estado do projeto e como retomar

Atualizado em 02/09/2026, no fim da sessão do passo 6.
Leia este arquivo primeiro. Ele diz onde o projeto parou e o que fazer em seguida.

---

## Onde o projeto está

| Passo (ordem de trabalho do `CLAUDE.md`) | Estado |
|---|---|
| 1. Plano de design | **Feito e aprovado.** Está em `PLANO-DESIGN.md` |
| 2. Scaffold Astro + Tailwind + tokens + fontes | **Feito.** Build limpo, `astro check` sem erros |
| 3. Estrutura semântica com copy real, sem movimento | **Feito.** 9 seções, conformidade e a11y verificadas |
| 4. Camada de movimento (`MOTION.md`) | **Feito**, menos o que depende do 3D |
| 5. Cena 3D do dente sob demanda | **Feito.** Carrega sob demanda, verificada em navegador |
| 6. Screenshot 1440/390 + autocrítica contra a seção 9 | **Feito.** Lighthouse 97/100/100/100 |

### Decisões que estavam pendentes, agora fechadas

- **Copy da abertura: A.** "Antes de tratar, a gente explica o que está acontecendo."
- **Header: com CTA.** Mesmo verbo, mesma cor, mesmo destino do CTA principal.
- **Fontes: Cabinet Grotesk + Switzer, ambas do Fontshare,** sob ITF Free Font License.
  O zip do Befonts foi removido do repositório. Cópia da licença em
  `public/fonts/LICENCA-Fontshare-FFL.txt`.

### O que o passo 2 entregou

- Astro 7.2.10 + Tailwind 4.1 (config em CSS, via `@theme` — não há `tailwind.config.mjs`)
- `src/styles/tokens.css` — os seis tokens com papel e teto documentados, a escala
  tipográfica, o ritmo vertical, a grade e as regras de base (sombra zero, raio zero,
  foco visível, `prefers-reduced-motion`)
- `src/layouts/Base.astro` — head, canonical, preload só do display
- `_origem/` — material bruto (OBJ, GLB sem Draco, MP4 de render) fora do build

### O que o passo 3 entregou

As 9 seções do fluxo do BRIEF, cada uma em um componente próprio em
`src/components/`, com toda a copy em `src/data/conteudo.ts`.

Decisões de implementação que valem registro:

- **Tratamentos usam `<details>/<summary>`, não `<button aria-expanded>`.** O
  `MOTION.md` pede button, mas `<summary>` já *é* um botão para o navegador e
  expõe `aria-expanded` sozinho — com a vantagem de abrir e fechar sem uma
  linha de JavaScript. O passo 4 anima interceptando o evento `toggle`, sem
  trocar a marcação.
- **A abertura tem as linhas do título explícitas** em `ABERTURA.tituloLinhas`.
  Duas razões: a quebra é editorial, e o passo 4 precisa de um elemento por
  linha para a máscara.
- **A invasão do título sobre o vídeo é o vídeo que nasce em 46%**, passando
  por baixo do texto, com a borda esquerda dissolvida por máscara linear. O
  texto continua nos 60% da esquerda. Medido: 172px de sobreposição, e o pior
  fundo sob a primeira linha dá **10,6:1** contra `--tinta`.
- **A seção 3 é a versão estática e completa da prancha**, não um rascunho: é
  o que fica visível sob `prefers-reduced-motion` e enquanto o WebGL do passo
  5 carrega. A imagem é um frame do `water-droplet-sliding` recortado em 4:5.
  Os fios de 1px até os rótulos **não existem ainda** — dependem de posição
  calculada em tempo de execução (`vector.project`), então nascem no passo 5.
- **O formulário não é um `<form>` com action.** Nada é enviado a servidor
  nenhum. Sem JavaScript o botão já é um link para o WhatsApp com mensagem
  genérica; o script só enriquece o texto. Enquanto `CLINICA.whatsapp` for
  `[PREENCHER]`, aparece um aviso no lugar de um botão quebrado.

Ferramentas novas, todas com script no `package.json`:

- `npm run conformidade` — varre o HTML **renderizado** contra a CFO-196:
  preço, superlativo, garantia, depoimento, antes/depois, CRO preenchido. Sai
  com código 1 se achar. Serve para CI.
- `npm run a11y` — hierarquia de títulos, alt, ordem de Tab com foco visível,
  accordion por Enter, JSON-LD parseando, `lang`.
- `npm run verificar` — roda os três mais os screenshots. **É o que tem que
  passar antes de dizer que um passo acabou.**

**Medido, não estimado:** 16 paradas de Tab, todas com foco visível de 2px ·
accordion alterna com Enter · JSON-LD válido · zero estouro horizontal em
390px e em 360px · 68,5 KB na primeira carga (27,1 HTML + 21,4 CSS + 20,0 da
fonte em preload), antes de vídeo e imagem · Three.js ausente do bundle ·
`astro check` sem erros · conformidade CFO-196 aprovada com 23 `[PREENCHER]`.

### Correções de segurança feitas nesta sessão

- `Base.astro`: `JSON.stringify` não escapa `</script>`. Os campos do JSON-LD
  são `[PREENCHER]` hoje, mas quem vai preenchê-los é outra pessoa colando
  dados do cliente. `<` agora vira `<` antes de entrar no `set:html`.
- `scripts/screenshot.mjs`: o servidor estático local resolvia `..` e servia
  arquivo de fora de `dist/`. Passou a validar que o caminho fica dentro da
  raiz. É ferramenta local e efêmera, mas era traversal de verdade.

O formulário do WhatsApp foi auditado e está correto: o texto vai pela URL
sempre via `URLSearchParams`, que escapa sozinho, e o destino é construído a
partir do link renderizado no servidor — o script não consegue apontar o botão
para outro domínio, nem para `javascript:`.

---

## Parte 1 — Preparar outra máquina

O passo 2 acabou sendo feito na máquina original. Esta parte continua valendo para
quando você trocar de computador.

### 1.1 Clonar

```bash
git clone https://github.com/lucas-s-santos/landingpageOdonto.git
cd landingpageOdonto
```

**Clone para fora do OneDrive.** Na máquina anterior o projeto estava dentro da pasta
sincronizada, e sincronizador mexendo em `.git/` durante `npm install` já corrompeu
repositório antes. Uma pasta local simples (`~/projetos/` ou `C:\projetos\`) evita isso.

### 1.2 Conferir o que precisa estar instalado

```bash
node -v      # precisa ser 22.12+ — é o engine declarado pelo Astro 7
npm -v
git --version
```

A máquina original tem Node 24.15 e Git 2.54. Depois de clonar, rode `npm install` e
`npx playwright install chromium`.

### 1.3 Identidade do git

```bash
git config user.name  "lucas-s-santos"
git config user.email "lucassilvadossantos2005@gmail.com"
```

O push é por HTTPS. Na máquina anterior o Git Credential Manager já estava autenticado;
na nova ele vai abrir o login do GitHub no primeiro `git push`.

### 1.4 ffmpeg — instale, continua pendente

**Não há ffmpeg em nenhuma das máquinas até agora**, e isso bloqueia as tarefas de vídeo
listadas na Parte 4.3.

```bash
winget install Gyan.FFmpeg          # Windows
# ou: brew install ffmpeg           # macOS
```

Feche e reabra o terminal depois, para o PATH atualizar. Confira com `ffmpeg -version`.

Sem ffmpeg dá para *inspecionar* vídeo (foi assim que os três foram analisados: frames
extraídos pelo decodificador do Windows via WPF MediaPlayer), mas não dá para editar.

---

## Parte 2 — Decisões (todas fechadas)

Ficam registradas aqui com o porquê. Nada aqui está pendente.

### 2.1 Plano de design — aprovado
Está em `PLANO-DESIGN.md`, é a saída do passo 1.

### 2.2 Fontes — RESOLVIDO

Ficou registrado porque é um erro fácil de repetir. O zip que estava em `public/fonts/`
veio do **Befonts**, com licença `Personal Use Only` e sem `.woff2` — não servia para
trabalho comercial. Foi substituído pelo pacote do **Fontshare**, sob ITF Free Font
License, a mesma do Switzer.

Estão em `public/fonts/`, 78 KB no total:

```
CabinetGrotesk-Regular.woff2   20,8 KB
CabinetGrotesk-Medium.woff2    20,5 KB
Switzer-Regular.woff2          16,7 KB
Switzer-Medium.woff2           20,3 KB
LICENCA-Fontshare-FFL.txt      cópia da licença
```

Se precisar baixar de novo: https://www.fontshare.com/fonts/cabinet-grotesk e
https://www.fontshare.com/fonts/switzer — usar a pasta `Fonts/WEB/fonts/` do zip.

### 2.3 Header — com CTA (decidido)

O plano coloca "Agendar avaliação" no header desde o topo, no desktop. É o mesmo verbo,
mesma cor e mesmo destino do CTA principal — então não é CTA secundário, é repetição
do CTA único. Numa página longa, dá saída a quem já decidiu.

### 2.4 Abertura — copy A (decidida)

> Antes de tratar, a gente explica o que está acontecendo.
>
> Você vai entender o seu caso antes de decidir qualquer coisa. Inclusive antes de
> decidir se vai tratar aqui.

### 2.5 (opcional, mas move mais que qualquer outra coisa) Referências em `refs/`

A pasta está vazia. O `SETUP.md` chama isso de "o passo que mais importa": 5 a 8
screenshots de sites com o acabamento que você quer — arquitetura, skincare, clínica de
estética de alto padrão, museu. **Não site de dentista.** Sem isso, o acabamento é
decidido só por descrição escrita, que é o canal mais fraco.

---

## Parte 3 — O que falta para vender

Os seis passos da ordem de trabalho estão feitos. O que resta não é código:
é dado do cliente e material.

### Bloqueia o deploy

- [ ] **Preencher os 23 `[PREENCHER]`.** Estão todos em `src/data/conteudo.ts`
      e no `astro.config.mjs` (o `site`). Nome da clínica, responsável
      técnico, **número do CRO**, endereço, telefone, WhatsApp, horário e o
      link do perfil no Google.
- [ ] **Revisar a lista de tratamentos com o cliente.** A seção 3 do BRIEF
      exige que especialidade só apareça se estiver registrada no CRO. Os sete
      itens estão escritos como procedimento e área de atuação, que é o que a
      clínica pode divulgar — mas a lista precisa bater com o que ela faz.
- [ ] **Retratos da equipe.** Hoje são blocos `[PREENCHER retrato 4:5]`.

### Melhora, não bloqueia

- [ ] `refs/` continua vazia
- [ ] peso morto em `public/` (ver Parte 4.1)
- [ ] posters em `.jpg`; em WebP economizariam ~18 KB

### Resultado medido do passo 6

```
Lighthouse, perfil mobile, sobre o build de produção:
  Performance     97
  Accessibility  100
  Best Practices 100
  SEO            100

  First Contentful Paint    1,5 s
  Largest Contentful Paint  2,2 s
  Total Blocking Time       120 ms
  Cumulative Layout Shift   0
```

Autocrítica contra a seção 9 do BRIEF, feita por varredura do HTML
renderizado: os quinze padrões proibidos, limpos. Três alarmes se mostraram
falsos positivos e estão registrados no commit — `serif` só aparece dentro de
`sans-serif`, o único gradiente é a **máscara** do vídeo da abertura (máscara
não é decoração), e `--font-mono` era um token padrão do Tailwind que nunca
chegava a ser aplicado. O token foi removido para o alarme não se repetir.

### Comandos

```bash
npm run dev            # http://localhost:4321
npm run verificar      # build + CFO-196 + a11y + movimento + 3D + Lighthouse + screenshots
npm run conformidade   # só a varredura legal
npm run a11y           # teclado, foco, títulos, JSON-LD
npm run motion         # checagem final do MOTION.md
npm run dente          # a cena 3D
npm run lighthouse     # performance, perfil mobile
npm run shot           # screenshots em 1440 e 390
npx astro check        # tipos
```

**Atenção:** os scripts de teste sobem servidor nas portas 4501–4504,
**não** na 4321. Isso não é detalhe: enquanto usavam a 4321, um `astro dev`
rodando em paralelo servia as capturas no lugar do `dist/`, com a barra de
ferramentas do Astro no meio da página. Agora eles falham alto se a porta
estiver ocupada, em vez de medir a página errada em silêncio.

---

## Parte 4 — Pendências técnicas apuradas nesta sessão

Coisas que já foram medidas e não precisam ser redescobertas.

### 4.1 Arrumação de arquivos — FEITO

O material bruto saiu da raiz e foi para `_origem/`, que fica fora do build (o Astro só
empacota `src/` e `public/`). Os três MP4 foram renomeados no caminho: os nomes
originais tinham maiúsculas e reticências Unicode, que dão problema em CI Linux.

**Ainda sobra peso morto dentro de `public/`, que vai para o deploy:**

```
public/model/dente-molar.glb      1,05 MB   fallback sem Draco. O de produção é o
                                            dente-molar-draco.glb, de 26 KB.
public/video/hero-molar.{webm,mp4}          versão sem o dissolve de loop costurado
public/video/texture-enamel.{webm,mp4}      idem
```

Somam ~2,4 MB que nenhuma seção da página referencia. Não afetam Lighthouse (o
navegador não pede o que a página não usa), mas engordam o deploy. Decidir no passo 5
se ficam como debug ou se saem para `_origem/`.

### 4.2 Os três vídeos foram analisados; o veredito

Não há ffmpeg na máquina antiga, então os frames foram extraídos pelo decodificador do
Windows. Medições feitas:

**`Water_droplet_sliding_on_molar` (o vídeo novo, 1280×720, 8,000s, 24 fps, 1,07 MB)**

É o melhor render dos três — o único que mostra a raiz inteira e a bifurcação, que é
justamente a anatomia de que a seção 3 fala. Mas **não serve para a abertura**:

1. **Não fecha o loop.** Em 0,04s o dente está de frente, duas raízes, câmera longe. Em
   7,95s está girado ~35°, três raízes à vista, câmera perto. Com `loop` no `<video>`
   vai ter um salto visível a cada 8 segundos. Os arquivos `-loop` de `public/video/`
   têm dissolve costurado; este não tem.
2. **O fundo briga com a paleta.** Fundo medido em `#DBD0C3`; o `--osso` é `#EFEDE6`.
   Desvio quente (R−B) do vídeo: **+25**. Do `--osso`: **+9**. É um bege amarelado sobre
   uma página que é neutro levemente frio — lê como retângulo sujo colado na página. E
   bege quente é o item 1 da seção 9 do anti-clichê.
3. **O objeto é pequeno no quadro** (~34% da largura, muito vazio em volta). É a
   linguagem "render 3D em fundo de estúdio bege", exatamente o visual de banco de
   imagem que o BRIEF quer evitar.
4. **Tem faixa de áudio AAC.** O BRIEF manda todos sem áudio.

**Destino proposto:** o frame de ~6,0s (a gota chegando na bifurcação) vira o `poster`
do canvas WebGL da seção 3 — é o que a pessoa vê enquanto o Three.js carrega sob
demanda, e é o que ela vê sob `prefers-reduced-motion`. A imagem estática já conta a
anatomia que a seção explica.

**`hero-molar-loop` (o que já está em `public/video/`, 7,209s, 173 frames, 0,28 MB)**

Continua sendo a abertura. É um close cortado, o dente sangra para fora do quadro, a
matéria preenche a tela. É matéria-prima, não "um objeto posando" — é o que o conceito
de prancha anatômica pede.

**Correção de cor: os dois precisam.** Medição do quadro inteiro:

| | desvio quente (R−B) |
|---|---|
| `--osso` (token do BRIEF) | +9 |
| `Water_droplet_sliding` | +25 |
| `hero-molar-loop` | **+35** |

O hero atual é o mais quente dos dois. No passo 2/3, aplicar um `filter` leve de
matiz/saturação no `<video>`, calibrado até o fundo do vídeo bater no `--osso`. Sem
isso, todo bloco de vídeo vai parecer colado por cima da página em vez de integrado.

**Dado útil:** texto `--tinta` sobre a região do dente dá entre **6,6:1 e 7,7:1** em
todos os frames medidos. Se em algum momento quisermos escrever por cima do vídeo, o
contraste aguenta.

### 4.3 Tarefas de vídeo que dependem do ffmpeg

- [ ] remover a faixa de áudio do `Water_droplet_sliding` (é remux, `-c copy -an`, não
      reencoda e não perde qualidade)
- [ ] extrair o frame de ~6,0s como `poster` da seção 3, em WebP
- [ ] **se** decidir usar o droplet em movimento no lugar do `texture-enamel-loop`:
      costurar um crossfade de ~0,6s para fechar o loop
- [ ] gerar os posters em WebP (hoje são `.jpg`)

---

## Parte 5 — Piso de qualidade (vale em todos os passos)

Do `CLAUDE.md`, para não perder de vista:

- Lighthouse ≥ 90 em performance no mobile
- foco de teclado visível em tudo
- contraste AA
- funciona em 360px de largura
- `prefers-reduced-motion` desliga todo movimento e mostra versão completa e estática
- Three.js **fora do bundle inicial** (`import()` dinâmico quando a seção entra em view)
- JSON-LD `Dentist` preenchido
- nenhum vídeo em fundo full-bleed de tela cheia

E as três regras inegociáveis:

1. **Não pode parecer feita por IA.** Seção 9 do BRIEF, lida antes de escrever CSS.
2. **Resolução CFO-196/2019.** Sem preço, desconto, depoimento, antes/depois,
   superlativo ou promessa de resultado. Descumprir dá processo ético contra o dentista.
3. **Nunca inventar dado do cliente.** Nome da clínica, dentista, CRO, endereço,
   telefone e horário vão como `[PREENCHER]`. CRO inventado é falsificação.

---

## Parte 6 — Como retomar a conversa

Dentro da pasta do projeto:

```
Leia CLAUDE.md, BRIEF.md, MOTION.md, PLANO-DESIGN.md e HANDOFF.md.
Passos 1 e 2 estão feitos. Pode começar o passo 3.
```

Se quiser mudar algo do plano antes, diga o que muda — o `PLANO-DESIGN.md` é editável,
não é contrato. A página que está em `src/pages/index.astro` hoje é só verificação de
tokens; o passo 3 substitui o conteúdo dela inteiro, então não tem apego a ela.
