import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const env = {
    PUBLIC_IMAGE_PROXY: import.meta.env.PUBLIC_IMAGE_PROXY || process.env.PUBLIC_IMAGE_PROXY,
    IMAGE_PROXY_SECRET: process.env.IMAGE_PROXY_SECRET ? '***SET***' : 'NOT SET',
    WP_API_BASE: import.meta.env.WP_API_BASE || process.env.WP_API_BASE,
    PUBLIC_WP_MEDIA_ROOT: import.meta.env.PUBLIC_WP_MEDIA_ROOT || process.env.PUBLIC_WP_MEDIA_ROOT,
    NODE_ENV: process.env.NODE_ENV,
  };

  return new Response(JSON.stringify(env, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
