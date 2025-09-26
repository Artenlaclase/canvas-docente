// app.cjs - CommonJS wrapper for Passenger/Apache
try {
  // Load environment variables if .env is present
  require('dotenv').config();
} catch {}

(async () => {
  try {
    await import('./server.js');
    console.log('✅ Passenger wrapper cargado - App Astro iniciándose...');
  } catch (e) {
    console.error('[app.cjs] Error cargando server.js:', e);
    process.exit(1);
  }
})();
