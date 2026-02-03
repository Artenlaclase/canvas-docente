export const prerender = false;

import type { APIRoute } from 'astro';
import { getWpBase, safeListWpPosts } from '../../utils/wp';

export const GET: APIRoute = async () => {
  try {
    let pool: any[] = [];
    const wpBase = getWpBase();
    
    console.log('[DEBUG-INDEX] wpBase:', wpBase);
    
    if (wpBase) {
      pool = await safeListWpPosts(40);
      console.log('[DEBUG-INDEX] Pool length after safeListWpPosts:', pool.length);
    }
    
    function pickRandom<T>(arr: T[], n: number): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, n);
    }
    
    // Primer bloque (hasta 3)
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
    
    return new Response(
      JSON.stringify({
        success: true,
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
      }, null, 2),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, null, 2),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
