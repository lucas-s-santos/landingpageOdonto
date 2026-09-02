# Material de origem

Não vai para o build. O Astro só empacota `src/` e `public/`.

- `dente-molar.obj` / `.mtl` — malha original do molar
- `dente-molar.glb` — export sem compressão Draco (o de produção, com Draco,
  está em `public/model/dente-molar-draco.glb`, 26 KB)
- `dente-3d.html` — teste solto de visualização, anterior ao projeto
- `*.mp4` — renders brutos. O `water-droplet-sliding` é o que vira poster da
  seção 3 (ver `HANDOFF.md`, parte 4.2)

Os três MP4 foram renomeados na mudança: os nomes originais tinham reticências
Unicode e maiúsculas, que dão problema em CI Linux.
