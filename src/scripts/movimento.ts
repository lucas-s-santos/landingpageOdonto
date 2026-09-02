/**
 * PASSO 4 — camada de movimento. Especificação em MOTION.md.
 *
 * Duas famílias, com regras opostas:
 *
 *   Movimento por ação da pessoa (mouse, clique, arraste) — pode estar em
 *   todo lugar. É resposta.
 *
 *   Movimento automático (acontece sozinho ao rolar) — quase proibido. Dois
 *   momentos na página inteira: a abertura, e a máscara dos títulos de seção.
 *   Fade-and-slide-up genérico em seção que entra na viewport é o tell número
 *   um de página gerada. Não existe aqui.
 *
 * O que roda em CSS e não está neste arquivo: hover, press e a troca de
 * estado dos botões e das linhas de tratamento. Regra da skill `animate` —
 * a ferramenta mais barata que resolve. GSAP para hover é desperdício, e CSS
 * roda fora da main thread.
 *
 * O que ainda NÃO está aqui: a rotação do dente presa ao scroll (MOTION §4) e
 * a cascata dos fios da prancha (MOTION §5). As duas dependem do Three.js e
 * das coordenadas projetadas, que são o passo 5.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const mm = gsap.matchMedia();

mm.add(
  {
    desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
    calmo: '(prefers-reduced-motion: reduce)',
  },
  (ctx) => {
    const { desktop, calmo } = ctx.conditions as {
      desktop: boolean;
      mobile: boolean;
      calmo: boolean;
    };

    // ------------------------------------------------------------------
    // calmo: nenhum movimento. Não é degradação — é uma versão completa e
    // estática. O HTML já nasce visível, então não há nada a desfazer.
    // ------------------------------------------------------------------
    if (calmo) return;

    /**
     * Funções de desmontagem.
     *
     * NÃO usar `ctx.add(fn)` para isto: no gsap.context o `add` EXECUTA a
     * função na hora, não registra limpeza. Usá-lo aqui destruía o cursor,
     * o Lenis e os ímãs no mesmo instante em que eram criados.
     * A limpeza é o que este callback RETORNA — o GSAP a chama quando a
     * media query deixa de casar.
     */
    const limpezas: (() => void)[] = [];

    // ------------------------------------------------------------------
    // 0. Lenis — scroll suave, só no desktop.
    //    No celular ele atrapalha: briga com o scroll nativo e com o
    //    endereço da barra que recolhe.
    // ------------------------------------------------------------------
    let lenis: Lenis | undefined;
    if (desktop) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, syncTouch: false });
      const raf = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis.on('scroll', ScrollTrigger.update);
      limpezas.push(() => {
        gsap.ticker.remove(raf);
        lenis!.destroy();
      });
    }

    // ------------------------------------------------------------------
    // 1. Cursor — um ponto de 10px que segue o mouse com atraso.
    //    O atraso é o efeito inteiro: instantâneo não se sente.
    //    Desktop apenas, e nunca sob ponteiro grosso.
    // ------------------------------------------------------------------
    if (desktop && matchMedia('(pointer: fine)').matches) {
      const cursor = document.createElement('div');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cursor);
      document.documentElement.classList.add('tem-cursor');

      let mx = innerWidth / 2;
      let my = innerHeight / 2;
      let cx = mx;
      let cy = my;

      const mover = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
      };
      addEventListener('mousemove', mover, { passive: true });

      const seguir = () => {
        // 0.12 é o valor. 0.3 fica nervoso, 0.05 fica lento.
        cx += (mx - cx) * 0.12;
        cy += (my - cy) * 0.12;
        gsap.set(cursor, { x: cx, y: cy });
      };
      gsap.ticker.add(seguir);

      const escalar = (escala: number, vazado: boolean) =>
        gsap.to(cursor, {
          scale: escala,
          duration: 0.3,
          ease: 'power2.out',
          borderWidth: vazado ? 1 : 0,
          backgroundColor: vazado ? 'transparent' : 'currentColor',
        });

      const alvos: [string, number, boolean][] = [
        ['a, button, summary, [data-ima]', 3.2, false],
        ['video, img', 5, true],
      ];
      const limpar: (() => void)[] = [];
      for (const [seletor, escala, vazado] of alvos) {
        document.querySelectorAll<HTMLElement>(seletor).forEach((el) => {
          const entrar = () => escalar(escala, vazado);
          const sair = () => escalar(1, false);
          el.addEventListener('mouseenter', entrar);
          el.addEventListener('mouseleave', sair);
          limpar.push(() => {
            el.removeEventListener('mouseenter', entrar);
            el.removeEventListener('mouseleave', sair);
          });
        });
      }

      limpezas.push(() => {
        removeEventListener('mousemove', mover);
        gsap.ticker.remove(seguir);
        limpar.forEach((f) => f());
        cursor.remove();
        document.documentElement.classList.remove('tem-cursor');
      });
    }

    // ------------------------------------------------------------------
    // 2. Ímã — atração de poucos pixels. Sutil: se dá para perceber
    //    claramente, está forte demais.
    //    SÓ no CTA e nos hotspots. Em link de menu e ícone de rodapé
    //    vira ruído.
    // ------------------------------------------------------------------
    if (desktop) {
      const RAIO = 90;
      const FORCA = 0.32;
      document.querySelectorAll<HTMLElement>('[data-ima]').forEach((el) => {
        const mover = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          if (Math.hypot(dx, dy) < RAIO) {
            gsap.to(el, { x: dx * FORCA, y: dy * FORCA, duration: 0.4, ease: 'power3.out' });
          }
        };
        const soltar = () =>
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });

        el.addEventListener('mousemove', mover);
        el.addEventListener('mouseleave', soltar);
        limpezas.push(() => {
          el.removeEventListener('mousemove', mover);
          el.removeEventListener('mouseleave', soltar);
          gsap.set(el, { x: 0, y: 0 });
        });
      });
    }

    // ------------------------------------------------------------------
    // 3. Abertura — o único momento automático que roda no load.
    //    Uma vez, e nunca mais.
    //
    //    Máscara de linha, não `opacity 0→1` com `translateY(30px)`.
    //    A diferença entre parecer caro e parecer template mora aí.
    //    As linhas já são elementos próprios no HTML (`.linha`), então
    //    aqui é só embrulhar cada uma em overflow hidden.
    // ------------------------------------------------------------------
    const linhasTitulo = gsap.utils.toArray<HTMLElement>('.abertura__texto h1 .linha');
    if (linhasTitulo.length) {
      linhasTitulo.forEach((l) => l.classList.add('mascara'));

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from('.abertura__video video', { scale: 1.06, duration: 1.6, ease: 'power2.out' }, 0)
        .from(linhasTitulo, { yPercent: 100, duration: 0.9, stagger: 0.09 }, 0.2)
        .from('.abertura__apoio', { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.7)
        .from('.abertura .cta', { scale: 0.96, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.9);
    }

    // ------------------------------------------------------------------
    //    No scroll da abertura: vídeo e título sobem em velocidades
    //    diferentes. Velocidades diferentes = profundidade.
    // ------------------------------------------------------------------
    if (desktop) {
      const abertura = document.querySelector('.abertura');
      if (abertura) {
        gsap
          .timeline({ scrollTrigger: { trigger: abertura, start: 'top top', end: 'bottom top', scrub: true } })
          .to('.abertura__video video', { yPercent: 12, ease: 'none' }, 0)
          .to('.abertura__texto', { yPercent: 40, ease: 'none' }, 0);
      }
    }

    // ------------------------------------------------------------------
    // 8. Títulos de seção — máscara de linha, e SÓ nos títulos.
    //    Nada mais no corpo da página aparece por scroll: parágrafo,
    //    imagem e lista já nascem visíveis.
    //
    //    SplitText por linha (grátis no GSAP 3.13+). Se ela falhar por
    //    algum motivo, o título continua visível — nada aqui esconde
    //    conteúdo antes de saber que consegue revelá-lo.
    // ------------------------------------------------------------------
    const titulos = gsap.utils.toArray<HTMLElement>('h2');
    titulos.forEach((titulo) => {
      let split: SplitText | undefined;
      try {
        split = new SplitText(titulo, { type: 'lines', linesClass: 'linha-split' });
      } catch {
        return;
      }
      if (!split.lines.length) return;

      split.lines.forEach((l) => (l as HTMLElement).classList.add('mascara'));

      gsap.from(split.lines, {
        yPercent: 100,
        duration: 0.9,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: titulo, start: 'top 82%', once: true },
      });

      limpezas.push(() => split?.revert());
    });

    // ------------------------------------------------------------------
    // 6. Tratamentos — a expansão.
    //    A marcação é <details>/<summary>, que já abre e fecha sozinha e
    //    já funciona por teclado. Aqui a gente só intercepta para animar
    //    a altura, e devolve o controle ao navegador no fim.
    //
    //    `height` é a exceção sancionada: não existe equivalente em
    //    transform para um acordeão. Todo o resto da página anima só
    //    transform e opacity.
    // ------------------------------------------------------------------
    document.querySelectorAll<HTMLDetailsElement>('details.item').forEach((item) => {
      const cabeca = item.querySelector<HTMLElement>('summary');
      const corpo = item.querySelector<HTMLElement>('.item__corpo');
      if (!cabeca || !corpo) return;

      let animando = false;

      const abrir = () => {
        item.open = true;
        gsap.fromTo(
          corpo,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.55,
            ease: 'power3.inOut',
            onStart: () => (animando = true),
            onComplete: () => {
              animando = false;
              gsap.set(corpo, { clearProps: 'height' });
              ScrollTrigger.refresh();
            },
          }
        );
      };

      const fechar = (depois?: () => void) => {
        gsap.to(corpo, {
          height: 0,
          opacity: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          onStart: () => (animando = true),
          onComplete: () => {
            animando = false;
            item.open = false;
            gsap.set(corpo, { clearProps: 'height,opacity' });
            ScrollTrigger.refresh();
            depois?.();
          },
        });
      };

      const aoClicar = (e: Event) => {
        e.preventDefault();
        if (animando) return;

        if (item.open) {
          fechar();
          return;
        }

        // Abrir um fecha o outro.
        const aberto = document.querySelector<HTMLDetailsElement>('details.item[open]');
        if (aberto && aberto !== item) {
          const outroCorpo = aberto.querySelector<HTMLElement>('.item__corpo');
          if (outroCorpo) {
            gsap.to(outroCorpo, {
              height: 0,
              opacity: 0,
              duration: 0.45,
              ease: 'power3.inOut',
              onComplete: () => {
                aberto.open = false;
                gsap.set(outroCorpo, { clearProps: 'height,opacity' });
              },
            });
          } else {
            aberto.open = false;
          }
        }
        abrir();
      };

      cabeca.addEventListener('click', aoClicar);
      limpezas.push(() => {
        cabeca.removeEventListener('click', aoClicar);
        gsap.set(corpo, { clearProps: 'height,opacity' });
      });
    });

    // ------------------------------------------------------------------
    // 7. Parallax — só em dois lugares. Em mais que isso a página começa
    //    a flutuar e a leitura sofre.
    //    O vídeo da abertura já está acima; aqui fica a textura de esmalte.
    // ------------------------------------------------------------------
    if (desktop) {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const video = el.querySelector('video') ?? el;
        gsap.to(video, {
          yPercent: -parseFloat(el.dataset.parallax ?? '0') * 100,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }

    return () => limpezas.forEach((f) => f());
  }
);

/**
 * As fontes carregam com `font-display: swap`. Quando a Cabinet Grotesk
 * entra, a altura dos títulos muda e todo cálculo de posição do
 * ScrollTrigger feito antes disso fica errado.
 */
document.fonts?.ready.then(() => ScrollTrigger.refresh());
