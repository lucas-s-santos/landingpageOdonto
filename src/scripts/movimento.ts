/**
 * PASSO 4 — camada de movimento. Especificação em MOTION.md.
 *
 * Duas famílias, com regras opostas:
 *
 *   Movimento por ação da pessoa (mouse, clique, arraste): pode estar em
 *   todo lugar. É resposta.
 *
 *   Movimento automático (acontece sozinho ao rolar): quase proibido. Dois
 *   momentos na página inteira — a abertura, que é CSS puro e vive em
 *   `Abertura.astro`, e a cascata dos fios da prancha. Fade-and-slide-up
 *   genérico em cada seção que entra na viewport é o tell número um de
 *   página gerada, e não existe aqui.
 *
 * ARQUITETURA, e o porquê dela:
 *
 *   BASE (este arquivo, sem biblioteca) — revelação dos títulos de seção,
 *   o accordion e o disparo da cena 3D. Roda em qualquer largura, com CSS,
 *   IntersectionObserver e WAAPI.
 *
 *   DESKTOP (import dinâmico) — GSAP, ScrollTrigger e Lenis, que só existem
 *   para cursor, ímã, parallax, scroll suave e o pin da seção do dente.
 *   Nada disso roda no celular.
 *
 * A separação não é estética. Com GSAP no caminho do celular, o perfil
 * mobile do Lighthouse dava performance 63–71, com 1,7 a 2,8 s de Total
 * Blocking Time, e 72 dos 140 KB do bundle nunca eram usados naquele
 * contexto. A regra da skill `animate` é a ferramenta mais barata que
 * resolve — no celular, a mais barata é não ter biblioteca nenhuma.
 */

const REDUZIDO = matchMedia('(prefers-reduced-motion: reduce)');
const DESKTOP = matchMedia('(min-width: 900px)');

/* ==========================================================================
   BASE — sem biblioteca
   ========================================================================== */

/**
 * Títulos de seção: máscara de revelação, e SÓ nos títulos.
 *
 * Nada mais no corpo da página aparece por scroll — parágrafo, imagem e
 * lista já nascem visíveis no HTML.
 *
 * A animação está no CSS; aqui só se decide quando. `clip-path` é a quarta
 * propriedade sancionada ao lado de transform e opacity: não dispara layout
 * nem paint. Com ela a máscara dispensa um wrapper por linha, e some a
 * dependência da SplitText junto com o GSAP.
 */
function revelarTitulos() {
  // Os títulos de dentro do menu de dúvidas ficam de fora: o <dialog> abre
  // com a sua própria entrada, e um título preso no estado de "antes" ali
  // dentro seria um menu sem cabeçalho.
  const titulos = [...document.querySelectorAll<HTMLElement>('h2')].filter(
    (t) => !t.closest('dialog')
  );
  if (!titulos.length) return;

  /*
    O observador olha o PAI do título, não o título.

    `.revela` corta o título por inteiro com `clip-path`, e o Chrome calcula
    a interseção sobre a área já recortada — uma linha de altura zero. Num
    salto de âncora (um link do menu, um #endereco colado no WhatsApp) que
    deixa essa linha um fio acima do topo da tela, ela nunca é vista
    entrando, e o título fica invisível para sempre. Medido no celular:
    topo do título em −0,07px, `isIntersecting` falso, nenhuma revelação.
    O pai não é recortado, e o título é a primeira coisa dentro dele.
  */
  const titulosPorAlvo = new Map<Element, HTMLElement>();

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        titulosPorAlvo.get(e.target)?.classList.add('revelado');
        observador.unobserve(e.target);
      }
    },
    // folga embaixo: o título revela um pouco antes de chegar ao meio da tela
    { rootMargin: '0px 0px -18% 0px' }
  );

  for (const t of titulos) {
    t.classList.add('revela');
    const alvo = t.parentElement ?? t;
    titulosPorAlvo.set(alvo, t);
    observador.observe(alvo);
  }
}

/**
 * Tratamentos: a expansão.
 *
 * A marcação é `<details>/<summary>`, que já abre, fecha e funciona por
 * teclado sozinha. Aqui só se intercepta para animar a altura, e o controle
 * volta ao navegador no fim.
 *
 * `height` é a exceção tolerada — não existe equivalente em transform para
 * um accordion. WAAPI em vez de biblioteca: dá controle programático com
 * desempenho de CSS e custa zero KB.
 */
