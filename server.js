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
		// Prefer start() if available. If not, construct a small HTTP wrapper that performs pre-routing redirects.
		if (entry && typeof entry.start === 'function') {
			const port = Number(process.env.PORT) || 3000;
			await entry.start({ port });
			console.log(`[server] Astro started via entry.start() on port ${port}`);
		} else if (entry && typeof entry.handler === 'function') {
			const http = await import('node:http');
			const handler = entry.handler;
			const server = http.createServer(async (req, res) => {
				try {
					const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
					// Canonicalize WordPress-style params for /blog/*
					if (url.pathname.startsWith('/blog/') && (url.searchParams.has('id') || url.searchParams.has('p') || url.searchParams.has('page_id'))) {
						// Strip the WP id-like params to avoid router issues; the Astro middleware will try to resolve id->slug.
						url.searchParams.delete('id');
						url.searchParams.delete('p');
						url.searchParams.delete('page_id');
						const location = url.toString();
						if ((req.url || '') !== location) {
							res.statusCode = 302;
							res.setHeader('Location', location);
							return res.end();
						}
					}
					await handler(req, res);
				} catch (err) {
					console.error('[server] handler error:', err);
					res.statusCode = 500;
					res.end('Internal Server Error');
				}
			});
			const port = Number(process.env.PORT) || 3000;
			server.listen(port, () => console.log(`[server] HTTP wrapper listening on port ${port}`));
		} else {
			const portInfo = process.env.PORT ? `port ${process.env.PORT}` : 'default port';
			console.log(`[server] Astro entry imported; server should be listening on ${portInfo}.`);
		}
	} catch (e) {
		console.error('[server] Failed to start Astro app:', e);
		process.exit(1);
	}
})();
