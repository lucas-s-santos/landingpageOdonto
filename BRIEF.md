# BRIEF — Landing page para clínica odontológica

**Cliente final:** clínica odontológica de porte pequeno/médio (Brasil, interior de MG)
**Produtora:** CalmDev
**Uso deste arquivo:** leia inteiro antes de escrever qualquer linha de código. As
seções 3 e 7 são restrições legais e não são negociáveis.

---

## 1. Quem visita esta página e o que ela precisa decidir

A visitante típica é uma mulher de 28 a 55 anos, no celular, à noite, que chegou por
uma busca no Google ("dentista em [cidade]", "implante dentário perto de mim") ou por
um link na bio do Instagram da clínica.

Ela não está comparando tecnologia. Ela está com medo, ou com vergonha, ou com dor.
A decisão que ela precisa tomar não é "esta clínica é a melhor?" — é **"eu confio o
suficiente pra deixar meu WhatsApp?"**

Tudo na página serve a essa única decisão. Se um elemento não reduz medo nem aumenta
confiança, ele sai.

## 2. A dor real da clínica (o que estamos resolvendo pra quem paga)

Estes são os problemas que fazem o dono da clínica assinar. A página precisa atacá-los,
não apenas ser bonita.

1. **A agenda tem buracos, mas o consultório não fecha.** Custo fixo roda igual com
   cadeira vazia. A dor é fluxo previsível de primeira consulta, não "presença digital".
2. **O paciente vem na avaliação e some.** Fecha-se uma fração dos orçamentos.
   A página precisa começar a construir confiança *antes* da avaliação, pra ela chegar
   menos cética.
3. **Falta (no-show).** Buraco de agenda em cima da hora. A página não resolve isso
   sozinha, mas o agendamento estruturado dá o dado pra confirmação automática depois
   (upsell natural da CalmDev).
4. **Concorrência de franquia de baixo custo.** Clínica independente não ganha no preço
   — e nem pode anunciar preço (ver seção 3). Ela ganha em quem atende, em como atende,
   e em explicar bem. A página é o único lugar onde isso cabe.
5. **A comunicação toda mora no Instagram e no WhatsApp de alguém.** Se a conta cai, o
   negócio some. A página é o ativo que a clínica é dona.

## 3. RESTRIÇÃO LEGAL — Resolução CFO-196/2019 (vigente)

Publicidade odontológica no Brasil é regulada. Descumprir gera processo ético contra o
dentista, de advertência a suspensão do exercício profissional. Isto muda a estrutura
padrão de landing page.

**PROIBIDO nesta página:**
- Qualquer preço, valor, "a partir de R$", desconto, parcelamento, forma de pagamento,
  promoção, "primeira consulta grátis"
- Depoimentos de pacientes. Nada de carrossel de testimonial, nada de citação de
  paciente, nada de estrela de avaliação replicada dentro do site
- Superlativos e comparação: "a melhor", "líder", "referência", "a mais moderna"
- Garantia ou promessa de resultado
- Imagens de antes e depois publicadas pela clínica (pessoa jurídica). Só o dentista
  autor do procedimento pode, em canal próprio, com TCLE e CRO — não é o caso aqui
- Fotos de procedimento em andamento, passo a passo cirúrgico, equipamento como apelo
  comercial

**OBRIGATÓRIO:**
- Nome do responsável técnico e número de CRO visíveis no rodapé
- Cada dentista citado aparece com nome completo e CRO
- Especialidade só pode ser citada se registrada no CRO

**PERMITIDO (e é daqui que a página tira força):**
- Especialidades, equipe, estrutura física, áreas de atuação
- Conteúdo educativo — explicar procedimento, anatomia, o que esperar
- Fotografia da estrutura e da equipe
- Link externo para o perfil no Google (as avaliações ficam lá, não são republicadas aqui)

**Consequência de design:** a prova social clássica está proibida. A confiança tem que
vir de outro lugar — de **transparência e didática**. Por isso o elemento central da
página é anatômico e explicativo, não depoimento. Isso é uma vantagem: força um site
que ninguém mais na cidade tem.

## 4. Fluxo da página

Cada seção existe pra vencer uma objeção específica. A ordem é a ordem da objeção.

| # | Seção | Objeção que vence | Ação disponível |
|---|-------|-------------------|-----------------|
| 1 | Abertura | "É clínica séria ou é fundo de quintal?" | CTA primário |
| 2 | Como atendemos | "Vão me julgar / vou levar sermão?" | — |
| 3 | Dente interativo | "Não entendo nada, vão me empurrar coisa" | explorar |
| 4 | Tratamentos | "Vocês fazem o que eu preciso?" | expandir item |
| 5 | Quem atende | "Quem vai botar a mão na minha boca?" | — |
| 6 | Estrutura | "É limpo? É seguro?" | — |
| 7 | O que acontece na 1ª consulta | "Vai doer? Quanto tempo? Vão me cobrar?" | — |
| 8 | Agendar | — | CTA primário |
| 9 | Rodapé | localização, CRO, horário | mapa, telefone |

