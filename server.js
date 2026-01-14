// Startup para Astro con adapter node (standalone) bajo Passenger/Apache.
// Objetivo: asegurarnos de que use el puerto entregado por el entorno (process.env.PORT)
// en lugar del default 4321 que toma el standalone si no se define.

(async () => {
	try {
		const dotenv = await import('dotenv');
		dotenv.config();
	} catch (e) {
		console.warn('[server] dotenv not available (normal in production):', e?.message);
	}

	process.on('unhandledRejection', (err) => {
		console.error('[server] UnhandledRejection:', err);
	});
	process.on('uncaughtException', (err) => {
		console.error('[server] UncaughtException:', err);
	});

	try {
		// Forzar PORT antes del import para que el standalone lo respete si auto-arranca.
		const desiredPort = process.env.PORT || '3000';
		process.env.PORT = desiredPort; // asegurar disponible en tiempo de import
		const entry = await import('./dist/server/entry.mjs');
		if (entry && typeof entry.start === 'function') {
			// Algunas versiones exponen start; si existe la usamos explícitamente.
			await entry.start({ port: Number(desiredPort), host: '0.0.0.0' });
			console.log(`[server] Astro started via entry.start() on port ${desiredPort}`);
		} else {
			console.log(`[server] Entry imported (standalone auto-start). Expected port ${desiredPort}`);
		}

		// ---------------------------------------------------------------
		// Verificación de archivos estáticos críticos (logo / favicon)
		// Útil para detectar despliegues incompletos donde dist/client no se copió entero.
		// ---------------------------------------------------------------
		try {
			const { existsSync } = await import('node:fs');
			const { join } = await import('node:path');
			const logoPath = join(process.cwd(), 'dist', 'client', 'logo1.png');
			const faviconPath = join(process.cwd(), 'dist', 'client', 'favicon.svg');
			if (!existsSync(logoPath)) {
				console.warn('[assets] logo1.png NO encontrado en dist/client. Probable despliegue parcial.');
			} else {
				console.log('[assets] logo1.png OK en dist/client');
			}
			if (!existsSync(faviconPath)) {
				console.warn('[assets] favicon.svg NO encontrado en dist/client.');
			} else {
				console.log('[assets] favicon.svg OK en dist/client');
			}
		} catch (e) {
			console.warn('[assets] Error comprobando archivos estáticos:', e?.message || e);
		}

		// ---------------------------------------------------------------
		// Post-start lightweight probe to WordPress API (non-blocking)
		// Objetivo: detectar pronto si la API WP está inaccesible o devuelve HTML
		// y registrar un mensaje claro (antes de la primera petición real SSR).
		// No usamos los helpers TS (safeListWpPosts) porque en runtime sólo
		// tenemos JS transpilado dentro del bundle; hacemos una llamada directa.
		// ---------------------------------------------------------------
		setTimeout(async () => {
			try {
				const rawBase = process.env.WP_API_BASE || process.env.PUBLIC_WP_API_BASE;
				if (!rawBase) {
					console.log('[probe] WP_API_BASE no definido. Se omite probe inicial.');
					return;
				}
				let base = rawBase.trim().replace(/\/$/, '');
				if (!/rest_route=\/wp\/v2/.test(base) && !/\/wp-json\//.test(base)) {
					base = base + '/wp-json/wp/v2';
				}
				const url = base.includes('rest_route=')
					? `${base}/posts&per_page=1&_fields=id,slug`
					: `${base}/posts?per_page=1&_fields=id,slug`;
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 5000);
				let res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: { 'Accept': 'application/json' } }).catch(() => undefined);
				if (!res || !res.ok || !/json/i.test(res.headers.get('content-type') || '')) {
					// Fallback a GET (algunos hosts no permiten HEAD)
					try { res = await fetch(url, { method: 'GET', signal: controller.signal, headers: { 'Accept': 'application/json' } }); } catch (e) { res = undefined; }
				}
				clearTimeout(timeout);
				if (!res) {
					console.warn('[probe] Fallo inicial: sin respuesta de WP. Los wrappers safe aplicarán backoff en el primer uso.');
					return;
				}
				if (!res.ok) {
					console.warn(`[probe] WP respondió status ${res.status}. Los listados quedarán vacíos hasta que responda OK.`);
					return;
				}
				const ct = res.headers.get('content-type') || '';
				if (!/application\/json/i.test(ct)) {
					console.warn(`[probe] Content-Type inesperado (${ct}). Es posible que un firewall devuelva HTML. Verifica la URL base: ${base}`);
					return;
				}
				console.log('[probe] WordPress API accesible (respuesta básica correcta).');
			} catch (e) {
				const msg = e && e.name === 'AbortError' ? 'timeout 5s' : (e?.message || e);
				console.warn('[probe] Error ejecutando probe WP:', msg);
			}
		}, 3000); // pequeño retraso para no competir con el arranque
	} catch (e) {
		console.error('[server] Failed to start Astro app:', e);
		process.exit(1);
	}
})();