function prepararAccordion() {
  const CURVA = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const ABRIR = 550;
  const FECHAR = 450;

  const animar = (el: HTMLElement, de: string, para: string, ms: number) =>
    el.animate(
      [
        { height: de, opacity: de === '0px' ? 0 : 1 },
        { height: para, opacity: para === '0px' ? 0 : 1 },
      ],
      { duration: ms, easing: CURVA }
    );

  const fechar = (alvo: HTMLDetailsElement, corpo: HTMLElement) => {
    const a = animar(corpo, `${corpo.offsetHeight}px`, '0px', FECHAR);
    a.onfinish = () => {
      alvo.open = false;
    };
    return a;
  };

  for (const item of document.querySelectorAll<HTMLDetailsElement>('details.item')) {
    const cabeca = item.querySelector<HTMLElement>('summary');
    const corpo = item.querySelector<HTMLElement>('.item__corpo');
    if (!cabeca || !corpo) continue;

    let animando: Animation | null = null;

    cabeca.addEventListener('click', (e) => {
      e.preventDefault();
      if (animando?.playState === 'running') return;

      if (item.open) {
        animando = fechar(item, corpo);
        return;
      }

      // Abrir um fecha o outro.
      const aberto = document.querySelector<HTMLDetailsElement>('details.item[open]');
      if (aberto && aberto !== item) {
        const outro = aberto.querySelector<HTMLElement>('.item__corpo');
        if (outro) fechar(aberto, outro);
        else aberto.open = false;
      }

      item.open = true;
      animando = animar(corpo, '0px', `${corpo.offsetHeight}px`, ABRIR);
    });
  }
}

/**
 * Vídeo toca só quando está na tela.
 *
 * Os três tinham `autoplay`, então decodificavam ao mesmo tempo desde o
 * primeiro instante — inclusive os dois que ficam milhares de pixels abaixo
 * da dobra. Decodificar vídeo que ninguém está vendo gasta CPU, bateria e
 * dados de graça.
 *
 * Tirar o `autoplay` também acertou uma regra do BRIEF que estava sendo
 * descumprida sem que eu tivesse notado: este módulo não roda sob
 * `prefers-reduced-motion`, então agora os vídeos ficam parados no poster,
 * como a seção 7 do BRIEF manda.
 *
 * NOTA sobre uma conclusão que eu tirei e depois derrubei: cheguei a medir
 * o vídeo da abertura custando 28 pontos de Lighthouse no celular e cheguei
 * a desligá-lo lá. Estava errado — a flag `--use-angle=swiftshader`, que eu
 * tinha copiado do teste de WebGL para o script de performance, força
 * rasterização por software e encarece toda composição. Sem ela, a página
 * com vídeo tocando no celular dá 97. O vídeo fica.
 */
function prepararVideos() {

  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-video]')];
  if (!videos.length) return;

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          // O HTML marca `preload="none"` nos três: assim o celular não baixa
          // nem decodifica o primeiro frame de um vídeo que nunca vai tocar.
          // Quem vai tocar liga o preload aqui, um instante antes.
          if (v.preload !== 'auto') v.preload = 'auto';
          // `play()` rejeita se o navegador bloquear; o poster fica e nada quebra.
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    },
    { rootMargin: '100px' }
  );

  for (const v of videos) observador.observe(v);
}

/**
 * A cena 3D do dente.
 *
 * Carregada sob demanda quando `#anatomia` chega a 400px da viewport. Antes
 * disso a página não baixa um byte de Three.js. A margem existe para o
 * modelo estar pronto quando a seção aparece: carregar no instante exato em
 * que ela entra na tela mostraria a troca.
 */
function prepararDente() {
  const anatomia = document.querySelector('#anatomia');
  if (!anatomia) return;

  let pedido = false;
  const observador = new IntersectionObserver(
    async ([entrada]) => {
      if (!entrada.isIntersecting || pedido) return;
      pedido = true;
      observador.disconnect();
      try {
        const { montarDente } = await import('./dente3d');
        await montarDente({ desktop: DESKTOP.matches });
      } catch (erro) {
        // A prancha estática continua no lugar. Nada quebra.
        console.warn('cena 3D não carregou:', erro);
      }
    },
    { rootMargin: '400px' }
  );
  observador.observe(anatomia);
}

/* ==========================================================================
   DESKTOP — cursor, ímã, parallax, scroll suave
   ========================================================================== */

