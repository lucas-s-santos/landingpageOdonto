# HANDOFF — estado do projeto e como retomar

Atualizado em 14/10/2026: rolagem que explica (seis momentos presos ao
scroll), as pranchas da esterilização, imagem nos tratamentos, prévia de
link e favicon. Ver a Parte 4C e o `PLANO-V2.md`. Leia este arquivo
primeiro — ele diz onde o projeto parou e o que fazer em seguida.

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

## Parte 3 — Modo demo e o que falta

### Como trocar entre demo e cliente

Uma linha, no topo de `src/data/conteudo.ts`:

```ts
export const MODO: 'demo' | 'cliente' = 'demo';
```

`demo` — a página que a CalmDev mostra para vender. Dados fictícios da
"Clínica Sobrado", em Alfenas, e uma linha no rodapé declarando que são
fictícios e assinando o trabalho.

A declaração já esteve numa faixa preta no topo e saiu de lá: um aviso em cima
da abertura contradiz o que a página existe para fazer, que é mostrar o
resultado pronto a quem vai comprar. No rodapé ela cumpre o papel sem
atrapalhar a leitura.

`cliente` — dados vazios, marcados `[PREENCHER]`, para ninguém publicar sem
preencher. É o modo em que o projeto nasceu.

**Endereço e nome, conferidos antes de usar.** A demo fica na Praça Getúlio
Vargas, 1000, Centro de Alfenas, CEP 37130-073. Foi verificado: os
consultórios que existem de verdade nessa praça estão nos números 245, 262 e
329, então a numeração não chega perto de 1000 e o endereço não é de ninguém.

O nome também. "Clínica Marena", a primeira tentativa, é uma clínica REAL em
São Paulo, com site, CNPJ e o handle `clinicamarena` no Facebook. A segunda,
"Vertente Odontologia", existe no Rio. Nome plausível de clínica quase sempre
já existe no Brasil. "Clínica Sobrado" não retorna nenhuma clínica
odontológica no país.

**A demo leva `noindex`.** Ela usa uma cidade real e uma praça real: indexada,
passaria a competir por buscas de Alfenas e a confundir quem procura dentista
lá. Sai sozinho quando `MODO` vira `'cliente'`. Por isso o Lighthouse marca
SEO 66 e a verificação aceita — mas só essa auditoria; qualquer outra falha de
SEO continua reprovando.

### Duas coisas não são inventadas nem no demo

Isto não é burocracia, e está no código com o motivo:

**O número do CRO** fica como `CRO-MG 00.000`. Registro profissional é
público: um número plausível pode ser o de um dentista real, e a página
passaria a atribuir o registro dele a uma pessoa que não existe. Zero nunca é
emitido. A linha do rodapé explica isso, o que vira argumento de venda —
mostra que quem fez o site cuida do lado legal.

**O telefone não é inventado, é o da CalmDev:** `(35) 98886-2172`, o mesmo do
WhatsApp. Um número plausível tirado do nada tocaria na casa de alguém que
nunca ouviu falar da clínica; um número falso ao lado de um WhatsApp que
funciona deixaria a demo incoerente. Sendo o mesmo e sendo real, quem testar
o botão cai com quem está vendendo.

**Os retratos da equipe** são monogramas, não fotos. Um rosto gerado
apresentado como profissional com nome e registro é fabricar uma pessoa, e
nenhuma declaração resolve isso. O monograma ocupa o mesmo espaço, lê como
escolha de design e não finge ser ninguém.

A opacidade dele é `0.8`, não menos: tinta sobre carvalho dá 6,9:1 cheia, mas
a 0.55 caía para 2,78:1 e reprovava até o piso de texto grande, que é 3:1.
Apontado pelo Lighthouse, não estimado.

### A demo está pronta

Nenhum `[PREENCHER]` visível na tela, e `npm run verificar` passa limpo.

O CTA leva para `wa.me/5535988862172`, o número da CalmDev, com a mensagem
montada a partir dos três campos:

> Olá! Vim pelo site e queria agendar uma avaliação. Meu nome é Ana Paula.
> Motivo: Estou com dor. Melhor horário para retornar: à noite.

