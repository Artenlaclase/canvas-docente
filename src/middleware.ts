import type { APIContext, MiddlewareNext } from 'astro';
import { getWpPostById } from './utils/wp';

export async function onRequest(context: APIContext, next: MiddlewareNext) {
  try {
    const req = context.request;
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Skip static assets and internal astro chunks
    if (
      pathname.startsWith('/_astro/') ||
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/favicon.') ||
      pathname.startsWith('/api/')
    ) {
      return next();
    }

    // Only act on blog pages
  // If mounted at root, blog still starts with /blog/
  if (pathname.startsWith('/blog/')) {
      // Support common WP query params
      const idParam = url.searchParams.get('id') || url.searchParams.get('p') || url.searchParams.get('page_id');
      const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : undefined;

      if (id) {
        // Try resolve canonical slug by ID and redirect to clean URL
        const post = await getWpPostById(id);
        if (post && post.slug) {
          const canonical = `/blog/${encodeURIComponent(post.slug)}`;
          if (pathname !== canonical || url.search) {
            const target = new URL(canonical, url);
            return Response.redirect(target.toString(), 301);
          }
        } else {
          // If we can't resolve the post by ID, at least strip the WP param to avoid route issues
          url.searchParams.delete('id');
          url.searchParams.delete('p');
          url.searchParams.delete('page_id');
          if (req.url !== url.toString()) {
            return Response.redirect(url.toString(), 302);
          }
        }
      }
    }
  } catch (e) {
    // Non-fatal: fall through to normal handling
    console.warn('[middleware] redirect check error:', e);
  }
  return next();
}
