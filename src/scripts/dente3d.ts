/**
 * PASSO 5 — a cena 3D do molar. MOTION.md seções 4 e 5.
 *
 * Este módulo NUNCA entra no bundle inicial. Ele é carregado por `import()`
 * dinâmico em `movimento.ts`, e só quando a seção do dente se aproxima da
 * viewport. Three.js + GLTFLoader + DRACOLoader passam de 400 KB; carregar
 * isso no primeiro paint mataria a meta de Lighthouse 90 no celular.
 *
 * A versão estática da prancha continua no DOM e continua sendo a verdade
 * sob `prefers-reduced-motion` — este arquivo só é chamado quando não é o
 * caso. Se o WebGL falhar, ou o contexto for perdido, a imagem volta.
 *
 * Loop automático é decoração; rotação por scroll é a pessoa manipulando o
 * objeto. Por isso o dente nunca gira sozinho.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/** Nomes vindos do GLB. Conferidos no arquivo, não presumidos. */
const PARTES = ['coroa', 'colo_cervical', 'raiz_distal', 'raiz_mesial'] as const;
type Parte = (typeof PARTES)[number];

/**
 * Onde cada hotspot se ancora no modelo.
 *
 * `desvio` é somado ao centro da parte, em unidades do modelo (altura
 * normalizada = 1.0). Existe porque esmalte e dentina moram os dois na
 * coroa: sem desvio os dois pontos projetam exatamente no mesmo pixel e
 * um cobre o outro. O esmalte sobe para a superfície, a dentina desce para
 * o miolo — que é a diferença que o texto da seção explica.
 */
const ANCORA: Record<string, { no: Parte; desvio: [number, number, number] }> = {
  esmalte: { no: 'coroa', desvio: [0.06, 0.16, 0.1] },
  dentina: { no: 'coroa', desvio: [-0.13, -0.06, 0.06] },
  colo: { no: 'colo_cervical', desvio: [0.04, 0, 0.08] },
  raiz: { no: 'raiz_mesial', desvio: [0, -0.08, 0.05] },
};

/**
 * Ângulo de câmera para onde girar quando cada parte é escolhida.
 * `y` gira em torno do dente, `x` inclina.
 */
const ANGULO: Record<string, { y: number; x: number }> = {
  esmalte: { y: 0.0, x: -0.35 },
  dentina: { y: 0.7, x: -0.1 },
  colo: { y: -0.6, x: 0.05 },
  raiz: { y: 0.35, x: 0.4 },
};

/**
 * Cores do dente. Anatomicamente honestas e dentro da paleta: o esmalte da
 * coroa é frio e claro, a raiz é mais quente e amarelada. É a diferença que
 * a seção explica em texto — o modelo não pode contradizê-la.
 */
const COR: Record<Parte, number> = {
  coroa: 0xe9e7df,
  colo_cervical: 0xded6c7,
  raiz_distal: 0xd2c3a8,
  raiz_mesial: 0xd2c3a8,
};

export interface Cena {
  destruir(): void;
}

