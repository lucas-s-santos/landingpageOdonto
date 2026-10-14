"""
Gera a marca do produto Colo, da CalmDev, em vetor.

    python scripts/marca.py

Precisa de: pip install fonttools brotli   (brotli é o que lê .woff2)

Saída em `marca/`:

    colo-assinatura.svg         a palavra, em eucalipto, fundo transparente
    colo-assinatura-clara.svg   a palavra em osso, para fundo escuro
    colo-simbolo.svg            o símbolo: ponto e fio em osso sobre eucalipto
    colo-simbolo-claro.svg      o mesmo invertido, para fundo claro

DE ONDE VEIO: das três imagens geradas no Google Flow (em
`_origem/logo-flow/`). Nenhuma servia como arquivo final — a palavra tinha
uma cópia fantasma apagada por cima, um dos símbolos tinha o fio entrando no
círculo como uma barra escura, e imagem de gerador não é vetor: não serve
para registro, gráfica nem favicon nítido. O conceito ficou, o desenho foi
refeito aqui.

A PALAVRA usa as curvas da Cabinet Grotesk Medium, a fonte de títulos da
página. A licença (ITF Free Font License, cópia em public/fonts/) permite
criar logo com ela e registrar como marca — seção 01, parágrafo 6. O "o"
final vira o ponto da prancha anatômica, com o fio saindo dele: o mesmo
gesto do hotspot da seção 3 e do favicon.
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "marca"
SAIDA.mkdir(exist_ok=True)

EUCALIPTO = "#33473f"
OSSO = "#efede6"

fonte = TTFont(RAIZ / "public/fonts/CabinetGrotesk-Medium.woff2")
glifos = fonte.getGlyphSet()
cmap = fonte.getBestCmap()
upm = fonte["head"].unitsPerEm


def limites(nome):
    pen = BoundsPen(glifos)
    glifos[nome].draw(pen)
    return pen.bounds  # xMin, yMin, xMax, yMax, em unidades da fonte, y para cima


def assinatura(cor):
    """'col' em curvas + o ponto no lugar do 'o' + o fio."""
    partes = []
    x = 0
    # Aperto entre letras igual ao do título da página (-0,022em), um pouco
    # mais fechado: marca lê como bloco, título lê como frase.
    aperto = -0.03 * upm
    for letra in "col":
        nome = cmap[ord(letra)]
        pen = SVGPathPen(glifos)
        # SVG tem y para baixo; a fonte, para cima. Espelha e sobe pela
        # altura do ascendente, para tudo ficar com y positivo.
        glifos[nome].draw(TransformPen(pen, (1, 0, 0, -1, x, upm)))
        partes.append(f'<path d="{pen.getCommands()}"/>')
        x += glifos[nome].width + aperto

    # O ponto tem o tamanho do 'o' de verdade: mesma altura, mesmo centro,
    # assentado na linha de base como a letra estaria.
    oxmin, oymin, oxmax, oymax = limites(cmap[ord("o")])
    # Um pouco menor que o 'o': círculo cheio pesa mais que letra vazada, e
    # com o tamanho exato ele parecia maior que o 'o' do lado.
    diametro = (oymax - oymin) * 0.95
    raio = diametro / 2
    # O ponto começa onde o 'o' começaria, com um respiro a mais: encostado
    # no 'l' os dois viravam um bloco só.
    cx = x + oxmin + raio + 0.025 * upm
    cy = upm - (oymin + oymax) / 2
    partes.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{raio:.1f}"/>')

    # O fio: fino como o da prancha, comprido como um rótulo pede.
    espessura = 0.085 * diametro
    comprimento = 1.45 * diametro
    fx = cx + raio - espessura  # encosta no círculo, sem fresta
    partes.append(
        f'<rect x="{fx:.1f}" y="{cy - espessura / 2:.1f}" '
        f'width="{comprimento:.1f}" height="{espessura:.1f}"/>'
    )

    # Caixa justa em volta do desenho: altura do 'l' e da linha de base.
    lxmin, lymin, lxmax, lymax = limites(cmap[ord("l")])
    topo = upm - lymax
    base = upm - min(lymin, oymin)
    largura = fx + comprimento
    altura = base - topo
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {topo:.1f} {largura:.1f} {altura:.1f}" '
        f'role="img" aria-label="Colo">\n'
        f'  <g fill="{cor}">\n    ' + "\n    ".join(partes) + "\n  </g>\n</svg>\n"
    )


def simbolo(fundo, frente):
    """Ponto e fio num quadrado de raio zero. Proporções da logo2 do Flow."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="Colo">
  <rect width="640" height="640" fill="{fundo}"/>
  <circle cx="232" cy="320" r="88" fill="{frente}"/>
  <rect x="312" y="313" width="236" height="14" fill="{frente}"/>
</svg>
"""


(SAIDA / "colo-assinatura.svg").write_text(assinatura(EUCALIPTO), encoding="utf-8")
(SAIDA / "colo-assinatura-clara.svg").write_text(assinatura(OSSO), encoding="utf-8")
(SAIDA / "colo-simbolo.svg").write_text(simbolo(EUCALIPTO, OSSO), encoding="utf-8")
(SAIDA / "colo-simbolo-claro.svg").write_text(simbolo(OSSO, EUCALIPTO), encoding="utf-8")
print("marca/: colo-assinatura(.svg, -clara.svg), colo-simbolo(.svg, -claro.svg)")
