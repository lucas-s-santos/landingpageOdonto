/**
 * A cena 3D do molar. MOTION.md seções 4 e 5.
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
 *
 * VER POR DENTRO (14/10/2026). Escolher uma parte corta o modelo ao meio,
 * como na prancha de um livro de anatomia: o dente gira de frente, um plano
 * atravessa o modelo e mostra as camadas — o esmalte por fora, a dentina
 * por dentro, a polpa no centro, descendo pelos canais das raízes. A parte
 * escolhida acende, as outras apagam, e a câmera chega perto dela.
 *
 * Como o miolo aparece sem um modelo novo:
 *
 *   O CORTE é um plano de recorte (`clippingPlanes`) fixo no mundo, de
 *   frente para a câmera. O que fica à frente dele não é desenhado.
 *
 *   O MIOLO PINTADO. Cortada, uma malha mostra o lado de DENTRO das
 *   próprias faces. O shader pinta esse lado de dentro com uma cor chapada
 *   — a cor da camada —, e o resultado lê como a superfície de um corte
 *   maciço. É a técnica clássica de "tampa" de corte, sem stencil.
 *
 *   AS CAMADAS INTERNAS são cópias reduzidas das partes que o modelo já
 *   tem: a dentina é a coroa a 80%; a câmara da polpa, a coroa a 42%; os
 *   canais, as raízes afinadas. Cascas dentro de cascas: cortadas, cada uma
 *   pinta o seu anel. É uma ilustração, não uma tomografia — e é o que uma
 *   prancha de livro também é.
 *
 * SEM GSAP de propósito. O laço de render já roda a cada frame, então
 * suavizar um valor em direção a um alvo é uma linha de interpolação.
 */

/** Interpolação exponencial estável em qualquer taxa de quadros. */
const lerp = (de: number, para: number, k: number) => de + (para - de) * k;
/** Suaviza o começo e o fim de um valor de 0 a 1. */
const suave = (t: number) => t * t * (3 - 2 * t);

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Nomes vindos do GLB. Conferidos no arquivo, não presumidos. */
const PARTES = ['coroa', 'colo_cervical', 'raiz_distal', 'raiz_mesial'] as const;
type Parte = (typeof PARTES)[number];

/** As quatro regiões que a seção explica. */
type Id = 'esmalte' | 'dentina' | 'colo' | 'raiz';
const IDS: Id[] = ['esmalte', 'dentina', 'colo', 'raiz'];

/**
 * Onde cada marcador se ancora no modelo INTEIRO.
 *
 * `desvio` é somado ao centro da parte, em unidades do modelo (altura
 * normalizada = 1.0). Existe porque esmalte e dentina moram os dois na
 * coroa: sem desvio os dois pontos projetam exatamente no mesmo pixel e
 * um cobre o outro. O esmalte sobe para a superfície, a dentina desce para
 * o miolo — que é a diferença que o texto da seção explica.
 */
const ANCORA: Record<Id, { no: Parte; desvio: [number, number, number] }> = {
  esmalte: { no: 'coroa', desvio: [0.06, 0.16, 0.1] },
  dentina: { no: 'coroa', desvio: [-0.13, -0.06, 0.06] },
  colo: { no: 'colo_cervical', desvio: [0.04, 0, 0.08] },
  raiz: { no: 'raiz_mesial', desvio: [0, -0.08, 0.05] },
};

/**
 * Onde cada marcador se ancora no modelo CORTADO: em cima do próprio corte,
 * na camada que ele nomeia. Coordenadas do modelo, com z = 0 — o plano do
 * corte. O esmalte fica no anel branco da direita, a dentina no miolo, o
 * colo na cintura, a raiz em cima do canal.
 */
const ANCORA_CORTE: Record<Id, [number, number, number]> = {
  esmalte: [0.228, 0.33, 0],
  dentina: [-0.13, 0.2, 0],
  colo: [0.142, -0.02, 0],
  raiz: [-0.095, -0.3, 0],
};

/**
 * Para onde a câmera vai no corte: `y` é a altura do modelo que fica no
 * centro do quadro, `z` a distância. A câmera chega perto da parte
 * escolhida — é isso que faz o toque "abrir" o lugar que a pessoa apontou.
 */
const FOCO: Record<Id, { y: number; z: number }> = {
  esmalte: { y: 0.27, z: 1.85 },
  dentina: { y: 0.2, z: 1.95 },
  colo: { y: 0.0, z: 1.85 },
  raiz: { y: -0.2, z: 2.15 },
};

/**
 * Cores do lado de fora. Anatomicamente honestas e dentro da paleta: o
 * esmalte da coroa é frio e claro, a raiz é mais quente e amarelada.
 */
const COR: Record<Parte, number> = {
  coroa: 0xe9e7df,
  colo_cervical: 0xded6c7,
  raiz_distal: 0xd2c3a8,
  raiz_mesial: 0xd2c3a8,
};

/**
 * Cores do corte, por camada. Saem direto no pixel, sem passar pela
 * conversão de cor do Three — por isso são valores sRGB, como no CSS.
 * Esmalte branco-frio, dentina marfim-amarelada, polpa rosada: as três
 * cores que todo livro de anatomia usa, e que a legenda nomeia.
 */
const CAPA = {
  // Branco frio, puxado para o azul. O branco quente de antes (#f4f2eb) era
  // quase a cor do palco (#efede6) e a casca do esmalte, sozinha, sumia.
  esmalte: 0xdde5e8,
  dentina: 0xe1c595,
  polpa: 0xc7867b,
};
/**
 * A camada que não está em destaque, no corte, vai 70% em direção a este
 * cinza-sálvia — e guarda 30% da própria cor. Cinza puro fazia a polpa
 * apagada parecer um buraco no meio do dente.
 */
