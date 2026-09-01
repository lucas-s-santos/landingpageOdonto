# HANDOFF — retomando o projeto em outra máquina

Escrito em 01/09/2026, no fim da sessão do passo 1.
Leia este arquivo primeiro. Ele diz onde o projeto parou e o que fazer em seguida.

---

## Onde o projeto está

| Passo (ordem de trabalho do `CLAUDE.md`) | Estado |
|---|---|
| 1. Plano de design | **Escrito. Aguardando aprovação.** Está em `PLANO-DESIGN.md` |
| 2. Scaffold Astro + Tailwind + tokens + fontes | não começou |
| 3. Estrutura semântica com copy real, sem movimento | não começou |
| 4. Camada de movimento (`MOTION.md`) | não começou |
| 5. Cena 3D do dente sob demanda | não começou |
| 6. Screenshot 1440/390 + autocrítica contra a seção 9 | não começou |

**Não existe código de aplicação ainda.** Não há `package.json`, não há `src/`. O que
está no repositório é briefing, assets e o plano.

---

## Parte 1 — Preparar a máquina nova

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
node -v      # precisa ser 18.20+ ou 20.3+ ou 22+ (exigência do Astro 5)
npm -v
git --version
```

Na máquina antiga havia Node 20 e Git 2.54. Se o Node novo for mais velho que 18.20,
instale antes de qualquer coisa.

### 1.3 Identidade do git

```bash
git config user.name  "lucas-s-santos"
git config user.email "lucassilvadossantos2005@gmail.com"
```

O push é por HTTPS. Na máquina anterior o Git Credential Manager já estava autenticado;
na nova ele vai abrir o login do GitHub no primeiro `git push`.

### 1.4 ffmpeg — instale, vai precisar

A máquina anterior **não tinha ffmpeg**, e isso bloqueou três tarefas de vídeo que estão
pendentes (ver Parte 4).

```bash
winget install Gyan.FFmpeg          # Windows
# ou: brew install ffmpeg           # macOS
```

Feche e reabra o terminal depois, para o PATH atualizar. Confira com `ffmpeg -version`.

---

## Parte 2 — Quatro decisões que travam o passo 2

O plano está pronto mas não foi aprovado. Antes de codar, decida:

### 2.1 Aprovar ou ajustar o `PLANO-DESIGN.md`
Leia o arquivo inteiro. É a saída do passo 1.

### 2.2 Fontes — **tem um problema de licença aqui, leia**

O `public/fonts/` tem dois zips. Um serve, o outro não:

| Arquivo | Origem | Licença | Tem `.woff2`? | Serve? |
|---|---|---|---|---|
| `Switzer_Complete.zip` | Fontshare | ITF Free Font License | sim, 20 arquivos | **sim** |
| `cabinet-grotesk-font-family.zip` | **Befonts** | **"Personal Use Only"** | **não, só `.otf`** | **NÃO** |

O zip do Cabinet Grotesk veio do Befonts e o arquivo de licença dentro dele diz
literalmente `License: Personal Use Only`. Este é trabalho comercial que vai ser vendido
a um cliente — **não dá para usar esse arquivo**. Também não tem `.woff2`, só `.otf`,
que é formato de desktop e não de web.

**A correção é simples e não muda nada do plano:** o Cabinet Grotesk legítimo está no
Fontshare, sob a mesma licença livre do Switzer, e lá o pacote vem com `.woff2`.

Baixe de https://www.fontshare.com/fonts/cabinet-grotesk (botão "Download Family"),
e apague o zip do Befonts do repositório.

**Arquivos que o passo 2 precisa, e só eles:**

```
public/fonts/CabinetGrotesk-Regular.woff2     (do pacote WEB do Fontshare)
public/fonts/CabinetGrotesk-Medium.woff2      (do pacote WEB do Fontshare)
public/fonts/Switzer-Regular.woff2            já temos, dentro do zip em:
                                              Switzer_Complete/Fonts/WEB/fonts/
