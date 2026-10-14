import type { ImageMetadata } from 'astro';

/**
 * As imagens do Google Flow, já recortadas por `npm run imagem`.
 *
 * Moram em `src/assets/flow/` e não em `public/` porque o `<Picture>` do
 * Astro precisa importá-las para gerar WebP e AVIF em várias larguras. Em
 * `public/` elas iriam para o deploy como estão.
 *
 * O glob é resolvido no build. Nome que não existe derruba o build com o
 * nome do arquivo na mensagem, em vez de publicar uma página com imagem
 * quebrada.
 */
const arquivos = import.meta.glob<{ default: ImageMetadata }>('../assets/flow/*.jpg', {
  eager: true,
});

export function imagemFlow(nome: string): ImageMetadata {
  const modulo = arquivos[`../assets/flow/${nome}.jpg`];
  if (!modulo) {
    throw new Error(
      `imagem não encontrada: src/assets/flow/${nome}.jpg. ` +
        `Ponha a original em _origem/imagem-flow/ e rode \`npm run imagem\`.`
    );
  }
  return modulo.default;
}