const APAGADA = 0xb4b9b1;

/**
 * Vira as faces para fora quando o arquivo as trouxe viradas para dentro.
 *
 * O colo do GLB vem com a ordem dos vértices invertida: o lado de fora dele
 * é, para a placa de vídeo, o lado de DENTRO. Com o miolo pintado de cor
 * chapada, isso aparecia como uma faixa bege lisa no meio do dente inteiro.
 *
 * O teste é o volume com sinal da malha fechada: soma dos tetraedros de
 * cada triângulo com a origem. Positivo, as faces apontam para fora;
 * negativo, estão ao contrário — e trocar dois vértices de cada triângulo
 * desvira tudo.
 */
function orientarParaFora(g: THREE.BufferGeometry) {
  const pos = g.attributes.position;
  const idx = g.index;
  if (!idx) return;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let volume = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i));
    b.fromBufferAttribute(pos, idx.getX(i + 1));
    c.fromBufferAttribute(pos, idx.getX(i + 2));
    volume += a.dot(b.cross(c));
  }
  if (volume >= 0) return;
  for (let i = 0; i < idx.count; i += 3) {
    const t = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, t);
  }
  idx.needsUpdate = true;
}

/**
 * Tira a tampa plana de uma ponta da malha.
 *
 * As partes do GLB são fechadas: a coroa tem um piso plano exatamente onde
 * encosta no colo, e o colo tem tampa em cima e embaixo. Por fora ninguém
 * vê — uma tampa encosta na outra. Mas com o corte aberto a câmera olha
 * esses pisos quase de lado, e eles apareciam como uma lâmina escura
 * atravessando o dente na junção da coroa com o colo.
 *
 * Sai todo triângulo com os três vértices na altura `y` (tolerância
 * `tol`). Aberta ali, a malha mostra o lado de dentro — que já é pintado
 * na cor da camada.
 */
function tirarTampa(g: THREE.BufferGeometry, y: number, tol = 0.004) {
  const pos = g.attributes.position;
  const idx = g.index;
  if (!idx) return;
  const ficam: number[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    const b = idx.getX(i + 1);
    const c = idx.getX(i + 2);
    const naTampa =
      Math.abs(pos.getY(a) - y) < tol && Math.abs(pos.getY(b) - y) < tol && Math.abs(pos.getY(c) - y) < tol;
    if (!naTampa) ficam.push(a, b, c);
  }
  g.setIndex(ficam);
}

/**
 * Encaixa o topo das raízes dentro do colo.
 *
 * No GLB as raízes começam mais largas que o colo. Medido no arquivo: em
 * y = −0,02 cada raiz vai até 0,206 do eixo e o colo só até 0,155; em
 * −0,10, onde o colo termina, 0,191 contra 0,139. Por fora, a boca das duas
 * raízes saía do colo como um funil — e, com a tampa tirada para o corte, a
 * borda de dentro aparecia como um aro chapado no meio do dente inteiro.
 *
 * O trecho de cima de cada raiz é puxado para o eixo até caber no colo
 * (x a 70%, z a 92% acima de −0,10), e solta aos poucos até a forma
 * original em −0,26. O colo vira o tronco e as raízes se abrem a partir
 * dele, que é o desenho de um molar. Feito antes das normais e das cópias
 * reduzidas: a luz e os canais acompanham a forma nova.
 */
function encaixarRaiz(g: THREE.BufferGeometry) {
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = THREE.MathUtils.smoothstep(pos.getY(i), -0.26, -0.1);
    pos.setX(i, pos.getX(i) * (1 - 0.3 * k));
    pos.setZ(i, pos.getZ(i) * (1 - 0.08 * k));
  }
  pos.needsUpdate = true;
}

const vec3DeHex = (hex: number) =>
  new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

/** Uma malha da cena, com o que é preciso para acender e apagar. */
interface Camada {
  malha: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  destaque: { value: number };
  destaqueAlvo: number;
  brilhoAlvo: number;
  /** Opacidade para onde a camada caminha: 1 sólida, `FANTASMA` fantasma. */
  opacidadeAlvo: number;
  /** Qual das quatro regiões um toque nesta malha escolhe. */
  id: Id;
}

/**
 * MOSTRAR SÓ O QUE FOI ESCOLHIDO. Cada camada fica em um de três estados:
 *
 *   sólida   — a parte escolhida, inteira e cortada ao meio;
 *   fantasma — o resto do dente, a 7% de opacidade: só o contorno, para a
 *              pessoa saber onde a parte mora;
 *   oca      — não desenha cor nenhuma, mas ocupa lugar na profundidade.
 *              É o que faz o esmalte sozinho aparecer OCO: a dentina por
 *              baixo dele vira oca, e através do corte se vê a casca e o
 *              vazio dentro dela, em vez de uma mancha branca chapada.
 */
