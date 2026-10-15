// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  build: {
    // O CSS da página inteira dá ~6 KB comprimido. Como <link> ele é uma
    // requisição bloqueante a mais antes do primeiro paint — o Lighthouse
    // media 320 ms de atraso. Embutido no HTML, some a ida e volta.
    inlineStylesheets: 'always',
  },

  // O domínio da demo no ar. Usado pelo canonical, pela imagem de prévia do
  // link (og:image) e pelo JSON-LD Dentist. Era clinicademo.calmdev.com.br,
  // que nunca foi criado: a prévia no WhatsApp saía sem imagem.
  // [PREENCHER] trocar pelo domínio da clínica quando virar site de cliente.
  site: 'https://colo-odonto.vercel.app',

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Three.js só entra por import() dinâmico na seção 3.
      // Deixar o chunk separado e nomeado ajuda a conferir no build
      // que ele não caiu no bundle inicial.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
          },
        },
      },
    },
  },
});
