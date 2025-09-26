// Minimal startup for Astro (Node adapter, mode: 'standalone').
// Avoid creating a second HTTP server when the standalone entry already starts one.

process.on('unhandledRejection', (err) => {
	console.error('[server] UnhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
	console.error('[server] UncaughtException:', err);
});

(async () => {
	try {
		const entry = await import('./dist/server/entry.mjs');
		if (entry && typeof entry.start === 'function') {
			const port = Number(process.env.PORT) || 3000;
			await entry.start({ port, host: '0.0.0.0' });
			console.log(`[server] Astro started via entry.start() on port ${port}`);
		} else {
			// Standalone build usually auto-starts on import
			console.log('[server] Entry imported (standalone auto-start).');
		}
	} catch (e) {
		console.error('[server] Failed to start Astro app:', e);
		process.exit(1);
	}
})();
