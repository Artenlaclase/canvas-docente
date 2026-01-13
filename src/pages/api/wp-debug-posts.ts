import { getWpBase, listWpPostsPage } from "../../utils/wp";
import { writeFileSync } from "fs";
import { join } from "path";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const base = getWpBase();
  
  try {
    const { posts, total, totalPages } = await listWpPostsPage(1, 1);
    const post = posts[0];
    
    if (!post) {
      return new Response(JSON.stringify({ ok: false, error: 'No posts found' }), { 
        status: 404, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Log to console for debugging
    console.log('[debug] First post:', {
      id: post.id,
      slug: post.slug,
      title: post.data.title.slice(0, 50),
      cover: post.data.cover,
      hasContentHtml: !!post.contentHtml,
      contentHtmlLength: post.contentHtml?.length,
    });

    return new Response(JSON.stringify({
      ok: true,
      base,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.data.title.slice(0, 50),
        date: post.data.date,
        cover: post.data.cover,
        candidateCovers: post.data.candidateCovers,
        hasContentHtml: !!post.contentHtml,
        contentHtmlLength: post.contentHtml?.length,
        contentHtmlFirst300: post.contentHtml?.slice(0, 300),
      }
    }, null, 2), { 
      headers: { 'content-type': 'application/json' } 
    });

  } catch (e: any) {
    console.error('[debug] Error:', e?.message || String(e));
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
