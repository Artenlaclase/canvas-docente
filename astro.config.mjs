// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [tailwind({ applyBaseStyles: true }), mdx()],
	vite: {
		assetsInclude: ['**/*.heic', '**/*.HEIC', '**/*.heif', '**/*.HEIF'],
	},
  // Allow prefixing static asset URLs when the app is mounted under a subpath (e.g., /blog)
  // Set PUBLIC_ASSETS_PREFIX="/blog" in the hosting environment if the Node app is mapped at /blog
  build: {
    assetsPrefix: process.env.PUBLIC_ASSETS_PREFIX || process.env.ASSETS_PREFIX || '',
  },
});
