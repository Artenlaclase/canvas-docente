import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const envAny: any = import.meta.env as any;
  const proxyFromAstro = (envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString();
  const proxyFromNode = (typeof process !== 'undefined' && process.env) 
    ? (process.env.PUBLIC_IMAGE_PROXY || process.env.IMAGE_PROXY || '')
    : '';
  
  return new Response(JSON.stringify({
    version: '3.0-dual-env',
    timestamp: new Date().toISOString(),
    debug: {
      astroEnv: proxyFromAstro,
      nodeEnv: proxyFromNode,
      combined: proxyFromNode || proxyFromAstro,
      afterTrim: (proxyFromNode || proxyFromAstro).toString().trim().toLowerCase()
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
