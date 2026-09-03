# HANDOFF — estado do projeto e como retomar

Atualizado em 02/09/2026, depois da troca dos vídeos.
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
| 6. Screenshot 1440/390 + autocrítica contra a seção 9 | **Feito.** Lighthouse 98/100/100/100 |

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

### 1.4 ffmpeg

Já instalado na máquina original (`ffmpeg 9.0.1`). Numa máquina nova:

```bash
winget install Gyan.FFmpeg          # Windows
# ou: brew install ffmpeg           # macOS
```

Feche e reabra o terminal depois, para o PATH atualizar. É o que faz
`npm run video` funcionar.

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

O material bruto saiu da raiz e foi para `_origem/`, que fica fora do build.
Os MP4 originais foram renomeados: os nomes tinham maiúsculas e reticências
Unicode, que dão problema em CI Linux.

O peso morto de `public/` também saiu:

- `dente-molar.glb` (1,05 MB, o export sem Draco) → `_origem/`. Ninguém o
  referenciava; o de produção é o `dente-molar-draco.glb`, de 26 KB
- os vídeos substituídos → `_origem/video-antigo/`

O deploy caiu de 7,65 MB para 6,60 MB.

### 4.2 Vídeos — TROCADOS

Os três originais saíram. O lote novo foi gerado no Google Flow a partir dos
prompts em `https://claude.ai/code/artifact/f1f3d84a-521e-49d7-8bb6-fcdb22a6a44e`,
e processado por `npm run video`.

| slot | arquivo | loop | webm |
|---|---|---|---|
| abertura | `hero-molar` | dissolve 0,7 s | 87 KB |
| faixa entre 4 e 5 | `esmalte` | dissolve 1,0 s | 189 KB |
| seção 6, título | `sala-vazia` | pingue-pongue | 351 KB |
| seção 6, esterilização | `instrumental-selado` | dissolve 0,9 s | 347 KB |

**O que a troca resolveu**

*A emenda do loop.* Nenhum gerador entrega loop que fecha. Medido antes e
depois, numa escala em que 0 é emenda invisível:

```
hero-molar            9,2  →  0,41
esmalte              29,2  →  1,72
instrumental-selado  19,3  →  2,06
sala-vazia           46,3  →  0,63
```

A sala tinha um travelling para dentro do quarto, e dissolve não resolve isso
porque a escala muda. Ela usa pingue-pongue: toca de ida e volta, o que fecha
exato e, num movimento lento, lê como respiração.

*A temperatura de cor.* Os assets antigos estavam entre +29 e +32 de desvio
quente (R−B) contra +9 do fundo `--osso`. Os novos ficaram entre −1 e +15. A
correção que faltava é assada no arquivo por `scripts/preparar-videos.mjs`, e
**o `filter` de CSS foi removido** — ele custava cerca de 250 ms de
renderização e não distinguia um vídeo do outro. A abertura precisava
esquentar; a sala já estava no ponto.

*O creme.* O `texture-enamel` mostrava creme sendo despejado e lia como
sorvete numa página de dentista. Era o maior arquivo do site, 414 KB, para um
bloco `aria-hidden` que não informava nada.

**O que a troca acrescentou**

A seção 6 dizia em texto que o instrumental sai da autoclave selado e que a
embalagem é aberta na frente da pessoa, e não tinha imagem nenhuma disso —
era só promessa escrita. Agora tem, e é a cena que mais constrói confiança
entre as que o CFO-196 permite.

**Não usados, e por quê:** em `_origem/video-flow/nao-usados/`. Um deles tem
tripé de câmera visível ao fundo. O Flow também gerou a sala duplicada — os
dois arquivos tinham o mesmo MD5.

### 4.3 Ferramentas de vídeo — ffmpeg instalado

`ffmpeg 9.0.1` via `winget install Gyan.FFmpeg`. O que era pendência agora é
`npm run video`, que lê `_origem/video-flow/` e escreve `public/video/`:
tira o áudio (o Veo gera junto), fecha o loop, corrige a cor, normaliza para
1280×720 e gera `.webm`, `.mp4` e `-poster.webp`.

Para trocar um vídeo: ponha o novo em `_origem/video-flow/` com o nome do
slot, ajuste a receita no topo do script se o movimento pedir, e rode.

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
