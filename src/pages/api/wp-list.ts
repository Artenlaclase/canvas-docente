import { listWpPostsPage, getWpBase } from "../../utils/wp";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const base = getWpBase();
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: 'WP_API_BASE no configurado' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const search = url.searchParams.get('q') || undefined;
  try {
    const { posts, total, totalPages } = await listWpPostsPage(1, 5, search ? { search } : undefined);
    const minimal = posts.map(p => ({ id: p.id, slug: p.slug, title: p.data.title, date: p.data.date }));
    return new Response(JSON.stringify({ ok: true, count: minimal.length, total, totalPages, base, posts: minimal }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e), base }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
