// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

// https://astro.build/config
// Prefer explicit environment variable so it can differ per environment (dev/staging/prod)
// SITE_URL or PUBLIC_SITE_URL (without trailing slash). Fallback to production domain as default.
// This is used by Astro as `Astro.site` so our layout can build absolute canonical/OG URLs reliably.
const site = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://artenlaclase.cl';

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [tailwind({ applyBaseStyles: true }), mdx()],
	site, // <-- añade la URL base del sitio (sin slash final)
	vite: {
		assetsInclude: ['**/*.heic', '**/*.HEIC', '**/*.heif', '**/*.HEIF'],
	},
  // Allow prefixing static asset URLs when the app is mounted under a subpath (e.g., /blog)
  // Set PUBLIC_ASSETS_PREFIX="/blog" in the hosting environment if the Node app is mapped at /blog
  build: {
    assetsPrefix: process.env.PUBLIC_ASSETS_PREFIX || process.env.ASSETS_PREFIX || '',
  },
});
