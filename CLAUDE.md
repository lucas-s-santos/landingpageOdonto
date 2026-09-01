# Projeto: landing page para clínica odontológica

Produzido pela CalmDev. Trabalho comercial real, vai ser vendido a um cliente.

## Leia antes de qualquer coisa

- `HANDOFF.md` — **comece por aqui.** Em que passo o projeto parou, o que decidir antes
  de codar, pendências técnicas já apuradas (fontes, vídeos, arrumação de arquivos).
- `BRIEF.md` — público, dor do cliente, restrição legal, fluxo da página, direção
  visual, copy. É a fonte da verdade.
- `MOTION.md` — especificação de movimento com valores concretos.
- `PLANO-DESIGN.md` — saída do passo 1: paleta com contrastes medidos, escala
  tipográfica, grade, ritmo vertical, wireframes e revisão anti-clichê.

Se algo neste arquivo conflitar com `BRIEF.md`, o `BRIEF.md` vence.

## Três regras que não se negociam

1. **Não pode parecer feita por IA.** A seção 9 do BRIEF lista os padrões proibidos.
   Antes de escrever CSS, leia essa lista. Se uma decisão sua bater com ela, escolha
   outra coisa.

2. **Resolução CFO-196/2019.** Publicidade odontológica é regulada no Brasil. Nada de
   preço, desconto, depoimento de paciente, antes/depois, superlativo ou promessa de
   resultado. Seção 3 do BRIEF. Descumprir dá processo ético contra o dentista.

3. **Nunca invente dado do cliente.** Nome da clínica, dentista, número de CRO,
   endereço, telefone e horário vão como `[PREENCHER]`. CRO inventado é falsificação.

## Ordem de trabalho

1. Escreva um plano de design: paleta, tipografia, conceito de layout com wireframe em
   ASCII. Revise contra a seção 9 do BRIEF, diga o que mudou e por quê. **Pare aqui e
   espere aprovação.**
2. Scaffold Astro + Tailwind, tokens de cor e tipografia, fontes locais.
3. Estrutura semântica de todas as seções com copy real, ainda sem movimento.
4. Camada de movimento conforme `MOTION.md`.
5. Cena 3D do dente, carregada sob demanda.
6. Screenshot em 1440px e 390px com Playwright, autocrítica contra a seção 9, correções.

Não pule o passo 3. Página que nasce animada nasce quebrada no leitor de tela.

## Stack

Astro + Tailwind · GSAP + ScrollTrigger · Lenis · Three.js (GLTFLoader + DRACOLoader)
Sem backend. O formulário monta link de WhatsApp.

## Assets prontos em /public

`model/dente-molar-draco.glb` — 26 KB, Draco. Altura normalizada = 1.0, centrado na
origem. Partes nomeadas: `coroa`, `colo_cervical`, `raiz_distal`, `raiz_mesial`.
Precisa de DRACOLoader com decoder path apontado.

`video/hero-molar-loop` · `video/texture-enamel-loop` · `video/clinic-room`
Cada um em `.webm` + `.mp4` + `-poster.jpg`. Todos 1280×720, 8s, sem áudio.
Os `-loop` já têm dissolve costurado no fim, repetem sem corte.

**Nenhum vídeo em fundo full-bleed de tela cheia.** 720p não aguenta monitor grande.
Sempre em bloco contido, sempre `autoplay muted loop playsinline` + poster.

## Piso de qualidade

Lighthouse ≥ 90 mobile · foco de teclado visível · contraste AA · funciona em 360px ·
`prefers-reduced-motion` respeitado · Three.js fora do bundle inicial ·
JSON-LD `Dentist` preenchido.

## Como me responder

Português. Direto. Se discordar de algo do BRIEF, fale antes de codar, não depois.
