import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { editorDevApi } from './scripts/editor-dev-api.mjs';

export default defineConfig({
  site: 'https://healthrenovation.com.au',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/thanks/') && !page.includes('/editor/') }),
  ],
  vite: { plugins: [editorDevApi()] },
});
