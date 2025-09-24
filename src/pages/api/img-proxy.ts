import type { APIRoute } from 'astro';

// Simple image proxy to bypass hotlink/CORS issues.
// Enable by setting PUBLIC_IMAGE_PROXY=on (or true/1). Optionally, restrict allowed hosts via PUBLIC_IMAGE_PROXY_ALLOW.
// PUBLIC_IMAGE_PROXY_ALLOW: comma-separated hostnames (no scheme), e.g. "artenlaclase.cl,cdn.example.com"

function isAllowed(url: URL, allowList: string | undefined): boolean {
  if (!allowList) return true; // if not set, allow all (dev convenience)
  const allowed = allowList.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const host = url.host.toLowerCase();
  return allowed.some(a => host === a || host.endsWith('.' + a));
}

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  // eslint-disable-next-line no-undef
  const envAny: any = import.meta.env as any;
  const proxyEnabled = ((envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString().toLowerCase());
  if (!(proxyEnabled === 'on' || proxyEnabled === 'true' || proxyEnabled === '1')) {
    return new Response('Proxy disabled', { status: 403 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  const allowList = (envAny.PUBLIC_IMAGE_PROXY_ALLOW || envAny.IMAGE_PROXY_ALLOW || '').toString();
  if (!isAllowed(url, allowList)) return new Response('Host not allowed', { status: 403 });

  try {
    const upstream = await fetch(url.toString(), {
      // Forward minimal headers; avoid passing cookies
      headers: {
        'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
        'User-Agent': 'Astro-Image-Proxy/1.0'
      },
    });
    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const resp = new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache a bit in the browser to reduce repeated hits during dev
        'Cache-Control': 'public, max-age=300',
      },
    });
    return resp;
  } catch (e: any) {
    return new Response('Proxy error: ' + (e?.message || 'unknown'), { status: 500 });
  }
};