Telefone e WhatsApp são o mesmo número de propósito: um telefone falso ao
lado de um WhatsApp que funciona deixaria a demo incoerente — quem ligasse
não seria atendido. Para separar, é só trocar `DEMO.telefone` por um número
não atribuível.

Pode ir para `clinicademo.calmdev.com.br`.

### O que falta quando virar cliente de verdade

- [ ] trocar `MODO` para `'cliente'` e preencher os `[PREENCHER]`
- [ ] preencher `EXPEDIENTE_CLIENTE` em `conteudo.ts` — é dele que saem a
      frase do rodapé, o JSON-LD e a linha de aberto/fechado do CTA. Vazio,
      os três somem em silêncio
- [ ] montar os links por canal para a clínica usar: `/?de=ig` na bio do
      Instagram, `/?de=google` no perfil, `/?de=cartao` no QR do balcão
- [ ] conferir a lista de tratamentos contra o que a clínica faz
- [ ] **conferir cada especialidade contra o registro no CRO daquele
      profissional** — "Clínica geral e endodontia" só pode ir ao ar se
      estiver registrada. Seção 3 do BRIEF
- [ ] retratos reais da equipe, 4:5
- [ ] **fotos reais da esterilização**, uma por etapa (lavagem, inspeção,
      embalagem, autoclave) e o vídeo ou foto da embalagem sendo aberta.
      No modo cliente as pranchas mostram `[PREENCHER]` até isso chegar:
      as imagens da demo foram geradas no Flow, e mostrar a esterilização
      de outro lugar como se fosse a da clínica é publicidade enganosa
- [ ] **vídeo ou foto real da sala**, pelo mesmo motivo — o `sala-vazia`
      também é gerado. Sai sozinho no modo cliente
- [ ] conferir com a clínica, etapa por etapa, o texto da cadeia de
      esterilização em `ESTRUTURA.cadeia` (é afirmação sobre o processo dela)
- [ ] dentista confere as 7 imagens dos tratamentos (material e modelo
      didático gerados no Flow; erro de instrumento é pior que não ter imagem)
- [ ] `npm run og` depois de preencher: a prévia do link sai do conteudo.ts
      e o script recusa gerar com `[PREENCHER]`. Trocar o `favicon.svg` pela
      marca da clínica
- [ ] trocar `site` no `astro.config.mjs` pelo domínio real

### Resultado medido

```
Lighthouse, perfil mobile, sobre o build de produção:
  Performance     97
  Accessibility  100
  Best Practices 100
  SEO            100
```

A varredura anti-clichê contra a seção 9 do BRIEF passa nos quinze padrões.

### Comandos

```bash
npm run dev            # http://localhost:4321
npm run verificar      # build + CFO-196 + a11y + movimento + 3D + Lighthouse + screenshots
npm run video          # reprocessa os vídeos de _origem/video-flow/
npm run imagem         # recorta as imagens de _origem/imagem-flow/ para src/assets/flow/
npm run og             # prévia do link (og.jpg), favicon e ícone da tela inicial
python scripts/marca.py   # a marca Colo em vetor, em marca/ (fonttools + brotli)
npm run conformidade   # só a varredura legal
npm run a11y           # teclado, foco, títulos, JSON-LD
npm run motion         # checagem final do MOTION.md
npm run dente          # a cena 3D
npm run lighthouse     # performance, perfil mobile
npm run shot           # screenshots em 1440 e 390
npx astro check        # tipos
```

**Atenção:** os scripts de teste sobem servidor nas portas 4501–4504,
**não** na 4321. Enquanto usavam a 4321, um `astro dev` rodando em paralelo
servia as capturas no lugar do `dist/`, com a barra de ferramentas do Astro
no meio da página. Agora eles falham alto se a porta estiver ocupada.

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

## Parte 4B — Sessão de 04/09/2026

### 4B.1 O pin da seção do dente saiu — a seção travava e cortava o texto

Sintoma relatado: a página "para" na seção 3 e as escritas ficam cortadas.
Não era impressão. Medido em 1440×900, com o pin que estava lá
(`trigger: '#anatomia', start: 'top top', end: '+=220%', pin: true`):

