import type { APIRoute } from 'astro';
import { createHmac } from 'node:crypto';

// Image proxy con mejoras de caché y seguridad:
// - Activación vía PUBLIC_IMAGE_PROXY=on|true|1
// - Restricción opcional por hosts PUBLIC_IMAGE_PROXY_ALLOW (coma o pipe)
// - Firma HMAC opcional (set IMAGE_PROXY_SECRET y añade &sig=<hex>)
// - Rate limiting en memoria (IMAGE_PROXY_RATE, IMAGE_PROXY_WINDOW_MS)
// - Solo métodos GET/HEAD
// - Validación de protocolo (http/https) y bloqueo de url anidada
// - Límite de tamaño (10MB) y verificación de Content-Type image/*
// - Cache-Control largo + soporte ETag / Last-Modified / 304

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ONE_DAY = 86400; // seg

function chooseCacheControl(u: URL): string {
  // Si parece una variante de WP con sufijo -WxH o incluye 'scaled', se asume inmutable a corto plazo
  const file = u.pathname.split('/').pop() || '';
  const likelySized = /-\d+x\d+\.(jpe?g|png|webp|avif|gif)$/i.test(file) || /scaled\.(jpe?g|png|webp|avif)$/i.test(file);
  if (likelySized) {
    return `public, max-age=${ONE_DAY}, stale-while-revalidate=${7 * ONE_DAY}, immutable`;
  }
  return `public, max-age=${ONE_DAY}, stale-while-revalidate=${7 * ONE_DAY}`;
}

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  // Accept both comma and pipe separators to match comments examples
  return raw.split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

function isAllowed(url: URL, allowList: string | undefined): boolean {
  if (!allowList) return true; // no restriction
  const allowed = parseAllowlist(allowList);
  if (!allowed.length) return true;
  const host = url.host.toLowerCase();
  return allowed.some(a => host === a || host.endsWith('.' + a));
}

