import type { APIRoute } from 'astro';
import { getWpBase, getWpPostById } from '../../utils/wp';

function buildAlternativeBases(base?: string): string[] {
  if (!base) return [];
  const clean = base.replace(/\/$/, '');
  const out = new Set<string>();
  out.add(clean);
  try {
    const u = new URL(clean);
    if (u.host.startsWith('www.')) {
      out.add(clean.replace('//www.', '//'));
    }
    if (/^www\.?api\./i.test(u.host)) {
      out.add(clean.replace('//www.api.', '//api.'));
    }
    if (/^api\./i.test(u.host)) {
      out.add(clean.replace('//api.', '//'));
    }
  } catch {/* ignore */}
  return Array.from(out);
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const idRaw = url.searchParams.get('id');
  if (!idRaw || !/^\d+$/.test(idRaw)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid id param' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const id = Number(idRaw);
  const base = getWpBase();
  const bases = buildAlternativeBases(base);
  const results: any[] = [];
  for (const b of bases) {
    const started = Date.now();
    let status = 0; let ok = false; let error: string | undefined; let endpoint: string = '';
    try {
      endpoint = b.includes('rest_route=')
        ? `${b}/posts/${id}?_embed=1`
        : `${b}/posts/${id}?_embed=1`;
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      status = res.status; ok = res.ok;
      if (!res.ok) {
        try { error = (await res.text()).slice(0, 180); } catch {}
      }
    } catch (e: any) {
      error = e?.message || String(e);
    }
    results.push({ base: b, endpoint, status, ok, ms: Date.now() - started, error });
  }
  let normalized: any = undefined;
  try {
    const p = await getWpPostById(id);
    if (p) {
      normalized = { slug: p.slug, title: p.data.title, cover: p.data.cover };
    }
  } catch {/* ignore */}
  return new Response(JSON.stringify({ id, baseOriginal: base, attempts: results, resolved: normalized }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
