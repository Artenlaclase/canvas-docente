export const prerender = false;

export async function GET() {
  const expected = [
    '/blog',
    '/blog/_health',
    '/blog/:slug',
    '/blog/id/:id',
    '/blog/[...rest] (fallback)',
    '/api/wp-list',
    '/api/blog-links',
    '/api/blog-resolve',
  ];
  const env: Record<string,string|undefined> = {};
  const keys = ['WP_API_BASE','PUBLIC_WP_API_BASE','PUBLIC_WP_MEDIA_ROOT','PUBLIC_ASSETS_PREFIX','NODE_ENV','DEBUG_BLOG'];
  for (const k of keys) env[k] = (typeof process!=='undefined' && process.env)? process.env[k]: undefined;
  return new Response(JSON.stringify({ ok:true, expectedRoutes: expected, env }), { headers: { 'content-type':'application/json' } });
}
