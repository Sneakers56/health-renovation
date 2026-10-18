import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://healthrenovation.com.au',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/thanks/') && !page.includes('/editor/') }),
  ],
});
