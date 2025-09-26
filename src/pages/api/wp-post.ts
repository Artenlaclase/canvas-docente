import { getWpBase, getWpPostBySlug } from "../../utils/wp";

export async function GET({ url }: { url: URL }) {
  const slug = url.searchParams.get('slug') || '';
  const base = getWpBase();
  if (!base) {
    return new Response(JSON.stringify({ error: 'WP_API_BASE no configurado' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Falta parámetro slug' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  try {
    const post = await getWpPostBySlug(slug);
    if (!post) {
      return new Response(JSON.stringify({ found: false, slug, base }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({
        found: true,
        slug,
        base,
        id: post.id,
        postSlug: post.slug,
        title: post.data.title,
        date: post.data.date,
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e), slug, base }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
