import { getWpBase, getWpPostBySlug, getWpPostById } from "../../utils/wp";

export async function GET({ url }: { url: URL }) {
  const slug = url.searchParams.get('slug') || '';
  const idParam = url.searchParams.get('id') || '';
  const id = /^\d+$/.test(idParam) ? Number(idParam) : undefined;
  const base = getWpBase();
  const result: any = { base, slug, id, steps: [] as string[] };

  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: 'WP_API_BASE no configurado', ...result }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    if (slug) {
      result.steps.push('try:getWpPostBySlug');
      const post = await getWpPostBySlug(slug);
      if (post) {
        return new Response(JSON.stringify({ ok: true, source: 'slug', id: post.id, postSlug: post.slug, title: post.data.title, date: post.data.date, base }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      result.steps.push('slug:not-found');
    } else {
      result.steps.push('skip:slug-empty');
    }

    if (id) {
      result.steps.push('try:getWpPostById');
      const postById = await getWpPostById(id);
      if (postById) {
        return new Response(JSON.stringify({ ok: true, source: 'id', id: postById.id, postSlug: postById.slug, title: postById.data.title, date: postById.data.date, base }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      result.steps.push('id:not-found');
    } else {
      result.steps.push('skip:id-empty-or-invalid');
    }

    return new Response(JSON.stringify({ ok: false, notFound: true, ...result }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e), ...result }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