- `#anatomia` tem **1394px** de altura. Pinar elemento mais alto que a
  viewport prende na tela um bloco que não cabe nela
- **494px** da seção ficavam abaixo da dobra e **inalcançáveis**, porque o
  elemento estava preso
- o quarto rótulo ("Raiz") terminava **310px** abaixo da borda, cortado no
  meio da frase
- e isso durava os **1980px de scroll** em que a página não andava
- o pin-spacer ainda somava esses 1980px mortos à altura do documento

Sem o pin, a prancha inteira — figura mais os quatro rótulos — tem **815px** e
cabe numa janela de 900px: ela se monta na tela e a pessoa lê tudo de uma vez.
A altura do documento caiu de 10202 para 8222px.

O que mudou em `src/scripts/dente3d.ts`:

- **pin removido**, e com ele o `import()` de GSAP/ScrollTrigger que só
  existia para o desktop. O arquivo agora não importa GSAP em caminho nenhum
- **progresso ancorado na prancha, não na seção.** A seção carrega 368px de
  respiro e o título; ancorada nela, metade do giro era gasta com a figura
  fora da tela. Medido no laço de render, sem ouvinte de scroll — o que
  também funciona com o Lenis, que move o scroll por conta própria
- **giro centrado**: `(progresso - 0.5)`, não `progresso`. Antes o dente
  passava por 144° exatamente quando a prancha ficava centralizada — de
  costas na hora de ler, com os quatro pontos apontando para faces
  invisíveis. Agora a pose frontal cai no meio do percurso: ±90° nos
  extremos, ±27° na janela de leitura
- **aproximação centrada** (`sin`, não rampa): o dente chega mais perto
  quando está sendo lido
- a inércia que o `scrub: 1` dava virou o `lerp(0.12)` que já existia para o
  mobile. Um caminho só agora, desktop e celular

E em `src/components/Anatomia.astro`: a **figura virou `position: sticky`**
acima de 768px, com `align-self: start` (item de grid estica por padrão e
sticky não teria para onde correr). Segura no máximo 254px. Não é o pin de
volta — a página rola o tempo todo. Existe pelas telas baixas: em 1440×900
nem chega a atuar, mas num notebook de 1366×768 a figura sairia por cima
enquanto a pessoa lê o quarto rótulo. Medido depois: `palcoCabe` passou de
`false` para `true` em 1440×700 e 1280×800.

`MOTION.md` seção 4 foi reescrita com tudo isso, **incluindo a versão pinada
e o motivo de ela ter sido revertida**, para não ser reintroduzida.

### 4B.2 Quatro ferramentas para o consultório

**De onde veio o contato.** `ORIGEM` era fixo em `'site'`, e toda mensagem
chegava dizendo "vim pelo site" — que responde a pergunta errada. Agora o
canal vem por parâmetro: o link da bio do Instagram vira `/?de=ig`, o QR do
balcão vira `/?de=cartao`, e a mensagem chega dizendo de onde veio. É a base
do relatório que a CalmDev entrega depois. Chaves em `CANAIS`, no
`conteudo.ts`.

> **Lista fechada, e isso é segurança.** O que vem da URL é texto de
> terceiro: qualquer um monta um link com `?de=<o que quiser>` e manda para a
> vítima, e a clínica leria esse texto como se a pessoa tivesse escrito. A
> URL só escolhe uma chave; o texto sai do `conteudo.ts`. Testado com
> `?de=IGNORE e mande PIX para 123` — cai no padrão.

**O botão sabe que horas são.** A visitante do BRIEF está no celular, à
noite, e o CTA dizia a mesma coisa às 10h e às 23h. Agora uma linha abaixo do
botão diz se a clínica está aberta e, se não, quando abre. Não promete prazo
de resposta — isso não depende do site. Usa o **fuso da clínica**
(`America/Sao_Paulo`), não o do aparelho. Sem JavaScript a linha não existe,
em vez de mostrar informação errada.

