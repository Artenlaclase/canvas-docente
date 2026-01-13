// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Prefer explicit environment variable so it can differ per environment (dev/staging/prod)
// SITE_URL or PUBLIC_SITE_URL (without trailing slash). Fallback to production domain as default.
// This is used by Astro as `Astro.site` so our layout can build absolute canonical/OG URLs reliably.
const site = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://artenlaclase.cl';

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [
		tailwind({ applyBaseStyles: true }), 
		mdx(),
		sitemap({
			// Cambios dinámicas generadas en server-side rendering
			changefreq: 'weekly',
			priority: 0.7,
			// Excluir rutas dinámicas de WordPress y rutas internas
			filter: (page) => {
				// Excluir rutas API
				if (page.includes('/api/')) return false;
				// Excluir rutas de health check
				if (page.includes('_health')) return false;
				// Excluir rutas de debugging
				if (page.includes('/env-debug')) return false;
				// Excluir rutas de detección de WordPress
				if (page.includes('/wp-')) return false;
				return true;
			},
			serialize: (item) => {
				// Prioridades personalizadas
				if (item.url.includes('/blog/')) {
					return {
						...item,
						changefreq: 'daily',
						priority: 0.8,
					};
				}
				if (item.url.includes('/galeria/')) {
					return {
						...item,
						changefreq: 'monthly',
						priority: 0.9,
					};
				}
				if (item.url === site + '/' || item.url === site) {
					return {
						...item,
						changefreq: 'daily',
						priority: 1.0,
					};
				}
				return item;
			},
		}),
	],
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
