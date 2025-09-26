export const prerender = false;

import { getWpBase, normalizePost, type WpRawPost } from '../../utils/wp';

// Local copy of the lightweight fetch (avoids importing private helpers)
async function fetchJson<T>(url: string): Promise<{ data?: T; status: number; contentType?: string; textSnippet?: string; error?: string }> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const ct = res.headers.get('content-type') || '';
    if (!/application\/json/i.test(ct)) {
      const txt = await res.text();
      return { status: res.status, contentType: ct, textSnippet: txt.slice(0, 300), error: 'Non JSON response' };
    }
    const json = await res.json();
    return { data: json as T, status: res.status, contentType: ct };
  } catch (e: any) {
    return { status: 0, error: e?.message || String(e) };
  }
}

function extractCandidates(raw?: WpRawPost): string[] {
  if (!raw) return [];
  const out: string[] = [];
  try {
    const emb = (raw as any)._embedded;
    const media = emb?.['wp:featuredmedia'];
    if (Array.isArray(media)) {
      media.forEach((m: any) => {
        if (m?.source_url) out.push(m.source_url);
        const sizes = m?.media_details?.sizes || {};
        Object.keys(sizes).forEach(k => { const s = sizes[k]; if (s?.source_url) out.push(s.source_url); });
      });
    }
    if ((raw as any).jetpack_featured_media_url) out.push((raw as any).jetpack_featured_media_url);
  } catch {}
  return Array.from(new Set(out));
}

function firstMatch(re: RegExp, html?: string): string | undefined {
  if (!html) return undefined;
  const m = html.match(re);
  return m?.[1];
}

export async function GET({ url }: { url: URL }) {
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Missing ?slug=' }, null, 2), { status: 400, headers: { 'content-type': 'application/json' } });
  const base = getWpBase();
  if (!base) return new Response(JSON.stringify({ error: 'WP base not configured' }, null, 2), { status: 500, headers: { 'content-type': 'application/json' } });
  const apiUrl = base.includes('rest_route=')
    ? `${base}/posts&status=publish&slug=${encodeURIComponent(slug)}&_embed=1`
    : `${base}/posts?status=publish&slug=${encodeURIComponent(slug)}&_embed=1`;

  const { data, status, contentType, textSnippet, error } = await fetchJson<WpRawPost[]>(apiUrl);

  const raw = Array.isArray(data) ? data[0] : undefined;
  const normalized = raw ? normalizePost(raw) : undefined;
  const html = raw?.content?.rendered || '';
  const patterns = {
    data_lazy_src: firstMatch(/<img[^>]+data-lazy-src=["']([^"']+)["']/i, html),
    data_src: firstMatch(/<img[^>]+data-src=["']([^"']+)["']/i, html),
    data_full_url: firstMatch(/<img[^>]+data-full-url=["']([^"']+)["']/i, html),
    data_large_file: firstMatch(/<img[^>]+data-large-file=["']([^"']+)["']/i, html),
    data_orig_file: firstMatch(/<img[^>]+data-orig-file=["']([^"']+)["']/i, html),
    src: firstMatch(/<img[^>]+src=["']([^"']+)["']/i, html),
    srcset_first: (() => {
      const ss = firstMatch(/<img[^>]+srcset=["']([^"']+)["']/i, html); if (!ss) return undefined; return ss.split(',')[0].trim();
    })(),
  };

  const candidateFeatured = extractCandidates(raw);

  return new Response(JSON.stringify({
    slug,
    apiUrl,
    status,
    contentType,
    error,
    textSnippet,
    hasRaw: !!raw,
    candidateFeatured,
    patternFirstMatches: patterns,
    normalized: normalized ? {
      id: normalized.id,
      slug: normalized.slug,
      cover: normalized.data.cover,
      data: normalized.data,
      // do not include full contentHtml to keep response smaller; include length
      contentHtmlLength: normalized.contentHtml?.length || 0
    } : undefined,
    rawContentLength: html.length,
    sampleContentStart: html.slice(0, 400)
  }, null, 2), { headers: { 'content-type': 'application/json' } });
}