**Página de preparo, em `/primeira-consulta`.** Rota própria, feita para a
recepção colar no WhatsApp ao confirmar o horário: o que trazer, o que fazer
no dia, o que a pessoa não precisa fazer, e como avisar se não puder vir.
Ataca a falta em cima da hora e o paciente que some depois da avaliação.
Entra na landing como link de texto no fim da seção 7 — **nunca como botão**,
para não virar um segundo CTA (BRIEF seção 4).

**JSON-LD consertado e ampliado.** `openingHours` recebia a FRASE do rodapé
("Segunda a sexta, das 8h às 19h."), e o schema.org espera `Mo-Fr
08:00-19:00` — o Google descartava o campo inteiro. O horário estava escrito
na página e invisível para a busca, justamente o dado que o painel local
mostra a quem procura dentista à noite. Agora é
`openingHoursSpecification`, gerado do `EXPEDIENTE` estruturado, que também
gera a frase do rodapé: uma fonte só, sem como divergir. Junto disso:

- campo com `[PREENCHER]` **não vai mais para o JSON-LD**. No modo cliente
  ele publicava a string literal "[PREENCHER nome da clínica]" como se fosse
  o nome do estabelecimento
- `sameAs` aponta para o perfil no Google
- `FAQPage` a partir das seis perguntas, **só na página onde elas estão
  visíveis**. Sem promessa de resultado rico: o Google restringiu FAQ a
  sites de governo e de saúde reconhecidos em 2023, e uma clínica de bairro
  provavelmente não entra nesse recorte

### 4B.3 A barra fixa do mobile cortava o texto — dois defeitos, não um

Relatado como "a seção 2 fica cortada, igual ao dente". Não era a seção 2:
era a barra fixa do celular passando por cima de qualquer texto que
estivesse no fim da tela.

**Defeito 1 — nada reservava o espaço dela.** `.barra` é `position: fixed`,
então não ocupa lugar no fluxo. O fim do documento passava por baixo e a
última linha ficava coberta para sempre. Agora o `<html>` ganha a classe
`tem-barra` junto com a barra, e o `body` reserva `--altura-barra`, que é
**medida** (83px no aparelho testado), não chutada — ela muda com a fonte do
sistema, com a área segura do aparelho e com o comprimento do texto do CTA.
Sem JavaScript a barra não aparece, a classe não entra e não sobra espaço
morto. `scroll-padding-bottom` acompanha, para âncora perto do fim não
posicionar o alvo debaixo dela.

**Defeito 2 — a barra não parecia uma barra, e é por isso que lia como
"cortado".** O botão usava `.cta--claro`, que é a variante para fundo
escuro: `background: osso` sobre uma barra que também é `osso`.
Preenchimento, borda e fundo na mesma cor — o botão sumia, a barra virava
uma linha de texto centralizada com um fio de 1px em cima, e o texto que
passava por baixo parecia frase quebrada em vez de conteúdo coberto. Trocado
por `.cta` (eucalipto), que é o mesmo botão da abertura. Contraste medido:
**8,48:1**.

### 4B.4 A varredura da CFO-196 agora cobre o site inteiro

`scripts/conformidade.mjs` lia só `dist/index.html`. Com uma rota só dava no
mesmo; com duas, não: copy que não passa pela varredura é exatamente por onde
uma infração vai ao ar. Agora percorre todo `.html` do build e reporta rota
por rota.

### 4B.5 Medido depois de tudo

```
Lighthouse, perfil mobile:  Performance 98 · Acessibilidade 100 ·
                            Boas práticas 100 · SEO 66 (noindex do demo)
CFO-196:                    aprovado nas 2 páginas
/primeira-consulta:         1 h1, nenhum nível pulado, 6 paradas de Tab com
                            foco de 2px, contraste 13,93:1, 0px de estouro
                            em 360px
dente:                      os 14 testes passam, 4 fios, nenhum sobre texto
```

## Parte 4C — Sessão de 14/10/2026: rolagem que explica

Pedido: visual mais profissional para vender, com elementos que se mexem ao
rolar, usando como ideia componentes do Skiper UI e os sites spell.sh,
originkit.dev, reactbits.dev e inspora.design. O plano, a revisão contra a
seção 9 e o que foi descartado estão no `PLANO-V2.md`.

