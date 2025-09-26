export const prerender = false;

import { listWpPosts } from '../../utils/wp';

function extractImages(html?: string): string[] {
  if (!html) return [];
  const urls = new Set<string>();
  // img src
  html.replace(/<img[^>]+src=["']([^"']+)["']/gi, (_m, url) => { urls.add(url); return ''; });
  // data-* lazy variants
  html.replace(/<img[^>]+data-(?:lazy-src|src|orig-file|large-file|full-url)=["']([^"']+)["']/gi, (_m, url) => { urls.add(url); return ''; });
  return Array.from(urls);
}

export async function GET() {
  try {
    const posts = await listWpPosts(15);
    const mapped = posts.map(p => ({
      id: p.id,
      slug: p.slug,
      cover: p.data.cover,
      images: extractImages(p.contentHtml)
    }));
    return new Response(JSON.stringify({ count: posts.length, posts: mapped }, null, 2), { headers: { 'content-type':'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }, null, 2), { status: 500, headers: { 'content-type':'application/json' } });
  }
}
