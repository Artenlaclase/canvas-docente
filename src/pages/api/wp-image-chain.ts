export const prerender = false;

import { getWpPostBySlug } from '../../utils/wp';

async function headOrGet(url: string): Promise<{ url: string; headStatus?: number; getStatus?: number; headError?: string; getError?: string; contentType?: string }> {
  const result: { url: string; headStatus?: number; getStatus?: number; headError?: string; getError?: string; contentType?: string } = { url };
  try {
    const h = await fetch(url, { method: 'HEAD' });
    result.headStatus = h.status;
    result.contentType = h.headers.get('content-type') || undefined;
    if (!h.ok) result.headError = `Non-OK ${h.status}`;
  } catch (e: any) {
    result.headError = e?.message || String(e);
  }
  if (!result.headStatus || result.headStatus >= 400) {
    try {
      const g = await fetch(url, { method: 'GET' });
      result.getStatus = g.status;
      if (!g.ok) result.getError = `Non-OK ${g.status}`; else result.contentType = result.contentType || g.headers.get('content-type') || undefined;
    } catch (e: any) {
      result.getError = e?.message || String(e);
    }
  }
  return result;
}

export async function GET({ url }: { url: URL }) {
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Missing ?slug=' }, null, 2), { status: 400, headers: { 'content-type': 'application/json' } });
  try {
    const post = await getWpPostBySlug(slug);
    if (!post) return new Response(JSON.stringify({ error: 'Post not found or inaccessible', slug }, null, 2), { status: 404, headers: { 'content-type': 'application/json' } });
    const covers = post.data.candidateCovers || (post.data.cover ? [post.data.cover] : []);
    const unique = Array.from(new Set(covers));
    const checks = [] as any[];
    for (const c of unique) {
      checks.push(await headOrGet(c));
    }
    return new Response(JSON.stringify({ slug, total: unique.length, checks }, null, 2), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }, null, 2), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