### 4C.1 A regra mudou, com registro

BRIEF seção 6 e MOTION.md ganharam a distinção: movimento **preso** à
rolagem (a posição do scroll é a posição da animação) conta como ação da
pessoa; movimento **disparado** pela rolagem continua proibido. Um por seção,
e cada um carrega informação.

### 4C.2 Skiper UI: as ideias, não os componentes

Nenhum `shadcn add` foi rodado. 11 dos 18 pedidos são Pro (404 sem
licença), os gratuitos são React + framer-motion num projeto Astro sem
React, e a versão gratuita exige crédito no rodapé do cliente. As ideias
foram reescritas em CSS scroll-driven animations: 0 KB de JavaScript novo,
rodando também no celular.

### 4C.3 Os seis momentos

Especificados com valores na seção 11 do `MOTION.md`: a câmera que chega
perto do dente na abertura, a frase que acende na seção 2, a fenda do
esmalte, as pranchas da esterilização que empilham, e o fio e o relógio da
primeira consulta. O dente continua como estava.

### 4C.4 Defeitos encontrados no caminho, medidos

- **O minificador matava as animações sem erro.** Ele juntava
  `animation-timeline` dentro do atalho `animation:`, e o Chrome 151
  descartava o atalho: cinco dos seis momentos saíam `animation: none`.
  Conserto: propriedades separadas, nunca o atalho. `npm run motion` agora
  confere cada um vivo.
- **A pilha soltava a última prancha primeiro** e deixava à mostra um pedaço
  da foto da autoclave embaixo dela. Conserto: margem que diminui um degrau
  por prancha. Medido em 360 quadros, em 1440×900, 1366×768 e 390×844:
  zero pixel de vazamento.
- **O botão do cabeçalho quebrava em duas linhas no celular.** Sai abaixo de
  640px, como o PLANO-DESIGN já previa.

### 4C.5 Imagens

As 11 do lote 2 do Flow estão em `_origem/imagem-flow/` (originais de 2,4 MB)
e recortadas em `src/assets/flow/` por `npm run imagem`. O `<Picture>` do
Astro gera AVIF e WebP em quatro larguras: o celular baixa entre 11 e 13 KB
por prancha. Cor medida antes de entrar: todas entre −12 e +15 de desvio
R−B (o alvo é até +18). Prompts em
`https://claude.ai/artifact/Exm4o96a66m5Eg6gmgJPTG`.

### 4C.6 Prévia de link e favicon

Não existiam. A clínica distribui a página pelo WhatsApp e pela bio do
Instagram, e o link chegava sem imagem. `npm run og` gera `og.jpg`
(1200×630, 42 KB), `favicon.svg` e `apple-touch-icon.png` a partir do
conteudo.ts.

## Parte 4D — Sessão de 14/10/2026, tarde: marca, abertura e menu

### 4D.1 A marca do produto: Colo

Nome escolhido para o produto que a CalmDev vende às clínicas. As três
imagens que o Flow gerou estão em `_origem/logo-flow/`; nenhuma servia como
arquivo final (cópia fantasma da palavra numa, fio entrando no círculo como
barra escura noutra, e imagem de gerador não é vetor). O desenho foi refeito
em `marca/`, por `python scripts/marca.py` (precisa de `pip install fonttools
brotli`): a palavra em curvas da Cabinet Grotesk, com o "o" final virando o
ponto da prancha e o fio saindo dele, e o símbolo ponto + fio. A licença da
fonte permite logo e registro como marca (seção 01, parágrafo 6). A
assinatura aparece no rodapé da demo.

**Antes de imprimir ou registrar:** busca no INPI (classes 42 e 35) e no
registro.br. A busca na web não achou conflito na área, mas não substitui.

**Atenção para o caminho "sistema":** a mesma licença proíbe disponibilizar
a fonte para terceiros dentro de "plataforma SaaS, editor de modelos ou
serviço parecido" (seção 02). Site entregue pronto para uma clínica é uso
normal. Se o Colo virar um painel onde a clínica edita o próprio site com a
fonte, isso precisa ser revisto antes.

