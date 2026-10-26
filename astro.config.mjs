// @ts-check
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://p3ix.github.io',
  integrations: [
    // expressiveCode tiene que ir antes que mdx para procesar los bloques de código de MDX.
    // Su configuración vive en ec.config.mjs.
    expressiveCode(),
    mdx(),
    // /kit/ es una página de trabajo: fuera del sitemap (y con noindex).
    sitemap({ filter: (page) => !page.includes('/kit/') }),
    // Último: indexa el HTML ya generado. Solo entra lo marcado con data-pagefind-body.
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
