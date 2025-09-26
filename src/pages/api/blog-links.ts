import { listWpPosts } from "../../utils/wp";
import { getWpBase } from "../../utils/wp";

export const prerender = false;

export async function GET() {
  const base = getWpBase();
  if (!base) return new Response(JSON.stringify({ ok:false, error:'WP_API_BASE missing'}), { status:500, headers:{'content-type':'application/json'}});
  const posts = await listWpPosts(5);
  const links = posts.map(p => ({ id: p.id, slug: p.slug, href: `/blog/${encodeURIComponent(p.slug)}?id=${p.id}` }));
  return new Response(JSON.stringify({ ok:true, count: links.length, links }), { headers:{'content-type':'application/json'} });
}
