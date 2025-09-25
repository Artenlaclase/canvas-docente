// Minimal wrapper to start Astro's standalone Node server on cPanel (Node.js App)
// cPanel typically asks for a startup file (e.g., server.js). This file simply imports Astro's built entry.
// Ensure you run `npm run build` locally and upload the `dist/` folder along with this file.

import './dist/server/entry.mjs';