type Estado = 'solida' | 'fantasma' | 'oca';
const FANTASMA = 0.07;

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
  const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-ver]')];
  const controles = document.querySelector<HTMLElement>('[data-controles]');
  const legenda = document.querySelector<HTMLElement>('[data-estado-corte]');
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

  // 1,5x no máximo. Com o palco do tamanho da coluna, 2x dava 2,2 milhões
  // de pixels por quadro para um dente que não ganha nitidez visível com isso.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(palco.clientWidth - 40, palco.clientHeight - 40, false);
  // O corte. Desligado no renderer, o `clippingPlanes` dos materiais não faz nada.
  renderer.localClippingEnabled = true;

  const cena = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 2.75);

  // Luz suficiente para ler a forma, sem environment map: um HDR seria mais
  // bonito e custaria centenas de KB numa página que já carrega vídeo.
  // Intensidades contidas de propósito: com 2.1/2.2 o dente virava plástico
  // branco chapado, sem a translucidez que a direção visual do BRIEF pede.
  // Com normais de verdade (o GLB não traz; elas são calculadas abaixo) a
  // coroa ficou cinza: o chão do hemisfério era quase o eucalipto. Chão mais
  // claro e um pouco mais de céu devolvem o branco frio do esmalte.
  cena.add(new THREE.HemisphereLight(0xfff8ec, 0x6b7a72, 1.45));
  const chave = new THREE.DirectionalLight(0xfffaf2, 1.5);
  chave.position.set(2.5, 3, 3.5);
  cena.add(chave);
  const recorte = new THREE.DirectionalLight(0xc6a47e, 0.85);
  recorte.position.set(-3, -0.5, -2.5);
  cena.add(recorte);
  const preenche = new THREE.DirectionalLight(0xe8eef0, 0.5);
  preenche.position.set(-1.5, 1, 2);
  cena.add(preenche);

  // ------------------------------------------------------------------
  // o plano do corte — fixo no mundo, de frente para a câmera
  //
  // Normal (0, 0, −1): sobra o que tem z ≤ constante. Com a constante em
  // 0,65 nada é cortado (o dente vai até z = 0,24); em 0 ele é cortado ao
  // meio. A animação do corte é essa constante caminhando de uma ponta à
  // outra — o plano atravessa o dente de frente para trás.
  // ------------------------------------------------------------------
  const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.65);

  /** Material com o lado de dentro pintado na cor da camada. */
  const criarMaterial = (corFrente: number, rugosidade: number, capa: number) => {
    const destaque = { value: 1 };
    const material = new THREE.MeshStandardMaterial({
      color: corFrente,
      roughness: rugosidade,
      metalness: 0,
      side: THREE.DoubleSide,
      clippingPlanes: [plano],
      emissive: new THREE.Color(0xfff4dc),
      emissiveIntensity: 0,
      // Uma passada só, mesmo transparente. Com duas (o padrão do Three para
      // material transparente de dois lados), a passada do lado de dentro
      // inverte qual face é "da frente" — e o miolo, que o shader reconhece
      // por `gl_FrontFacing`, saía iluminado durante toda a troca de parte e
      // só virava corte no último quadro. Medido: um salto visível.
      forceSinglePass: true,
    });
    const uCapa = { value: vec3DeHex(capa) };
    const uApagada = { value: vec3DeHex(APAGADA) };
    material.onBeforeCompile = (sh) => {
      sh.uniforms.uCapa = uCapa;
      sh.uniforms.uApagada = uApagada;
      sh.uniforms.uDestaque = destaque;
      sh.fragmentShader = sh.fragmentShader
        .replace(
          'void main() {',
          'uniform vec3 uCapa;\nuniform vec3 uApagada;\nuniform float uDestaque;\nvoid main() {'
        )
        // Depois do recorte, antes de qualquer luz: o lado de dentro de uma
        // face só aparece quando a malha foi cortada, e aparece chapado.
        .replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\n' +
            '\tif ( ! gl_FrontFacing ) { gl_FragColor = vec4( mix( mix( uCapa, uApagada, 0.7 ), uCapa, uDestaque ), opacity ); return; }'
        );
    };
    return { material, destaque };
  };

  // ------------------------------------------------------------------
  // modelo
  // ------------------------------------------------------------------
  const draco = new DRACOLoader();
  // Sem `setDecoderPath`. O DRACOLoader do three declara o caminho do
  // decodificador com `new URL('../libs/draco/gltf/...', import.meta.url)`,
  // e o Vite resolve isso sozinho, emitindo os arquivos com hash.
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const grupo = new THREE.Group();
  cena.add(grupo);

  const nos = new Map<Parte, THREE.Mesh>();
  const camadas: Camada[] = [];
  const geometriasExtras: THREE.BufferGeometry[] = [];

  const adicionar = (
    geometria: THREE.BufferGeometry,
    corFrente: number,
    rugosidade: number,
    capa: number,
    id: Id
  ) => {
    const { material, destaque } = criarMaterial(corFrente, rugosidade, capa);
    const malha = new THREE.Mesh(geometria, material);
    grupo.add(malha);
    const camada: Camada = { malha, material, destaque, destaqueAlvo: 1, brilhoAlvo: 0, opacidadeAlvo: 1, id };
    camadas.push(camada);
    return camada;
  };

  /** Uma cópia da geometria, reduzida em torno de um ponto. */
  const reduzida = (
    g: THREE.BufferGeometry,
    escala: [number, number, number],
    centro: [number, number, number]
  ) => {
    const c = g.clone();
    c.translate(-centro[0], -centro[1], -centro[2]);
    c.scale(...escala);
    c.translate(...centro);
    geometriasExtras.push(c);
    return c;
  };

  const porParte = new Map<Parte, Camada>();
  const internas: Record<string, Camada> = {};

  try {
    const gltf = await loader.loadAsync('/model/dente-molar-draco.glb');

    // Coletar ANTES de mover. `grupo.add(malha)` tira a malha do pai, e
    // fazer isso durante o `traverse` corrompe a iteração.
    const malhas: THREE.Mesh[] = [];
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) malhas.push(obj as THREE.Mesh);
    });

    const geometriaDe = new Map<Parte, THREE.BufferGeometry>();
    for (const malha of malhas) {
      const nome = malha.name as Parte;
      if (!PARTES.includes(nome)) continue;
      // O GLB não traz normais. Sem elas a luz não tem para onde bater.
      // Junta os vértices repetidos antes de calcular, senão cada
      // triângulo vira uma faceta e o dente fica de papel dobrado.
      let g = malha.geometry;
      g.deleteAttribute('color');
      g = mergeVertices(g);
      orientarParaFora(g);
      if (nome === 'raiz_distal' || nome === 'raiz_mesial') encaixarRaiz(g);
      g.computeVertexNormals();
      geometriaDe.set(nome, g);
      geometriasExtras.push(g);
    }
    if (!geometriaDe.size) throw new Error('nenhuma das partes esperadas foi encontrada no GLB');

    const coroa = geometriaDe.get('coroa')!;
    const colo = geometriaDe.get('colo_cervical')!;
    const raizD = geometriaDe.get('raiz_distal')!;
    const raizM = geometriaDe.get('raiz_mesial')!;

    // As tampas das junções: o piso da coroa, o teto e o piso do colo, o
    // topo das raízes. Medidas na própria geometria, não chutadas.
    const pontas = (g: THREE.BufferGeometry) => {
      g.computeBoundingBox();
      return g.boundingBox!;
    };
    tirarTampa(coroa, pontas(coroa).min.y);
    tirarTampa(colo, pontas(colo).max.y);
    tirarTampa(colo, pontas(colo).min.y);
    tirarTampa(raizD, pontas(raizD).max.y);
    tirarTampa(raizM, pontas(raizM).max.y);

    // Lado de fora. O miolo de todas as partes que não são a casca da coroa
    // é dentina — é do que a raiz e o colo são feitos.
    porParte.set('coroa', adicionar(coroa, COR.coroa, 0.28, CAPA.esmalte, 'esmalte'));
    porParte.set('colo_cervical', adicionar(colo, COR.colo_cervical, 0.55, CAPA.dentina, 'colo'));
    porParte.set('raiz_distal', adicionar(raizD, COR.raiz_distal, 0.55, CAPA.dentina, 'raiz'));
    porParte.set('raiz_mesial', adicionar(raizM, COR.raiz_mesial, 0.55, CAPA.dentina, 'raiz'));
    porParte.forEach((c, nome) => nos.set(nome, c.malha));

    // Lado de dentro. Medidas em unidades do modelo: a coroa vai de
    // y = 0,08 a 0,50; o colo de −0,10 a 0,08; as raízes de −0,50 a 0, uma
    // centrada em x = +0,095 e a outra em −0,095.
    internas.dentina = adicionar(
      reduzida(coroa, [0.8, 0.8, 0.8], [0, 0.12, 0]),
      CAPA.dentina, 0.6, CAPA.dentina, 'dentina'
    );
    internas.camara = adicionar(
      reduzida(coroa, [0.42, 0.45, 0.42], [0, 0.07, 0]),
      CAPA.polpa, 0.6, CAPA.polpa, 'raiz'
    );
    internas.pescoco = adicionar(
      reduzida(colo, [0.45, 1, 0.45], [0, -0.012, 0]),
      CAPA.polpa, 0.6, CAPA.polpa, 'raiz'
    );
    internas.canalD = adicionar(
      reduzida(raizD, [0.28, 0.93, 0.28], [0.095, 0, 0]),
      CAPA.polpa, 0.6, CAPA.polpa, 'raiz'
    );
    internas.canalM = adicionar(
      reduzida(raizM, [0.28, 0.93, 0.28], [-0.095, 0, 0]),
      CAPA.polpa, 0.6, CAPA.polpa, 'raiz'
    );
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
  const base = caixa.getCenter(new THREE.Vector3()).negate();
  grupo.position.copy(base);

  /**
   * O que acende em cada escolha. `corte`: as camadas cujo miolo pinta em
   * cor cheia. `fora`: as que ganham um brilho por fora.
   */
  const coroaC = porParte.get('coroa')!;
  const coloC = porParte.get('colo_cervical')!;
  const raizDC = porParte.get('raiz_distal')!;
  const raizMC = porParte.get('raiz_mesial')!;
  const { dentina: dentinaC, camara, pescoco, canalD, canalM } = internas;

  /**
   * O que aparece em cada escolha. O que não está listado vira fantasma.
   *
   *   esmalte — só a casca da coroa; o miolo de dentina vira oco, e a
   *             casca aparece como casca.
   *   dentina — o miolo da coroa, o colo e as raízes (tudo isso é dentina
   *             por dentro); a polpa vira oca, e o canal aparece vazio
   *             dentro dela. O esmalte vira fantasma.
   *   colo    — a cintura do dente, com a polpa que passa por ela.
   *   raiz    — as duas raízes e os canais, em rosa.
   */
  const ISOLA: Record<Id, { solida: Camada[]; oca: Camada[] }> = {
    esmalte: { solida: [coroaC], oca: [dentinaC, camara] },
    dentina: { solida: [dentinaC, coloC, raizDC, raizMC], oca: [camara, pescoco, canalD, canalM] },
    colo: { solida: [coloC, pescoco], oca: [] },
    raiz: { solida: [raizDC, raizMC, canalD, canalM], oca: [] },
  };

  /** As camadas de dentro: fantasma delas não ajuda, só risca o contorno. */
  const deDentro = new Set(Object.values(internas));

  /** Aplica um estado a uma camada. A opacidade caminha no laço. */
  const aplicar = (c: Camada, estado: Estado) => {
    const oca = estado === 'oca';
    c.material.colorWrite = !oca;
    // A oca precisa ser desenhada ANTES de tudo, senão a cor de trás já
    // estaria no pixel quando ela marcasse a profundidade.
    c.malha.renderOrder = oca ? -1 : 0;
    // O fantasma é só o contorno de FORA do dente. Uma camada de dentro que
    // não foi escolhida some de vez: a 7% ela desenhava riscos vermelhos
    // finos — o canal — atravessando o fantasma das raízes.
    c.opacidadeAlvo = estado === 'fantasma' ? (deDentro.has(c) ? 0 : FANTASMA) : 1;
    if (oca) c.material.opacity = 1;
    c.malha.visible = true;
  };

  palco.setAttribute('data-3d', '');
  canvas.hidden = false;
  hotspots.forEach((h) => (h.hidden = false));
  if (controles) controles.hidden = false;
  if (legenda) legenda.hidden = false;
  prancha.setAttribute('data-3d-pronto', '');
  const legendaInteiro = legenda?.textContent?.trim() ?? '';

  // ------------------------------------------------------------------
  // dimensionamento
  // ------------------------------------------------------------------
  // Pede um quadro novo mesmo com a cena parada (o laço só desenha quando
  // algo se move). Declarado aqui, antes do primeiro `redimensionar()`.
  let forcar = true;
  const forcarQuadro = () => {
    forcar = true;
  };
  const redimensionar = () => {
    const l = palco.clientWidth - 40;
    const a = palco.clientHeight - 40;
    if (l <= 0 || a <= 0) return;
    renderer.setSize(l, a, false);
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
    forcarQuadro();
  };
  redimensionar();
  const ro = new ResizeObserver(redimensionar);
  addEventListener('resize', forcarQuadro, { passive: true });
  ro.observe(palco);

  // ------------------------------------------------------------------
  // rotação por scroll — SEM pin
  //
  // O pin saiu, e saiu por medida: pinar `#anatomia` (1394px) numa janela
  // de 900px deixava 494px da seção inalcançáveis. Ver MOTION.md §4.
  // ------------------------------------------------------------------
  const secao = document.querySelector<HTMLElement>('#anatomia')!;
  let progressoAlvo = 0;
  let progresso = 0;

  /**
   * Progresso medido a partir da PRANCHA, não da seção: ancorado na
   * prancha, o meio do percurso (0.5) é o instante em que ela está
   * centralizada. Lido dentro do laço de render, sem ouvinte de scroll —
   * funciona igual com o Lenis, que move o scroll por conta própria.
   */
  const medirProgresso = () => {
    const r = prancha.getBoundingClientRect();
    const total = r.height + innerHeight;
    if (total <= 0) return;
    progressoAlvo = Math.min(1, Math.max(0, (innerHeight - r.top) / total));
  };
  medirProgresso();
  progresso = progressoAlvo;

  // ------------------------------------------------------------------
  // seleção
  // ------------------------------------------------------------------
  let ativa: Id | null = null;
  /** A última escolhida: o foco da câmera continua nela enquanto o corte fecha. */
  let focoId: Id = 'dentina';
  let corteAlvo = 0;
  let corte = 0;

  const selecionar = (id: Id | null) => {
    ativa = id;
    if (id) focoId = id;
    corteAlvo = id ? 1 : 0;

    hotspots.forEach((h) => h.setAttribute('aria-pressed', String(h.dataset.hotspot === id)));
    botoes.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.ver || null) === id)));
    itens.forEach((it) => it.toggleAttribute('data-ativa', it.dataset.parte === id));
    prancha.toggleAttribute('data-ativa', id !== null);

    if (legenda) {
      legenda.textContent = id
        ? botoes.find((b) => b.dataset.ver === id)?.dataset.corte ?? legendaInteiro
        : legendaInteiro;
    }

    const isola = id ? ISOLA[id] : null;
    for (const c of camadas) {
      const estado: Estado = !isola
        ? 'solida'
        : isola.solida.includes(c)
          ? 'solida'
          : isola.oca.includes(c)
            ? 'oca'
            : 'fantasma';
      aplicar(c, estado);
      c.destaqueAlvo = 1;
      c.brilhoAlvo = 0;
    }
    forcar = true;
  };

  hotspots.forEach((h) =>
    h.addEventListener('click', () => {
      const id = h.dataset.hotspot as Id;
      selecionar(ativa === id ? null : id);
    })
  );
  botoes.forEach((b) =>
    b.addEventListener('click', () => selecionar((b.dataset.ver as Id) || null))
  );
  // O título de cada parte na lista também escolhe — atalho de ponteiro.
  itens.forEach((it) =>
    it.querySelector('dt')?.addEventListener('click', () => {
      const id = it.dataset.parte as Id;
      selecionar(ativa === id ? null : id);
    })
  );

  // ------------------------------------------------------------------
  // tocar no próprio dente
  //
  // Um toque curto (sem arrastar) lança um raio da câmera até o modelo e
  // escolhe a parte atingida. É o "aperto aqui e vejo isto por dentro".
  // Com o corte aberto, o raio ignora o que o plano cortou — o Raycaster
  // não sabe do recorte, então a conferência é feita aqui.
  // ------------------------------------------------------------------
  const raio = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  const alvosDoRaio = camadas.map((c) => c.malha);
  const idDaMalha = new Map(camadas.map((c) => [c.malha, c.id]));

  const parteSob = (clientX: number, clientY: number): Id | null => {
    const r = canvas.getBoundingClientRect();
    ponteiro.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(ponteiro, camera);
    const acertos = raio.intersectObjects(alvosDoRaio, false);
    const valido = acertos.find((a) => plano.distanceToPoint(a.point) >= -0.002);
    return valido ? idDaMalha.get(valido.object as THREE.Mesh) ?? null : null;
  };

  // ------------------------------------------------------------------
  // arraste — soma à rotação e volta a zero ao soltar
  // ------------------------------------------------------------------
  const manual = { y: 0, x: 0 };
  let soltando = false;
  let arrastando = false;
  let ultimoX = 0;
  let ultimoY = 0;
  let inicio = { x: 0, y: 0, t: 0 };

  const comecar = (e: PointerEvent) => {
    arrastando = true;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    inicio = { x: e.clientX, y: e.clientY, t: performance.now() };
    // Pode falhar — toque cancelado pelo sistema, ponteiro que já sumiu. Sem
    // a captura o arraste só fica preso ao canvas; não é motivo para quebrar.
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura */
    }
  };
  const mover = (e: PointerEvent) => {
    if (!arrastando) {
      pedirSobrevoo(e);
      return;
    }
    soltando = false;
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
    // Toque curto, sem arrasto: é uma escolha, não um giro.
    const andou = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y);
    if (e.type === 'pointerup' && andou < 8 && performance.now() - inicio.t < 450) {
      const id = parteSob(e.clientX, e.clientY);
      if (id) selecionar(ativa === id ? null : id);
    }
    // volta a zero por interpolação no laço, em ~1.2s
    soltando = true;
  };

  // --- sobrevoo do mouse: a parte sob o cursor se ilumina -------------
  // Só com mouse. Um raio por quadro, no máximo, e só quando o mouse anda.
  let sobrevooPedido: { x: number; y: number } | null = null;
  let sobrevoo: Id | null = null;
  const pedirSobrevoo = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') sobrevooPedido = { x: e.clientX, y: e.clientY };
  };
  const sairDoCanvas = () => {
    sobrevooPedido = null;
    sobrevoo = null;
    canvas.style.cursor = '';
    hotspots.forEach((h) => h.classList.remove('sob-ponteiro'));
  };

  canvas.addEventListener('pointerdown', comecar);
  canvas.addEventListener('pointermove', mover);
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('pointerleave', sairDoCanvas);
  canvas.style.touchAction = 'pan-y';

  // ------------------------------------------------------------------
  // fios da prancha — o segundo e último momento automático da página
  //
  // As pontas são recalculadas a cada frame a partir da projeção 3D. No
  // mobile não há fio: os rótulos ficam abaixo da figura e a linha
  // atravessaria o layout inteiro — lá o nome vai escrito no marcador.
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
  const local = new THREE.Vector3();
  const centroMundo = new THREE.Vector3();
  const centroDe = new Map<Parte, THREE.Vector3>();
  nos.forEach((malha, nome) => {
    malha.geometry.computeBoundingBox();
    centroDe.set(nome, malha.geometry.boundingBox!.getCenter(new THREE.Vector3()));
  });
  const ancoraInteira = new Map<Id, THREE.Vector3>();
  const ancoraCortada = new Map<Id, THREE.Vector3>();
  for (const id of IDS) {
    const a = ANCORA[id];
    const c = centroDe.get(a.no);
    if (c) ancoraInteira.set(id, c.clone().add(new THREE.Vector3(...a.desvio)));
    ancoraCortada.set(id, new THREE.Vector3(...ANCORA_CORTE[id]));
  }

  /**
   * Retângulos dos rótulos, medidos uma vez por layout em vez de a cada
   * frame — ler e escrever layout alternadamente força o navegador a
   * recalcular no meio do frame.
   */
  let rotulosCache: Map<string, DOMRect> | null = null;
  const medirRotulos = () => {
    rotulosCache = new Map(itens.map((it) => [it.dataset.parte!, it.getBoundingClientRect()]));
  };
  const invalidar = () => (rotulosCache = null);
  addEventListener('scroll', invalidar, { passive: true });
  addEventListener('resize', invalidar, { passive: true });

  const posicionarSobreposicao = () => {
    // fase de leitura
    const rPalco = palco.getBoundingClientRect();
    const rSvg = svgFios.getBoundingClientRect();
    if (!rotulosCache) medirRotulos();

    centroMundo.setFromMatrixPosition(grupo.matrixWorld);
    const distanciaCentro = centroMundo.distanceTo(camera.position);

    for (const h of hotspots) {
      const id = h.dataset.hotspot as Id;
      const inteira = ancoraInteira.get(id);
      const cortada = ancoraCortada.get(id);
      if (!inteira || !cortada) continue;

      // Inteiro, o marcador fica na superfície; cortado, vai para cima do
      // corte, na camada que ele nomeia. No meio do caminho, interpola.
      local.copy(inteira).lerp(cortada, suave(corte));
      mundo.copy(local).applyMatrix4(grupo.matrixWorld);
      vetor.copy(mundo).project(camera);

      // Profundidade: quem girou para trás do dente RECUA, não some.
      const atras = mundo.distanceTo(camera.position) > distanciaCentro + 0.04;

      // O canvas ocupa o palco menos o padding de 20px de cada lado.
      const largura = rPalco.width - 40;
      const altura = rPalco.height - 40;
      const px = 20 + ((vetor.x + 1) / 2) * largura;
      const py = 20 + ((-vetor.y + 1) / 2) * altura;

      h.style.left = `${(px / rPalco.width) * 100}%`;
      h.style.top = `${(py / rPalco.height) * 100}%`;
      // Perto da borda direita o nome iria para fora do palco, cortado.
      // Lá ele passa para a esquerda do anel.
      h.classList.toggle('hotspot--esquerda', px > rPalco.width - 140);

      // Fora do quadro — a câmera chegou perto e a parte saiu de vista —
      // é o único caso que some de vez.
      const foraDoQuadro = vetor.z > 1 || px < 4 || px > rPalco.width - 4 || py < 4 || py > rPalco.height - 4;
      // Escolhida uma parte, os marcadores das outras somem: o resto do
      // dente virou fantasma, e só o que a pessoa escolheu continua nomeado.
      const outra = ativa !== null && ativa !== id;
      h.style.opacity = foraDoQuadro || outra ? '0' : atras ? '0.4' : '';
      h.style.pointerEvents = foraDoQuadro || outra ? 'none' : '';
      h.classList.toggle('sob-ponteiro', sobrevoo === id);

      const fio = fios.get(id);
      if (!fio) continue;

      // Com uma parte escolhida, só o fio dela fica. O resto do dente virou
      // fantasma; fio apontando para fantasma seria prancha mentindo.
      if (ativa && ativa !== id) {
        fio.style.opacity = '0';
        continue;
      }

      const rItem = rotulosCache!.get(id);
      if (!rItem) continue;

      const x1 = rPalco.left - rSvg.left + px;
      const y1 = rPalco.top - rSvg.top + py;
      const y2 = rItem.top - rSvg.top + rItem.height / 2;

      const bordaTexto = rItem.left - rSvg.left;
      const bordaPalco = rPalco.right - rSvg.left;
      const folga = bordaTexto - bordaPalco;

      // Sem corredor entre a prancha e o texto, sem fio: fio de prancha
      // anatômica que passa por cima das letras vira rabisco.
      if (folga < 72 || foraDoQuadro) {
        fio.style.opacity = '0';
        fio.removeAttribute('d');
        continue;
      }

      // Três trechos, como em prancha de livro: sai do ponto na horizontal,
      // atravessa o corredor na diagonal, chega ao rótulo na horizontal.
      const saida = bordaPalco + Math.min(28, folga * 0.22);
      const chegada = bordaTexto - Math.min(28, folga * 0.22);

      fio.setAttribute(
        'd',
        `M ${x1} ${y1} L ${saida} ${y1} L ${chegada} ${y2} L ${bordaTexto - 8} ${y2}`
      );
      fio.style.opacity = atras ? '0.3' : '';
    }
  };

  // A cascata roda uma vez. `stroke-dashoffset` precisa do comprimento
  // real do caminho, então só dá para medir depois do primeiro desenho.
  let cascataFeita = !desenharFios;
  const cascata = () => {
    if (cascataFeita) return;
    cascataFeita = true;
    const caminhos = [...fios.values()].filter((c) => c.getAttribute('d'));
    caminhos.forEach((c, i) => {
      const comprimento = c.getTotalLength();
      // WAAPI, não biblioteca. A cascata é predeterminada e roda uma vez.
      c.animate([{ strokeDasharray: `${comprimento}`, strokeDashoffset: comprimento }, { strokeDasharray: `${comprimento}`, strokeDashoffset: 0 }], {
        duration: 800,
        delay: i * 140,
        easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
      });
    });
    // A cascata anima os FILHOS do item, não o item: o estado "parte
    // escolhida" recua os outros itens por opacity, e os dois disputariam a
    // mesma propriedade no mesmo elemento.
    const filhos = itens.flatMap((it) => [...it.children]) as HTMLElement[];
    filhos.forEach((f, i) => {
      f.animate(
        [
          { opacity: 0, transform: 'translateX(-8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 500, delay: 100 + i * 70, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    });
  };

  const obsCascata = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      obsCascata.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(cascata));
    },
    { rootMargin: '0px 0px -40% 0px' }
  );
  obsCascata.observe(secao);

  // ------------------------------------------------------------------
  // laço de render — para de desenhar quando a seção sai da tela
  // ------------------------------------------------------------------
  let visivel = true;
  const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting), {
    rootMargin: '200px',
  });
  io.observe(secao);

  // Giro CENTRADO: `(progresso - 0.5)`. A pose frontal cai no meio do
  // percurso, que é quando a pessoa lê. ±90° nas pontas no desktop.
  const amplitude = opcoes.desktop ? 1.0 : 0.7;
  let ultimoSobrevoo = 0;

  /*
    DESENHAR SÓ QUANDO ALGO MUDA. O laço continua vivo enquanto a seção está
    na tela, mas o render — o caro, na placa de vídeo — só acontece se o
    scroll, o corte, o arraste, uma opacidade ou o mouse ainda estão em
    movimento. Parada, a cena fica no último quadro e custa zero. Antes ela
    redesenhava 60 vezes por segundo a mesma imagem.
  */
  const emMovimento = () =>
    Math.abs(progresso - progressoAlvo) > 0.0002 ||
    corte !== corteAlvo ||
    arrastando ||
    soltando ||
    sobrevooPedido !== null ||
    camadas.some(
      (c) =>
        Math.abs(c.material.opacity - (c.material.colorWrite ? c.opacidadeAlvo : 1)) > 0.002 ||
        Math.abs(c.destaque.value - c.destaqueAlvo) > 0.002 ||
        Math.abs(c.material.emissiveIntensity - (c.brilhoAlvo + (sobrevoo === c.id && !ativa ? 0.1 : 0))) > 0.002
    );

  let quadro = 0;
  const desenhar = () => {
    quadro = requestAnimationFrame(desenhar);
    if (!visivel) return;

    // Fase de leitura: primeiro o que consulta layout, depois o que escreve.
    medirProgresso();
    if (!forcar && !emMovimento()) return;
    forcar = false;

    // Todas as suavizações do arquivo moram aqui: um alvo, e o valor
    // caminhando até ele a cada frame.
    progresso = lerp(progresso, progressoAlvo, 0.12);
    corte = lerp(corte, corteAlvo, 0.075);
    if (Math.abs(corte - corteAlvo) < 0.001) corte = corteAlvo;
    if (soltando) {
      manual.y = lerp(manual.y, 0, 0.06);
      manual.x = lerp(manual.x, 0, 0.06);
      if (Math.abs(manual.y) < 0.001 && Math.abs(manual.x) < 0.001) {
        manual.y = manual.x = 0;
        soltando = false;
      }
    }

    // Sobrevoo: um raio, só quando o mouse andou, e no máximo a cada 60ms.
    const agora = performance.now();
    if (sobrevooPedido && agora - ultimoSobrevoo > 60) {
      ultimoSobrevoo = agora;
      sobrevoo = parteSob(sobrevooPedido.x, sobrevooPedido.y);
      sobrevooPedido = null;
      canvas.style.cursor = sobrevoo ? 'pointer' : '';
    }

    for (const c of camadas) {
      c.destaque.value = lerp(c.destaque.value, c.destaqueAlvo, 0.1);
      const brilho = c.brilhoAlvo + (sobrevoo === c.id && !ativa ? 0.1 : 0);
      c.material.emissiveIntensity = lerp(c.material.emissiveIntensity, brilho, 0.12);
      if (c.material.colorWrite) {
        const op = lerp(c.material.opacity, c.opacidadeAlvo, 0.09);
        c.material.opacity = Math.abs(op - c.opacidadeAlvo) < 0.002 ? c.opacidadeAlvo : op;
        // Transparente só enquanto precisa: material transparente vai para
        // outra fila de desenho e não escreve profundidade, e o fantasma
        // não pode esconder o que está atrás dele.
        c.material.transparent = c.material.opacity < 0.999;
        c.material.depthWrite = c.material.opacity > 0.5;
        // Apagada de vez, nem entra na fila de desenho.
        c.malha.visible = c.material.opacity > 0.001;
      }
    }

    // O corte: o plano atravessa o dente de frente para trás.
    const k = suave(corte);
    plano.constant = 0.65 * (1 - k);

    // Inteiro, o dente gira com o scroll. Cortado, ele vira de frente e
    // para — o corte só lê como prancha se estiver de frente. O arraste
    // continua valendo nos dois: girar o dente cortado "passa" o plano por
    // outras fatias, e solto ele volta.
    const giroScroll = (progresso - 0.5) * Math.PI * amplitude;
    const inclinacaoScroll = Math.sin(progresso * Math.PI) * 0.18;
    grupo.rotation.y = giroScroll * (1 - k) + manual.y;
    grupo.rotation.x = inclinacaoScroll * (1 - k) + manual.x;

    // A câmera chega perto da parte escolhida. Inteiro, ela aproxima no
    // meio do percurso — quando a prancha está sendo lida.
    const foco = FOCO[focoId];
    const zInteiro = 2.75 - Math.sin(progresso * Math.PI) * 0.35;
    camera.position.z = lerp(zInteiro, foco.z, k);
    grupo.position.set(base.x, base.y - foco.y * k, base.z);

    grupo.updateMatrixWorld();
    renderer.render(cena, camera);
    posicionarSobreposicao();
  };
  quadro = requestAnimationFrame(desenhar);

  // ------------------------------------------------------------------
  // contexto WebGL perdido: a imagem estática volta
  // ------------------------------------------------------------------
  const aoPerder = (e: Event) => {
    e.preventDefault();
    palco.removeAttribute('data-3d');
    canvas.hidden = true;
    hotspots.forEach((h) => (h.hidden = true));
    if (controles) controles.hidden = true;
    if (legenda) legenda.hidden = true;
    cancelAnimationFrame(quadro);
  };
  canvas.addEventListener('webglcontextlost', aoPerder);

  return {
    destruir() {
      cancelAnimationFrame(quadro);
      io.disconnect();
      ro.disconnect();
      obsCascata.disconnect();
      removeEventListener('scroll', invalidar);
      removeEventListener('resize', invalidar);
      canvas.removeEventListener('pointerdown', comecar);
      canvas.removeEventListener('pointermove', mover);
      canvas.removeEventListener('pointerup', soltar);
      canvas.removeEventListener('pointercancel', soltar);
      canvas.removeEventListener('pointerleave', sairDoCanvas);
      canvas.removeEventListener('webglcontextlost', aoPerder);
      fios.forEach((f) => f.remove());
      camadas.forEach((c) => c.material.dispose());
      geometriasExtras.forEach((g) => g.dispose());
      renderer.dispose();
      canvas.hidden = true;
      palco.removeAttribute('data-3d');
      prancha.removeAttribute('data-ativa');
      prancha.removeAttribute('data-3d-pronto');
      hotspots.forEach((h) => {
        h.setAttribute('aria-pressed', 'false');
        h.style.opacity = '';
        h.hidden = true;
      });
      if (controles) controles.hidden = true;
      if (legenda) legenda.hidden = true;
      itens.forEach((it) => it.removeAttribute('data-ativa'));
    },
  };
}
