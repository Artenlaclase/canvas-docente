export const prerender = false;

// Whitelist variables we care about and mask sensitive ones
const SENSITIVE_KEYS = [/PASSWORD/i, /SECRET/i, /KEY/i, /TOKEN/i, /^GMAIL_APP_PASSWORD$/i];

export async function GET() {
  const env: Record<string, string> = {};
  const source = (typeof process !== 'undefined' && process.env) ? process.env : {} as any;
  for (const k of Object.keys(source)) {
    if (/^WP_|^PUBLIC_WP_|^PUBLIC_IMAGE_PROXY|^NODE_ENV$|^PORT$|^PUBLIC_ASSETS_PREFIX$|^PUBLIC_WP_MEDIA_ROOT$|^GMAIL_USER$/i.test(k) || SENSITIVE_KEYS.some(rx => rx.test(k))) {
      const val = source[k] ?? '';
      env[k] = SENSITIVE_KEYS.some(rx => rx.test(k)) ? '***masked***' : val;
    }
  }
  return new Response(JSON.stringify({ ok: true, env }), { headers: { 'content-type': 'application/json' } });
}