async function movimentoDesktop() {
  const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('lenis'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  // --- Lenis ---------------------------------------------------------
  // No celular ele atrapalha: briga com o scroll nativo e com a barra de
  // endereço que recolhe. Por isso vive só aqui.
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, syncTouch: false });
  gsap.ticker.add((t: number) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
  // O menu de dúvidas (Indice.astro) rola até a seção por aqui quando o
  // Lenis existe. Rolagem nativa disputaria com ele o mesmo scroll.
  window.__lenis = lenis;

  // --- a cena da abertura segue o mouse -------------------------------
  // Movimento por ação da pessoa (MOTION.md §1-2). A cena vai na direção
  // oposta ao cursor e o título um pouco a favor: dois planos andando
  // diferente é o que dá profundidade. A cena é 16px maior que a moldura
  // de cada lado, então os 14px de curso não abrem fresta na borda.
  const topo = document.querySelector<HTMLElement>('.abertura');
  const cena = document.querySelector<HTMLElement>('.abertura__cena');
  const titulo = document.querySelector<HTMLElement>('.abertura__texto');
  if (topo && cena && titulo && matchMedia('(pointer: fine)').matches) {
    const opcoes = { duration: 1.1, ease: 'power3.out' };
    const cenaX = gsap.quickTo(cena, 'x', opcoes);
    const cenaY = gsap.quickTo(cena, 'y', opcoes);
    const tituloX = gsap.quickTo(titulo, 'x', opcoes);

    topo.addEventListener('mousemove', (e) => {
      const r = topo.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      cenaX(-nx * 28);
      cenaY(-ny * 20);
      tituloX(nx * 8);
    });
    topo.addEventListener('mouseleave', () => {
      cenaX(0);
      cenaY(0);
      tituloX(0);
    });
  }

  // --- cursor --------------------------------------------------------
  // Um ponto de 10px que segue o mouse com atraso. O atraso é o efeito
  // inteiro: instantâneo não se sente.
  if (matchMedia('(pointer: fine)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.documentElement.classList.add('tem-cursor');

    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let cx = mx;
    let cy = my;

    addEventListener(
      'mousemove',
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );

    gsap.ticker.add(() => {
      // Parado em cima do ponteiro, não escreve nada: antes o cursor se
      // reposicionava 60 vezes por segundo no mesmo lugar.
      if (Math.abs(mx - cx) < 0.1 && Math.abs(my - cy) < 0.1) return;
      // 0.12 é o valor. 0.3 fica nervoso, 0.05 fica lento.
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      gsap.set(cursor, { x: cx, y: cy });
    });

    const escalar = (escala: number, vazado: boolean) =>
      gsap.to(cursor, {
        scale: escala,
        duration: 0.3,
        ease: 'power2.out',
        borderWidth: vazado ? 1 : 0,
        backgroundColor: vazado ? 'transparent' : 'currentColor',
      });

    for (const [seletor, escala, vazado] of [
      ['a, button, summary, [data-ima]', 3.2, false],
      ['video, img', 5, true],
    ] as [string, number, boolean][]) {
      document.querySelectorAll<HTMLElement>(seletor).forEach((el) => {
        el.addEventListener('mouseenter', () => escalar(escala, vazado));
        el.addEventListener('mouseleave', () => escalar(1, false));
      });
    }
  }

  // --- ímã -----------------------------------------------------------
  // Atração de poucos pixels. Sutil: se dá para perceber claramente, está
  // forte demais. Só no CTA e nos hotspots — em link de menu vira ruído.
  const RAIO = 90;
  const FORCA = 0.32;
  document.querySelectorAll<HTMLElement>('[data-ima]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < RAIO) {
        gsap.to(el, { x: dx * FORCA, y: dy * FORCA, duration: 0.4, ease: 'power3.out' });
      }
    });
    el.addEventListener('mouseleave', () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    );
  });

  // --- parallax ------------------------------------------------------
  // Só em dois lugares. Em mais que isso a página começa a flutuar e a
  // leitura sofre.
  const abertura = document.querySelector('.abertura');
  if (abertura) {
    gsap
      .timeline({
        scrollTrigger: { trigger: abertura, start: 'top top', end: 'bottom top', scrub: true },
      })
      .to('.abertura__video video', { yPercent: 12, ease: 'none' }, 0)
      // O texto SOBE um pouco mais rápido que a página (−10%), e o vídeo
      // desce devagar: dois planos em velocidades diferentes, a mesma
      // profundidade. Era `yPercent: 40` — o texto descia atrasado e, com a
      // abertura ocupando a tela inteira, o botão e o "Aberta agora"
      // passavam por cima do título da seção 2. Medido: 91px em 1280×720,
      // 30px em 1024×768. Subindo, ele se afasta da seção seguinte.
      .to('.abertura__texto', { yPercent: -10, ease: 'none' }, 0);
  }

  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.to(el.querySelector('video') ?? el, {
      yPercent: -parseFloat(el.dataset.parallax ?? '0') * 100,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // As fontes carregam com `font-display: swap`. Quando a Cabinet Grotesk
  // entra, a altura dos títulos muda e todo cálculo de posição feito antes
  // disso fica errado.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ==========================================================================
   partida
   ========================================================================== */

if (!REDUZIDO.matches) {
  revelarTitulos();
  prepararVideos();
  prepararAccordion();
  prepararDente();

  if (DESKTOP.matches) {
    // Adiado para depois do primeiro paint: GSAP e Lenis custam cerca de
    // 2 s de compilação e execução em CPU lenta, e nada deles responde a
    // coisa alguma antes de a pessoa mexer o mouse ou rolar.
    const iniciar = () => void movimentoDesktop();
    if ('requestIdleCallback' in window) requestIdleCallback(iniciar, { timeout: 3000 });
    else addEventListener('load', () => setTimeout(iniciar, 200), { once: true });
  }
}

// Sem import nem export no topo (todos os imports pesados são dinâmicos),
// o TypeScript trataria este arquivo como script e não como módulo.
export {};
