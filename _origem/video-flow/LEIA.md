# Vídeos gerados no Google Flow — material bruto

Saída direta do Flow: 1920×1080, 8,000 s, 24 fps, H.264 **com faixa de áudio
AAC**. Não vão para o build. O que a página serve sai daqui por
`scripts/preparar-videos.mjs`.

## Escolhidos

| arquivo | vai para | por quê |
|---|---|---|
| `hero-molar.mp4` | abertura | a gota está mais presente que na alternativa |
| `esmalte.mp4` | faixa entre Tratamentos e Quem atende | substitui o creme; luz melhor e menos manchas que a alternativa |
| `instrumental-selado.mp4` | seção 6, parágrafo de esterilização | fundo limpo com a parede verde |
| `sala-vazia.mp4` | seção 6, título "Onde você vai sentar" | cadeira desocupada responde o título ao pé da letra |

## Não usados, e o motivo

| arquivo | motivo |
|---|---|
| `nao-usados/instrumental-com-tripe.mp4` | **tripé de câmera visível ao fundo.** Denuncia cena montada e não existe em consultório |
| `nao-usados/esmalte-alternativa.mp4` | mais manchas escuras nos sulcos, luz mais chapada |
| `nao-usados/hero-alternativa.mp4` | fecha o loop um pouco melhor (7,0 contra 9,2), mas a gota aparece menos |

O Flow gerou a sala **duplicada** — os dois arquivos tinham o mesmo MD5.
Só um foi guardado.

## Medições que motivaram a troca

Desvio quente (R−B) na média do quadro. O fundo da página, `--osso #EFEDE6`,
é +9.

```
assets antigos   +29 a +32   →  precisavam de filtro de correção no CSS
assets novos     −16 a +18   →  dentro do alvo, filtro removido
```