**Decisão do Lucas, 14/10/2026: o sistema é só de demonstração**, para
divulgar o Colo em vídeo. Por isso o cabeçalho da demo leva a marca Colo no
lugar de "Clínica Sobrado" (`src/data/marca.ts`), e o menu também. O rodapé
continua com a clínica fictícia: responsável técnico e CRO zerado mostram a
conformidade com a CFO-196, que é parte do que se vende. O modo `cliente`
continua funcionando e volta o nome da clínica no cabeçalho.

### 4D.2 A abertura, revista

Ocupa a primeira tela inteira no desktop. A entrada ganhou a cortina do
vídeo e, no fim, o rótulo de prancha: um ponto na coroa, o fio em cotovelo e
"Esmalte". No desktop a cena e o título seguem o mouse em profundidades
diferentes. "Aberta agora, até as 19h" embaixo do botão, pela mesma conta da
seção 8, que saiu para `src/scripts/expediente.ts`. Linha do tempo completa
no `MOTION.md`, seção 3.

### 4D.3 O menu de dúvidas

`Indice.astro`. Lista as dúvidas de quem visita e leva à seção que responde
cada uma (BRIEF seção 4, e `MOTION.md` seção 12). Abre como uma folha
eucalipto pela esquerda.

### 4D.4 Defeitos encontrados no caminho, medidos

- **Título invisível depois de um salto de âncora, no celular.** O
  observador da revelação via a área recortada pelo `clip-path` — uma linha
  de altura zero que o salto deixava 0,07px acima da tela. Afetava qualquer
  link com `#`, não só o menu. Agora observa o pai do título.
- **Clique numa dúvida não rolava no desktop**: o Lenis ainda estava parado
  quando a rolagem foi pedida.
- **O CTA de dentro do menu levava ao topo da página.** Corrigido.

`npm run motion` cobre os três, e também a entrada da abertura e o menu por
teclado (Esc fecha e devolve o foco).

## Parte 4E — Sessão de 14/10/2026, noite: o dente por dentro e o celular

### 4E.1 Ver por dentro

O palco do 3D cresceu (de um quadro de 420px para a coluna inteira e quase a
altura da janela) e ganhou o corte de prancha: escolher uma parte corta o
dente ao meio e mostra esmalte, dentina e polpa. Detalhes no `MOTION.md`,
seção 4B. A escolha é por uma fileira de botões "Ver por dentro" (os
controles acessíveis), pelos marcadores, pelo título na lista ou tocando no
próprio dente. Os marcadores ganharam o nome escrito ao lado e passam para
a esquerda perto da borda. Sem o 3D, marcadores e botões não aparecem.

### 4E.2 O celular, varrido inteiro

Varredura automática de texto coberto em 390 e 360px, e captura tela a tela.
O que estava errado e foi corrigido:

- **A pilha da esterilização deixava o miolo de uma prancha aparecer por
  cima da seguinte** no fim da sequência: no celular o texto vem antes da
  foto e a altura das pranchas variava, então elas soltavam em momentos
  diferentes. Todas reservam agora 6 linhas de texto (`6lh`) e têm a mesma
  altura. `npm run motion` mede: 0px em 390 e em 360.
- **O rótulo "Esmalte" do hero cobria metade do dente** no celular. Lá ele
  diz só o nome e "Role para ver por dentro".
- **A legenda do 3D ficava por cima das raízes** quando a câmera aproximava.
  Saiu do palco.

O resto do que a varredura apontou é o comportamento esperado: a barra fixa
passando por cima do texto durante a rolagem, as pranchas cobrindo a
anterior, o relógio da consulta grudado sobre as linhas já lidas.

### 4E.3 Medido

Lighthouse mobile 93 · acessibilidade 100 · boas práticas 100 · CFO-196 nas
duas páginas · `npm run motion` e `npm run dente` aprovados.

**Para quem for rodar os testes:** o `dente-check` e as capturas do 3D usam
WebGL por software e pesam no processador. Não rode dois ao mesmo tempo.

## Parte 4F — Sessão de 14/10/2026, fim do dia

