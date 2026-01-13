import { getWpBase } from "../../utils/wp";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const base = getWpBase();
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: 'WP_API_BASE no configurado' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  try {
    // Obtener el primer post con _embed
    const fullUrl = base.includes('rest_route=')
      ? `${base}/posts&status=publish&_embed=1&per_page=1`
      : `${base}/posts?status=publish&_embed=1&per_page=1`;
    
    console.log('[wp-debug-raw] Fetching:', fullUrl);
    
    const res = await fetch(fullUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'canvas-docente-astro/1.0'
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: `HTTP ${res.status}`,
        url: fullUrl
      }), { status: res.status, headers: { 'content-type': 'application/json' } });
    }

    const rawData = await res.json();
    
    // Si es un array, tomar el primer elemento
    const post = Array.isArray(rawData) ? rawData[0] : rawData;
    
    if (!post) {
      return new Response(JSON.stringify({ ok: false, error: 'No posts found', rawData }), { 
        status: 404, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Retornar información diagnostica del primer post
    return new Response(JSON.stringify({
      ok: true,
      base,
      url: fullUrl,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title?.rendered?.slice(0, 50),
        date: post.date,
        featured_media: post.featured_media,
        jetpack_featured_media_url: post.jetpack_featured_media_url,
        has_embedded: !!post._embedded,
        embedded_keys: post._embedded ? Object.keys(post._embedded) : [],
        wp_featuredmedia: post._embedded?.['wp:featuredmedia']?.[0] ? {
          id: post._embedded['wp:featuredmedia'][0].id,
          source_url: post._embedded['wp:featuredmedia'][0].source_url,
          has_media_details: !!post._embedded['wp:featuredmedia'][0].media_details,
          media_details_keys: post._embedded['wp:featuredmedia'][0].media_details ? Object.keys(post._embedded['wp:featuredmedia'][0].media_details) : []
        } : null,
        content_slice: post.content?.rendered?.slice(0, 300),
        content_has_img: /<img/.test(post.content?.rendered || ''),
        first_img_src: (post.content?.rendered || '').match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
      }
    }, null, 2), { 
      headers: { 'content-type': 'application/json' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ 
      ok: false, 
      error: e?.message || String(e),
      base
    }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}