**Regra do CTA:** um único CTA em toda a página — *Agendar avaliação*. Mesmo verbo,
mesma cor, sempre. Sem CTA secundário competindo.

**Menu** (acrescentado em 14/10/2026): lista as dúvidas de quem visita, na voz dela
("Vão me julgar por ter demorado?", "É limpo? É seguro?"), e cada uma leva à seção que
responde. Não lista as seções pelo nome que a clínica dá a elas. Fica de fora "como eu
marco?": a resposta é o CTA, e um segundo caminho com outro verbo é CTA secundário.

**Como o CTA funciona:** o formulário é o atrito. A visitante não preenche formulário,
ela manda mensagem. Então:

- Botão principal abre WhatsApp com mensagem pré-preenchida
- Três campos apenas — nome, o que te trouxe aqui (select), melhor horário pra
  retornar (manhã/tarde/noite) — e o envio monta a mensagem do WhatsApp
- Barra fixa no rodapé no mobile com o mesmo CTA, aparecendo após a seção 3
- A mensagem pré-preenchida traz um marcador de origem, pra clínica saber que veio do
  site (isso vira o relatório que a CalmDev entrega depois)

**Seção 7 é a mais subestimada.** "O que acontece na primeira consulta" — passo a passo
honesto, com duração real de cada etapa. É a seção que mais converte em saúde, e a que
quase nenhuma clínica escreve. Aqui os marcadores numerados são legítimos porque o
conteúdo é de fato uma sequência.

## 5. Direção visual

Isto não é uma sugestão de estilo, é o resultado de uma restrição: a clínica não pode
mostrar resultado, então a página tem que parecer **um instrumento**, não um anúncio.
Precisão de instrumento clínico, não brilho de propaganda.

### Referência de matéria-prima
Anatomia, prancha anatômica ilustrada, translucidez do esmalte, madeira clara de
consultório moderno, tecido cirúrgico. NÃO: pixels azuis, sorriso de banco de imagem,
ícone de dente estilizado.

### Tokens de cor

```
--osso      #EFEDE6   base da página, neutro levemente frio
--eucalipto #33473F   institucional profundo (a parede do vídeo da clínica)
--carvalho  #C6A47E   madeira; usar em superfície e foto, quase nunca em preenchimento
--tinta     #1C211F   texto, quase-preto com viés verde
--linha     #C8CCC4   fio de 1px, exclusivo da prancha anatômica
--ambar     #B8862F   ÚNICO acento. Usado apenas no ponto de hotspot ativo. Em nenhum outro lugar.
```

O âmbar é o luxo da página inteira e aparece em um lugar só. Se ele começar a aparecer
em botão, em borda e em ícone, ele deixou de ser acento.

### Tipografia

- **Display:** Cabinet Grotesk (Fontshare, uso comercial livre)
- **Texto:** Switzer (Fontshare)
- Alternativa só-Google-Fonts: Bricolage Grotesque + Instrument Sans

Escala com contraste real — display grande de verdade (clamp até ~5rem), texto em
1.0625rem com altura de linha 1.6. Corpo de texto abaixo de 70 caracteres por linha.

Sem versalete de rótulo, sem "eyebrow" em caixa alta acima de cada título, sem uma
palavra do título destacada em outra cor. Sentence case em tudo.

### Layout

Assimétrico e variável. A abertura ocupa 60% da largura à esquerda com o vídeo
sangrando pela direita e o título invadindo por cima da borda do vídeo. O espaçamento
vertical **varia** entre seções — a de anatomia respira muito, a de tratamentos é densa.

Radius: 2px em campo de formulário, 0 no resto. Nada de 16px em tudo.
Sombra: nenhuma. Separação por cor de fundo e por espaço, não por sombra.

### Elemento-assinatura

O molar 3D como **prancha anatômica interativa**. Fio de 1px sai de cada parte do dente
até um rótulo posicionado na margem, estilo ilustração de livro de anatomia. Clicar na
parte revela um parágrafo curto e conecta àquele tratamento.

Toda a ousadia da página está aqui. O resto é quieto.

## 6. Sistema de movimento

Uma sequência orquestrada, não efeito espalhado.

**O momento único:** ao chegar na seção do dente, os fios da prancha se desenham
(stroke-dashoffset) e os rótulos aparecem em cascata, uma vez. É o único momento
automático da página.

**Movimento por ação da pessoa — este sim, em todo lugar:**
- Cursor customizado com lerp (~0.12), cresce sobre alvo clicável
- Ímã nos botões: atração de poucos pixels, volta com elastic
- Item de tratamento expande revelando texto e imagem
- Hotspot do dente acende no hover, gira a câmera ao clicar
- Rotação do dente ligada ao scroll, não em loop automático