- **3D: só o que foi escolhido.** A parte escolhida fica sólida e cortada; o
  resto vira fantasma. Esmalte sozinho é uma casca oca; dentina sozinha
  mostra a polpa vazia. `MOTION.md` 4B.
- **3D mais leve.** Parado, não desenha nada (era 60 quadros por segundo da
  mesma imagem); pixel ratio no máximo 1,5.
- **Fenda do esmalte** trocou `clip-path` por duas tiras que encolhem por
  `transform` — sai da main thread. **Cursor** para de se reposicionar
  quando alcança o ponteiro.
- **Vinheta de entrada**, só no desktop (`MOTION.md` 13): no celular ela
  custava uns 4 pontos de Lighthouse, medido em A/B.
- **Encerramento**: a página sobe e descobre, por baixo, uma faixa verde com
  a marca gigante se montando (`MOTION.md` 14). A primeira versão, que só
  animava a marca ao entrar na tela, passava rápido demais e foi refeita.
- **Barra de rolagem** no idioma da página (`MOTION.md` 15).

**Um defeito invisível encontrado no caminho:** um caractere de controle
(backspace, 0x08) entrou no `marca.ts` por um script de edição meu e quebrou
o build — na tela a linha parecia certa. Varredura feita em `src/`,
`scripts/` e documentos: nenhum outro.

**Sobre medir o Lighthouse nesta máquina:** a nota acompanha o índice de CPU
que ele mesmo mede. Com o computador ocupado (40–55% de CPU, índice
1.200–1.700) o mobile fica entre 86 e 90; com ele livre (índice ~2.000),
93 em três rodadas seguidas. Para uma medida de referência, rode com o
computador sem outros programas pesados, ou use o PageSpeed Insights depois
de publicar.

## Parte 4G — Sessão de 14/10/2026, noite: o reel e dois acertos

Pedido: revisar se a página estava pronta para gravar um vídeo no formato do reel do
Prumo, e gravar e editar. A revisão em 1440 e 390 não achou nada quebrado; dois detalhes
apareceram e foram corrigidos antes de gravar:

- **A emenda das raízes no 3D.** O dente inteiro mostrava a boca das duas raízes saindo do
  colo como um funil, com um aro chapado no meio. Medido no GLB: em y = −0,02 cada raiz
  vai até 0,206 do eixo e o colo só até 0,155. `encaixarRaiz` (em `dente3d.ts`) puxa o
  topo das raízes para dentro do colo. `npm run dente` aprovado.
- **O cursor customizado nascia no canto de cima** e, no primeiro movimento, voava do
  meio da tela até o ponteiro. Agora nasce escondido e aparece em cima do ponteiro.
  Os scripts de captura removiam o ponto da foto; quem abria a página via o ponto.
  `npm run motion` aprovado.

O reel está em `reel/` (fora do git): `colo-reel.mp4`, a capa e as ferramentas para
regravar, com um `LEIA-ME.md`. O gravador controla o relógio da página quadro a quadro e
grava desde o carregamento, com a vinheta. A vitrine é parada, como no reel do Prumo: uma
versão animada (legendas, zoom, entradas) foi feita e o Lucas achou exagerada.

Depois, no mesmo dia, a pedido do Lucas:

- **A marca saiu do rodapé e foi para o fundo do "Manda uma mensagem"**, com o mesmo efeito
  de montar, preso à rolagem da seção, num tom um pouco acima do eucalipto. O encerramento
  (`Fecho.astro`) foi removido. Detalhes e a calibração do tempo no `MOTION.md` §14.
- **Tentado e retirado: rótulos de prancha na abertura.** A abertura ficava parada por uma
  tela de rolagem enquanto Colo e Raiz ganhavam ponto, fio e caixa sobre o vídeo. O Lucas não
  gostou: as caixas repetem a linguagem do dente 3D da seção 3 e gastam o efeito antes da
  hora. Não reintroduzir. A abertura continua achada "sem graça" por ele — fica em aberto.

Medido depois de tudo: `npm run motion`, `dente-check`, acessibilidade e CFO-196 aprovados;
Lighthouse mobile 90 / 100 / 100 / 66 (o 66 é o `noindex` da demo).

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
