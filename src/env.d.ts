import type Lenis from 'lenis';

declare global {
  interface Window {
    /**
     * A instância do scroll suave, quando existe (só no desktop, com
     * movimento permitido). Criada em src/scripts/movimento.ts. Quem precisa
     * rolar a página por código — o menu de dúvidas — passa por ela, para
     * não disputar o scroll com o Lenis.
     */
    __lenis?: Lenis;
  }
}

export {};
