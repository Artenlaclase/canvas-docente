export const prerender = false;

async function tryJson(url: string): Promise<{ ok: boolean; status?: number; contentType?: string; snippet?: string }>{
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    if (!/application\/json/i.test(ct)) {
      const text = await res.text();
      return { ok: false, status: res.status, contentType: ct, snippet: text.slice(0,120) };
    }
    // ensure JSON parseable
    await res.json();
    return { ok: true, status: res.status, contentType: ct };
  } catch (e: any) {
    return { ok: false, snippet: (e && e.message) || 'error' };
  }
}

export async function GET() {
  const envBase = (process.env.WP_API_BASE || process.env.PUBLIC_WP_API_BASE || '').replace(/"/g,'').trim();
  const originGuess = envBase ? envBase.replace(/\/?wp-json.*$/,'').replace(/\/?\?rest_route=.*$/,'') : 'https://artenlaclase.cl';
  const isBlogPath = /\/blog(\/|$)/.test(originGuess.split('://')[1] || '');
  // Build candidate roots
  const root = originGuess;
  const top = root.replace(/\/blog(\/|$)/,'/');
  const candidates: string[] = [];
  function add(s: string){ if (!candidates.includes(s)) candidates.push(s); }
  if (envBase) add(envBase);
  add(root.replace(/\/$/,'') + '/wp-json/wp/v2');
  add(root.replace(/\/$/,'') + '/?rest_route=/wp/v2');
  if (isBlogPath) {
    add(top.replace(/\/$/,'') + '/wp-json/wp/v2');
    add(top.replace(/\/$/,'') + '/?rest_route=/wp/v2');
  }
  // Deduplicate & test posts?per_page=1
  const results: any[] = [];
  for (const base of candidates) {
    const url = base.includes('rest_route=') ? base + '/posts&per_page=1' : base + '/posts?per_page=1';
    const r = await tryJson(url);
    results.push({ base, test: url, ...r });
  }
  const working = results.filter(r => r.ok);
  return new Response(JSON.stringify({ envBase, originGuess, candidates, working, results }, null, 2), { headers: { 'content-type':'application/json' } });
}
