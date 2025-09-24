import { getWpBase } from "../../utils/wp";

export async function GET() {
  try {
    const base = getWpBase();
    if (!base) {
      return new Response(JSON.stringify({ error: 'WP_API_BASE no definido' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    const url = base.includes('rest_route=')
      ? `${base}/posts&status=publish&_embed=1&per_page=3`
      : `${base}/posts?status=publish&_embed=1&per_page=3`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const contentType = res.headers.get('content-type');
    const cors = res.headers.get('access-control-allow-origin');
    let count: number | undefined = undefined;
    try {
      const data = await res.json();
      count = Array.isArray(data) ? data.length : undefined;
    } catch {}

    return new Response(
      JSON.stringify({ url, status: res.status, contentType, cors, count }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