public/fonts/Switzer-Medium.woff2             mesma pasta, 20 KB
```

Os dois `.woff2` do Switzer somam 37 KB. Depois de extrair os quatro arquivos,
**apague os zips** — o `Switzer_Complete.zip` sozinho tem 2,35 MB e nada disso pode ir
para o deploy.

Se por algum motivo o Fontshare estiver fora do ar, a alternativa aprovada pelo
`SETUP.md` é Bricolage Grotesque + Instrument Sans, também servidas localmente. Nesse
caso a escala tipográfica do plano continua valendo, só troca a família.

### 2.3 Header: com ou sem CTA?

O plano coloca "Agendar avaliação" no header desde o topo, no desktop. É o mesmo verbo,
mesma cor e mesmo destino do CTA principal — então não é CTA secundário. Mas o BRIEF é
enfático sobre CTA único, então a decisão é sua. Alternativa: header só com o nome da
clínica.

### 2.4 Abertura: copy A ou B?

Estão as duas na seção 8 do `PLANO-DESIGN.md`. Recomendação: A.

### 2.5 (opcional, mas move mais que qualquer outra coisa) Referências em `refs/`

A pasta está vazia. O `SETUP.md` chama isso de "o passo que mais importa": 5 a 8
screenshots de sites com o acabamento que você quer — arquitetura, skincare, clínica de
estética de alto padrão, museu. **Não site de dentista.** Sem isso, o acabamento é
decidido só por descrição escrita, que é o canal mais fraco.

---

## Parte 3 — Passo 2: scaffold

Só depois das decisões acima.

```bash
npm create astro@latest . -- --template minimal --typescript relaxed --no-git
npx astro add tailwind
npm i gsap lenis three
npm i -D @playwright/test
npx playwright install chromium
```

O `create astro` vai reclamar que a pasta não está vazia (por causa de `public/`,
dos `.md` e do `.git/`). **Escolha continuar** — ele não apaga o que já existe.

Depois do scaffold, o passo 2 entrega:

- [ ] `src/styles/tokens.css` com os seis tokens do `PLANO-DESIGN.md` seção 2
- [ ] `@font-face` dos quatro `.woff2`, `font-display: swap`, `preload` só no display
- [ ] escala tipográfica da seção 3 do plano, em `theme.extend` do Tailwind
- [ ] `box-shadow: none` global e `border-radius: 0` global, com 2px só em `input`/`select`
- [ ] estilo de foco visível: 2px `--tinta` sobre osso, 2px `--osso` sobre eucalipto
- [ ] reorganizar os arquivos de origem (ver Parte 4.1)

**Não pule para o passo 3 sem isso.** E não comece movimento antes do passo 3 estar
pronto — o `CLAUDE.md` é explícito: página que nasce animada nasce quebrada no leitor
de tela.

---

## Parte 4 — Pendências técnicas apuradas nesta sessão

Coisas que já foram medidas e não precisam ser redescobertas.

### 4.1 Arrumação de arquivos (fazer no começo do passo 2)

Estão na raiz do repositório, e são material de produção, não de build:

```
dente-molar.obj      7,4 MB   fonte do modelo
dente-molar.mtl               material do OBJ
dente-molar.glb      1,25 MB  export sem Draco
dente-3d.html                 teste solto de visualização
Water_droplet_on_molar_202608312354.mp4              1,81 MB
Water_droplet_sliding_on_molar_202609010008.mp4      1,07 MB
Arranging_dental_instruments_on_…_202608312356.mp4   1,58 MB
```

Mover para `_origem/` (fora de `public/`, para não ir ao deploy). **Não apagar** — é o
material bruto dos renders.

Nota: o nome `Arranging_dental_instruments_on_…_202608312356.mp4` tem reticências
Unicode (`…`). Funciona, mas dá dor de cabeça em CI Linux. Vale renomear na mudança.

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

## Parte 6 — Como retomar a conversa amanhã

Na máquina nova, dentro da pasta do projeto:

```
Leia CLAUDE.md, BRIEF.md, MOTION.md, PLANO-DESIGN.md e HANDOFF.md.
O passo 1 já está feito. [aprovo o plano / quero mudar X].
Decisões: fontes = [...], header = [com/sem CTA], abertura = [A/B].
Pode começar o passo 2.
```

Se quiser mudar algo do plano antes, diga o que muda — o `PLANO-DESIGN.md` é editável,
não é contrato.