**Movimento preso à rolagem** (acrescentado em 14/10/2026, ver `PLANO-V2.md`): quando a
posição do scroll *é* a posição da animação — para quando a pessoa para, volta quando
ela volta —, o movimento conta como ação da pessoa, pelo mesmo critério que justifica o
dente girar com o scroll. Duas travas: ele tem que carregar informação da seção (sem o
movimento, a seção perde algo além do enfeite) e é no máximo um por seção. O dente
continua sendo o ponto mais alto da página.

**Proibido:** fade-and-slide-up genérico em cada seção que entra na viewport. Esse é o
tell número um. Se um elemento precisa aparecer, que seja por máscara de linha em
títulos, e só nos títulos de seção. A regra acima não abre exceção a isto: o que anima
sozinho ao entrar na tela, uma vez, continua proibido.

**Obrigatório:** `prefers-reduced-motion` desliga tudo e mostra conteúdo estático.
No mobile, cursor e ímã desligados; mantém expandir/recolher e o dente.

## 7. Assets já prontos

```
/public/model/dente-molar-draco.glb    26 KB, Draco. Altura normalizada = 1.0,
                                       centrado na origem. Precisa do DRACOLoader.
                                       Partes: coroa, colo_cervical,
                                       raiz_distal, raiz_mesial
/public/model/dente-molar.glb          1.1 MB, sem Draco (fallback/debug)

/public/video/hero-molar-loop.{webm,mp4}      abertura
/public/video/hero-molar-poster.jpg
/public/video/texture-enamel-loop.{webm,mp4}  fundo de transição
/public/video/texture-enamel-poster.jpg
/public/video/clinic-room.{webm,mp4}          seção estrutura
/public/video/clinic-room-poster.jpg
```

Todos os vídeos: 1280×720, 8s, sem áudio.
**Nunca em fundo full-bleed de tela cheia** — 720p não aguenta. Use em bloco contido.
Sempre `autoplay muted loop playsinline` + poster + fallback pra imagem sob
`prefers-reduced-motion`.

O GLB carrega com `import()` dinâmico, só quando a seção do dente entra em viewport.
Three.js não pode estar no bundle inicial.

## 8. Stack e qualidade

- Astro + Tailwind. Sem Next — não há necessidade de servidor
- GSAP + ScrollTrigger; Lenis pro smooth scroll
- Three.js + GLTFLoader + DRACOLoader, carregados sob demanda
- Formulário sem backend: monta link de WhatsApp

Piso de qualidade, sem anunciar:
- Lighthouse ≥ 90 em performance no mobile
- HTML semântico, foco de teclado visível, contraste AA
- Imagens WebP, lazy loading
- `<title>`, meta description e JSON-LD `Dentist` preenchidos
- Testado em 360px de largura

## 9. Anti-clichê — o que não fazer

Estes são os padrões que denunciam página gerada por IA. Se uma decisão sua bater com
esta lista, escolha outra coisa.

- Fundo creme (~#F4F1EA) com serifada de alto contraste e acento terracota (~#D97757)
- Fundo quase-preto com um acento verde-limão ou vermelhão
- Gradiente roxo/violeta, ou gradiente como decoração
- Conteúdo picado em cards idênticos, mesmo radius em tudo, mesma sombra cinza suave
- Rótulo em CAIXA ALTA espaçada acima de cada título
- Meta em sequência com ponto do meio: "A · B · C"
- "PALAVRA — fragmento" com travessão espaçado
- Seta "→" grudada no fim de link e botão
- Monoespaçada em rótulo pequeno de dado
- Quase-preto tingido (#0B0B0B, #111) no lugar de preto
- Fonte Inter, Poppins, Montserrat
- Abertura centralizada: título gigante + subtítulo + dois botões lado a lado
- Marcadores 01 / 02 / 03 em conteúdo que não é sequência
- Ícone genérico de biblioteca dentro de círculo colorido
- Emoji como ícone de seção

## 10. Copy

Escreva em pt-BR, sentence case, voz ativa, frases curtas. Sem "Transforme seu sorriso",
sem "Excelência em odontologia", sem "Cuidamos de você como você merece".

O tom é de alguém explicando com calma, não vendendo. Fale do que a pessoa vai sentir e
do que vai acontecer, em ordem cronológica, com números honestos de duração.

Marque com `[PREENCHER]` tudo que depende de dado real do cliente: nome da clínica,
nomes dos dentistas, CRO, endereço, telefone, horário, especialidades registradas.
Não invente CRO, endereço nem nome de profissional em nenhuma hipótese.

## 11. Entrega

1. Antes de codar: escreva um plano curto de design — paleta, tipografia, conceito de
   layout com wireframe em ASCII. Revise contra a seção 9. Diga o que mudou e por quê.
2. Só então construa.
3. Ao terminar, tire screenshot em 1440px e em 390px e critique o próprio resultado
   contra a seção 9 antes de dizer que acabou.