async function handle(request: Request, headOnly = false): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  // eslint-disable-next-line no-undef
  const envAny: any = import.meta.env as any;
  const proxyEnabled = ((envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString().toLowerCase());
  const enabled = (proxyEnabled === 'on' || proxyEnabled === 'true' || proxyEnabled === '1');
  if (!enabled) {
    if (import.meta.env.DEV) console.warn('[img-proxy] 403: disabled. Set PUBLIC_IMAGE_PROXY=on to enable.');
    return new Response('Proxy disabled', { status: 403 });
  }

  // Sanitizar target: impedir nested url=...&url=...
  if (/url=.+url=/i.test(request.url)) {
    return new Response('Nested url parameters blocked', { status: 400 });
  }

  let url: URL;
  try { url = new URL(target); } catch { return new Response('Invalid url', { status: 400 }); }
  if (!/^https?:$/i.test(url.protocol)) {
    return new Response('Protocol not allowed', { status: 400 });
  }

  // Allowlist check first (before signature) - more permissive for known hosts
  const allowList = (envAny.PUBLIC_IMAGE_PROXY_ALLOW || envAny.IMAGE_PROXY_ALLOW || '').toString();
  const isAllowlisted = isAllowed(url, allowList);
  
  // Firma HMAC opcional para evitar uso como open-proxy
  // Server-only secret: IMAGE_PROXY_SECRET (no PUBLIC_)
  // Firma = hex(hmacSHA256(secret, targetURL))
  // Enviar como parámetro &sig=<hex>
  // If host is allowlisted, signature is optional (for easier integration)
  const secret = (typeof process !== 'undefined' && process.env?.IMAGE_PROXY_SECRET) || '';
  if (secret && !isAllowlisted) {
    // Require signature for non-allowlisted hosts
    const sig = searchParams.get('sig');
    if (!sig) return new Response('Missing signature', { status: 403 });
    try {
      const expected = createHmac('sha256', secret).update(target).digest('hex');
      if (sig.toLowerCase() !== expected) return new Response('Invalid signature', { status: 403 });
    } catch {
      return new Response('Signature check error', { status: 500 });
    }
  }

  if (!isAllowlisted && !allowList) {
    // No allowlist and not allowlisted = deny
    if (import.meta.env.DEV) console.warn('[img-proxy] 403: host not allowed', { host: url.host, allowList });
    return new Response('Host not allowed', { status: 403 });
  }

  try {
    // Forward conditional headers for cache validation
    const forwardHeaders: Record<string, string> = {
      'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Referer': url.origin + '/',
    };
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch) forwardHeaders['If-None-Match'] = ifNoneMatch;
    const ifModifiedSince = request.headers.get('if-modified-since');
    if (ifModifiedSince) forwardHeaders['If-Modified-Since'] = ifModifiedSince;

  // Rate limiting simple en memoria (por IP extraída de X-Forwarded-For / fallback 'unknown')
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('cf-connecting-ip') || 'unknown';
  rateLimit(ip);

  const upstream = await fetch(url.toString(), { method: 'GET', headers: forwardHeaders });

    if (upstream.status === 304) {
      // Propagar 304 con cabeceras relevantes
      const headers = new Headers();
      const et = upstream.headers.get('etag'); if (et) headers.set('ETag', et);
      const lm = upstream.headers.get('last-modified'); if (lm) headers.set('Last-Modified', lm);
      headers.set('Cache-Control', chooseCacheControl(url));
      return new Response(null, { status: 304, headers });
    }

    if (!upstream.ok) {
      if (import.meta.env.DEV) console.warn('[img-proxy] upstream not OK', upstream.status, url.toString());
      return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
    }

    // Limit size (buffer body)
    const arrayBuf = await upstream.arrayBuffer();
    if (arrayBuf.byteLength > MAX_BYTES) {
      if (import.meta.env.DEV) console.warn('[img-proxy] file too large', arrayBuf.byteLength, url.toString());
      return new Response('File too large', { status: 413 });
    }

    const upstreamCT = upstream.headers.get('content-type') || '';
    if (!/^image\//i.test(upstreamCT)) {
      return new Response('Unsupported content-type', { status: 415 });
    }

    const headers = new Headers();
    headers.set('Content-Type', upstreamCT || 'application/octet-stream');
    const etag = upstream.headers.get('etag'); if (etag) headers.set('ETag', etag);
    const lastMod = upstream.headers.get('last-modified'); if (lastMod) headers.set('Last-Modified', lastMod);
    headers.set('Cache-Control', chooseCacheControl(url));
    headers.set('Content-Length', String(arrayBuf.byteLength));
    headers.set('Vary', 'Accept');
    return new Response(headOnly ? null : arrayBuf, { status: 200, headers });
  } catch (e: any) {
    if (import.meta.env.DEV) console.error('[img-proxy] error', e?.message || e);
    return new Response('Proxy error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

// --- Rate limiting (in-memory) -------------------------------------------------
type Bucket = { count: number; reset: number };
const buckets: Map<string, Bucket> = new Map();
function rateLimit(ip: string) {
  const limit = parseInt((typeof process !== 'undefined' && process.env.IMAGE_PROXY_RATE) || '120', 10); // req
  const windowMs = parseInt((typeof process !== 'undefined' && process.env.IMAGE_PROXY_WINDOW_MS) || '300000', 10); // 5 min
  if (limit <= 0) return; // disabled
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(ip, b);
  }
  b.count++;
  if (b.count > limit) {
    const retrySec = Math.ceil((b.reset - now) / 1000);
    throw new Response('Rate limit exceeded', { status: 429, headers: { 'Retry-After': String(retrySec) } });
  }
}

export const GET: APIRoute = async (ctx) => {
  if (ctx.request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { 'Allow': 'GET, HEAD' } });
  return handle(ctx.request, false);
};

export const HEAD: APIRoute = async (ctx) => {
  return handle(ctx.request, true);
};