export async function montarDente(opcoes: { desktop: boolean }): Promise<Cena | null> {
  const prancha = document.querySelector<HTMLElement>('[data-prancha]');
  const palco = document.querySelector<HTMLElement>('[data-palco]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-canvas]');
  const svgFios = document.querySelector<SVGSVGElement>('[data-fios]');
  if (!prancha || !palco || !canvas || !svgFios) return null;

  const hotspots = [...document.querySelectorAll<HTMLButtonElement>('[data-hotspot]')];
  const itens = [...document.querySelectorAll<HTMLElement>('[data-parte]')];
  if (!hotspots.length) return null;

  // ------------------------------------------------------------------
  // renderer
  // ------------------------------------------------------------------
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: opcoes.desktop,
      powerPreference: opcoes.desktop ? 'default' : 'low-power',
    });
  } catch {
    // Sem WebGL a imagem estática continua no lugar. Não é erro, é o plano B.
    return null;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(palco.clientWidth - 40, palco.clientHeight - 40, false);

  const cena = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  // Luz suficiente para ler a forma, sem environment map: um HDR seria mais
  // bonito e custaria centenas de KB numa página que já carrega vídeo.
  // Intensidades contidas de propósito. A primeira versão usava 2.1/2.2 e
  // estourava: o dente virava plástico branco chapado, sem a translucidez
  // que a direção visual do BRIEF pede. Menos luz e mais contraste entre
  // chave e recorte devolvem a forma.
  cena.add(new THREE.HemisphereLight(0xfff8ec, 0x2b3a34, 1.15));
  const chave = new THREE.DirectionalLight(0xfffaf2, 1.35);
  chave.position.set(2.5, 3, 3.5);
  cena.add(chave);
  const recorte = new THREE.DirectionalLight(0xc6a47e, 0.85);
  recorte.position.set(-3, -0.5, -2.5);
  cena.add(recorte);
  const preenche = new THREE.DirectionalLight(0xe8eef0, 0.5);
  preenche.position.set(-1.5, 1, 2);
  cena.add(preenche);

  // ------------------------------------------------------------------
  // modelo
  // ------------------------------------------------------------------
  const draco = new DRACOLoader();
  // Sem `setDecoderPath`. O DRACOLoader do three declara o caminho do
  // decodificador com `new URL('../libs/draco/gltf/...', import.meta.url)`,
  // e o Vite resolve isso sozinho, emitindo os arquivos com hash.
  //
  // Copiar o decodificador para `public/` foi testado e descartado: o Vite
  // emitia a cópia dele DE QUALQUER JEITO, então o deploy ficava com os dois,
  // e a cópia manual sairia de sincronia no primeiro `npm update three`.
  // Assim o decodificador é sempre o da versão do three instalada.
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const grupo = new THREE.Group();
  cena.add(grupo);

  const nos = new Map<Parte, THREE.Mesh>();
  const materiais: THREE.MeshStandardMaterial[] = [];

  try {
    const gltf = await loader.loadAsync('/model/dente-molar-draco.glb');

    // Coletar ANTES de mover. `grupo.add(malha)` tira a malha do pai, e
    // fazer isso durante o `traverse` corrompe a iteração: a lista de
    // filhos encolhe enquanto está sendo percorrida e parte das malhas
    // nunca é visitada.
    const malhas: THREE.Mesh[] = [];
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) malhas.push(obj as THREE.Mesh);
    });

    for (const malha of malhas) {
      const nome = malha.name as Parte;
      const material = new THREE.MeshStandardMaterial({
        color: COR[nome] ?? 0xeeeae0,
        roughness: nome === 'coroa' ? 0.28 : 0.55,
        metalness: 0.0,
        transparent: true,
        opacity: 1,
      });
      malha.material = material;
      materiais.push(material);
      if (PARTES.includes(nome)) nos.set(nome, malha);
      grupo.add(malha);
    }

    if (!nos.size) throw new Error('nenhuma das partes esperadas foi encontrada no GLB');
  } catch (erro) {
    // Silêncio aqui esconderia a causa de a prancha nunca virar 3D.
    console.warn('[dente3d] não foi possível montar a cena:', erro);
    draco.dispose();
    renderer.dispose();
    return null;
  }

  draco.dispose();

  // O BRIEF diz altura normalizada 1.0 e centrado na origem. Confiar e
  // conferir: se o export mudar, é melhor recentrar do que renderizar torto.
  const caixa = new THREE.Box3().setFromObject(grupo);
  const centro = caixa.getCenter(new THREE.Vector3());
  grupo.position.sub(centro);

  palco.setAttribute('data-3d', '');
  canvas.hidden = false;

  // ------------------------------------------------------------------
  // dimensionamento
  // ------------------------------------------------------------------
  const redimensionar = () => {
    const l = palco.clientWidth - 40;
    const a = palco.clientHeight - 40;
    if (l <= 0 || a <= 0) return;
    renderer.setSize(l, a, false);
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
  };
  redimensionar();
  const ro = new ResizeObserver(redimensionar);
  ro.observe(palco);

  // ------------------------------------------------------------------
  // rotação por scroll
  //
  // `scrub: 1` — não `true`. O segundo de inércia é o que faz parecer um
  // objeto físico e não um valor ligado num slider.
  // ------------------------------------------------------------------
  let progresso = 0;
  const gatilho = ScrollTrigger.create(
    opcoes.desktop
      ? {
          trigger: '#anatomia',
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 1,
          onUpdate: (self) => (progresso = self.progress),
        }
      : {
          // No mobile não há pin: a seção rola normal e o dente acompanha.
          trigger: '#anatomia',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self) => (progresso = self.progress),
        }
  );

  // ------------------------------------------------------------------
  // arraste — soma à rotação do scroll e volta a zero ao soltar
  // ------------------------------------------------------------------
  const manual = { y: 0, x: 0 };
  let arrastando = false;
  let ultimoX = 0;
  let ultimoY = 0;

  const comecar = (e: PointerEvent) => {
    arrastando = true;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const mover = (e: PointerEvent) => {
    if (!arrastando) return;
    manual.y += (e.clientX - ultimoX) * 0.006;
    manual.x += (e.clientY - ultimoY) * 0.004;
    manual.x = Math.max(-0.6, Math.min(0.6, manual.x));
    ultimoX = e.clientX;
    ultimoY = e.clientY;
  };
  const soltar = (e: PointerEvent) => {
    if (!arrastando) return;
    arrastando = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* o ponteiro já pode ter saído */
    }
    gsap.to(manual, { y: 0, x: 0, duration: 1.2, ease: 'power2.out' });
  };

  canvas.addEventListener('pointerdown', comecar);
  canvas.addEventListener('pointermove', mover);
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.style.touchAction = 'pan-y';

  // ------------------------------------------------------------------
  // seleção de parte
  // ------------------------------------------------------------------
  const olhar = { y: 0, x: 0 };
  let ativa: string | null = null;

  const selecionar = (id: string | null) => {
    ativa = id;

    hotspots.forEach((h) =>
      h.setAttribute('aria-pressed', String(h.dataset.hotspot === id))
    );
    itens.forEach((it) => it.toggleAttribute('data-ativa', it.dataset.parte === id));
    prancha.toggleAttribute('data-ativa', id !== null);

    const destino = id ? ANGULO[id] : null;
    gsap.to(olhar, {
      y: destino?.y ?? 0,
      x: destino?.x ?? 0,
      duration: 1.1,
      ease: 'power3.inOut',
    });

    // As outras partes recuam para 0.25 no material. Não somem: a forma
    // inteira do dente continua legível, que é o ponto da seção.
    const noAtivo = id ? ANCORA[id]?.no : null;
    nos.forEach((malha, nome) => {
      const mat = malha.material as THREE.MeshStandardMaterial;
      gsap.to(mat, {
        opacity: !noAtivo || nome === noAtivo ? 1 : 0.25,
        duration: 0.6,
        ease: 'power2.out',
      });
    });
  };

  hotspots.forEach((h) => {
    h.addEventListener('click', () => {
      const id = h.dataset.hotspot!;
      selecionar(ativa === id ? null : id);
    });
  });

  // ------------------------------------------------------------------
  // fios da prancha — o segundo e último momento automático da página
  //
  // As pontas são recalculadas a cada frame a partir da projeção 3D. É o
  // que faz o rótulo continuar grudado na raiz enquanto o dente gira.
  // No mobile não há fio: os rótulos ficam abaixo da figura e a linha
  // atravessaria o layout inteiro.
  // ------------------------------------------------------------------
  const fios = new Map<string, SVGPathElement>();
  const desenharFios = opcoes.desktop;

  if (desenharFios) {
    for (const h of hotspots) {
      const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      caminho.setAttribute('class', 'fio-prancha');
      caminho.dataset.fio = h.dataset.hotspot!;
      svgFios.appendChild(caminho);
      fios.set(h.dataset.hotspot!, caminho);
    }
  }

  const vetor = new THREE.Vector3();
  const mundo = new THREE.Vector3();
  const centroMundo = new THREE.Vector3();
  const desvioDe = new Map<string, THREE.Vector3>(
    Object.entries(ANCORA).map(([id, a]) => [id, new THREE.Vector3(...a.desvio)])
  );
  const centroDe = new Map<Parte, THREE.Vector3>();
  nos.forEach((malha, nome) => {
    const b = new THREE.Box3().setFromObject(malha);
    centroDe.set(nome, b.getCenter(new THREE.Vector3()));
  });

  const posicionarSobreposicao = () => {
    const rPalco = palco.getBoundingClientRect();
    const rSvg = svgFios.getBoundingClientRect();

    for (const h of hotspots) {
      const id = h.dataset.hotspot!;
      const ancora = ANCORA[id];
      const base = ancora && centroDe.get(ancora.no);
      if (!base) continue;

      mundo.copy(base).add(desvioDe.get(id)!).applyMatrix4(grupo.matrixWorld);
      vetor.copy(mundo).project(camera);

      // Profundidade: um ponto cuja âncora girou para trás do dente ainda
      // seria desenhado por cima, e a prancha passaria a mentir. Sem
      // raycast por ponto por frame, que seria caro: compara a distância
      // da âncora à câmera com a do centro do modelo. Se está atrás, some.
      const distanciaAncora = mundo.distanceTo(camera.position);
      const distanciaCentro = centroMundo
        .setFromMatrixPosition(grupo.matrixWorld)
        .distanceTo(camera.position);
      const atras = distanciaAncora > distanciaCentro + 0.04;

      // O canvas ocupa o palco menos o padding de 20px de cada lado.
      const largura = rPalco.width - 40;
      const altura = rPalco.height - 40;
      const px = 20 + ((vetor.x + 1) / 2) * largura;
      const py = 20 + ((-vetor.y + 1) / 2) * altura;

      h.style.left = `${(px / rPalco.width) * 100}%`;
      h.style.top = `${(py / rPalco.height) * 100}%`;

      const oculto = atras || vetor.z > 1;
      h.style.opacity = oculto ? '0' : '1';
      // Sem alvo de clique quando invisível: um botão transparente que
      // ainda recebe clique é armadilha, e continuaria na ordem do Tab
      // apontando para uma parte que a pessoa não está vendo.
      h.style.pointerEvents = oculto ? 'none' : '';
      h.toggleAttribute('inert', oculto);

      const fio = fios.get(id);
      if (!fio) continue;

      const item = itens.find((it) => it.dataset.parte === id);
      if (!item) continue;
      const rItem = item.getBoundingClientRect();

      const x1 = rPalco.left - rSvg.left + px;
      const y1 = rPalco.top - rSvg.top + py;
      const x2 = rItem.left - rSvg.left;
      const y2 = rItem.top - rSvg.top + rItem.height / 2;
      // cotovelo logo depois da borda direita do palco, como em prancha
      // de livro de anatomia
      const xc = rPalco.right - rSvg.left + 24;

      fio.setAttribute('d', `M ${x1} ${y1} L ${xc} ${y1} L ${x2} ${y2}`);
      fio.style.opacity = oculto ? '0' : '';
    }
  };

  // A cascata roda uma vez. `stroke-dashoffset` precisa do comprimento
  // real do caminho, então só dá para medir depois do primeiro desenho.
  let cascataFeita = !desenharFios;
  const cascata = () => {
    if (cascataFeita) return;
    cascataFeita = true;
    const caminhos = [...fios.values()];
    caminhos.forEach((c) => {
      const comprimento = c.getTotalLength();
      c.style.strokeDasharray = `${comprimento}`;
      c.style.strokeDashoffset = `${comprimento}`;
    });
    gsap.to(caminhos, {
      strokeDashoffset: 0,
      duration: 0.8,
      stagger: 0.14,
      ease: 'power2.inOut',
    });
    // A cascata anima os FILHOS do item, não o item.
    //
    // O MOTION.md §5 pede `from({opacity: 0, x: -8})` no rótulo, e o estado
    // "parte selecionada" recua os outros itens também por opacity. Os dois
    // disputariam a mesma propriedade no mesmo elemento, e quem terminasse
    // por último venceria — uma corrida, não um bug intermitente.
    // Separando os alvos, a cascata fica com os filhos e o estado fica com o
    // item. Visualmente idêntico, sem disputa.
    const filhos = itens.flatMap((it) => [...it.children]);
    gsap.from(filhos, {
      opacity: 0,
      x: -8,
      duration: 0.5,
      stagger: 0.14 / 2,
      delay: 0.1,
      clearProps: 'opacity,transform',
    });
  };

  const gatilhoCascata = ScrollTrigger.create({
    trigger: '#anatomia',
    start: 'top 60%',
    once: true,
    onEnter: () => requestAnimationFrame(() => requestAnimationFrame(cascata)),
  });

  // ------------------------------------------------------------------
  // laço de render — para de desenhar quando a seção sai da tela
  // ------------------------------------------------------------------
  let visivel = true;
  const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting), {
    rootMargin: '200px',
  });
  io.observe(document.querySelector('#anatomia')!);

  // No desktop a seção é pinada e o giro de 1.6π acontece ao longo de 220%
  // de scroll — há espaço para dar a volta. No mobile a seção rola normal e
  // o mesmo giro passaria quase todo o tempo mostrando o dente de costas,
  // com os rótulos apontando para faces que a pessoa não vê.
  const amplitude = opcoes.desktop ? 1.6 : 0.55;

  const desenhar = () => {
    if (!visivel) return;
    grupo.rotation.y = progresso * Math.PI * amplitude + manual.y + olhar.y;
    grupo.rotation.x = Math.sin(progresso * Math.PI) * 0.18 + manual.x + olhar.x;
    camera.position.z = 3.4 - progresso * 0.9;
    grupo.updateMatrixWorld();
    renderer.render(cena, camera);
    posicionarSobreposicao();
  };
  gsap.ticker.add(desenhar);

  // ------------------------------------------------------------------
  // contexto WebGL perdido: a imagem estática volta
  // ------------------------------------------------------------------
  const aoPerder = (e: Event) => {
    e.preventDefault();
    palco.removeAttribute('data-3d');
    canvas.hidden = true;
    gsap.ticker.remove(desenhar);
  };
  canvas.addEventListener('webglcontextlost', aoPerder);

  ScrollTrigger.refresh();

  return {
    destruir() {
      gsap.ticker.remove(desenhar);
      io.disconnect();
      ro.disconnect();
      gatilho.kill();
      gatilhoCascata.kill();
      canvas.removeEventListener('pointerdown', comecar);
      canvas.removeEventListener('pointermove', mover);
      canvas.removeEventListener('pointerup', soltar);
      canvas.removeEventListener('pointercancel', soltar);
      canvas.removeEventListener('webglcontextlost', aoPerder);
      fios.forEach((f) => f.remove());
      materiais.forEach((m) => m.dispose());
      nos.forEach((m) => m.geometry.dispose());
      renderer.dispose();
      canvas.hidden = true;
      palco.removeAttribute('data-3d');
      prancha.removeAttribute('data-ativa');
      hotspots.forEach((h) => {
        h.setAttribute('aria-pressed', 'false');
        h.style.opacity = '';
      });
      itens.forEach((it) => it.removeAttribute('data-ativa'));
    },
  };
}
