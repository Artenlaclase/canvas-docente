import { getWpBase, safeListWpPosts } from "../../utils/wp";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const checkIndex = url.searchParams.get('index') === 'true';
  
  if (checkIndex) {
    // Simular lo que hace index.astro
    let pool: any[] = [];
    const wpBase = getWpBase();
    
    if (wpBase) {
      pool = await safeListWpPosts(40);
    }
    
    function pickRandom<T>(arr: T[], n: number): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, n);
    }
    
    let columns: any[] = [];
    if (pool.length && typeof pool[0]?.id === 'number') {
      const catMap = new Map<string, any[]>();
      for (const p of pool) {
        const cats = p.data?.categories || [];
        for (const c of cats) {
          const key = c?.name || c?.slug || String(c?.id || '');
          if (!key) continue;
          if (!catMap.has(key)) catMap.set(key, []);
          catMap.get(key)!.push(p);
        }
      }
      const allCats = Array.from(catMap.keys());
      const chosenCats = pickRandom(allCats, Math.min(3, allCats.length));
      columns = chosenCats.map((key) => {
        const arr = catMap.get(key) || [];
        const [post] = pickRandom(arr, 1);
        return { title: key, post };
      }).filter(x => x && x.post);
    }
    if (columns.length < 3) {
      const rest = pickRandom(pool, 3 - columns.length);
      columns = columns.concat(rest.map((p) => ({ title: 'Notas', post: p })));
    }
    
    return new Response(JSON.stringify({
      ok: true,
      type: 'index-simulation',
      wpBase: wpBase || 'NO WPBASE',
      pool_length: pool.length,
      pool_sample: pool.slice(0, 2).map(p => ({
        id: p.id,
        slug: p.slug,
        has_data: !!p.data,
        has_cover: !!p.data?.cover,
        categories_count: p.data?.categories?.length || 0
      })),
      columns_length: columns.length,
      columns_sample: columns.slice(0, 2).map(c => ({
        title: c.title,
        post_slug: c.post?.slug,
        post_has_cover: !!c.post?.data?.cover
      }))
    }, null, 2), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
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
