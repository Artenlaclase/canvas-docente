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
});
