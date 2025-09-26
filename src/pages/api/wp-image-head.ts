export const prerender = false;

// Simple diagnostic endpoint to probe an image URL (HEAD, fallback GET) from the server side.
// Usage: /api/wp-image-head?url=https://...
export async function GET({ url }: { url: URL }) {
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing ?url=' }, null, 2), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  let headStatus: number | undefined; let headHeaders: Record<string, string> = {}; let headError: string | undefined;
  let getStatus: number | undefined; let getHeaders: Record<string, string> = {}; let getSample: string | undefined; let getError: string | undefined;

  try {
    const headRes = await fetch(target, { method: 'HEAD' });
    headStatus = headRes.status;
    headRes.headers.forEach((v, k) => { headHeaders[k] = v; });
    if (!headRes.ok) headError = `Non-OK HEAD: ${headRes.status}`;
  } catch (e: any) {
    headError = e?.message || String(e);
  }

  if (!headStatus || headStatus >= 400) {
    try {
      const getRes = await fetch(target, { method: 'GET' });
      getStatus = getRes.status;
      getRes.headers.forEach((v, k) => { getHeaders[k] = v; });
      if (getRes.ok) {
        try {
          const buf = await getRes.arrayBuffer();
          const bytes = new Uint8Array(buf).slice(0, 32);
          getSample = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
        } catch {}
      } else {
        getError = `Non-OK GET: ${getRes.status}`;
      }
    } catch (e: any) {
      getError = e?.message || String(e);
    }
  }

  return new Response(JSON.stringify({
    target,
    head: { status: headStatus, headers: headHeaders, error: headError },
    get: { status: getStatus, headers: getHeaders, sampleFirstBytesHex: getSample, error: getError }
  }, null, 2), { headers: { 'content-type': 'application/json' } });
}
