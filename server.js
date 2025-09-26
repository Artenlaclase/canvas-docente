// Universal startup for Astro (Node adapter, mode: 'standalone').
// - Works as Startup file in cPanel (Node.js App)
// - Compatible with both ESM and CommonJS runtimes via dynamic import()
// - Respects process.env.PORT provided by the hosting platform

process.on('unhandledRejection', (err) => {
	console.error('[server] UnhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
	console.error('[server] UncaughtException:', err);
});

(async () => {
	try {
		const entry = await import('./dist/server/entry.mjs');
		// In standalone mode, importing the entry starts the server and listens on process.env.PORT.
		// Some adapter variants may export a start() API; support it just in case.
		if (entry && typeof entry.start === 'function') {
			const port = Number(process.env.PORT) || 3000;
			await entry.start({ port });
			console.log(`[server] Astro started via entry.start() on port ${port}`);
		} else {
			const portInfo = process.env.PORT ? `port ${process.env.PORT}` : 'default port';
			console.log(`[server] Astro entry imported; server should be listening on ${portInfo}.`);
		}
	} catch (e) {
		console.error('[server] Failed to start Astro app:', e);
		process.exit(1);
	}
})();
