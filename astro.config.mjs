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

  // [PREENCHER] trocar pelo domínio real antes do deploy.
  // Usado pelo canonical e pelo JSON-LD Dentist.
  site: 'https://clinicademo.calmdev.com.br',

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
