// Lightweight WordPress REST helpers to integrate WP posts in Astro
// Usage: set env WP_API_BASE="https://your-wp-site.com/wp-json/wp/v2" (or base without /wp-json, both supported)

export type WpRawPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media?: number;
  jetpack_featured_media_url?: string;
  _embedded?: any;
};

export type NormalizedPost = {
  id?: number;
  slug: string;
  data: {
    title: string;
    excerpt: string;
    date: string;
    cover?: string;
    author?: string;
    categories?: Array<{ id?: number; name: string; slug?: string }>;
  };
  contentHtml?: string;
};

function ensureApiBase(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Accept either https://site.com or https://site.com/wp-json/wp/v2
  let base = raw.trim().replace(/\/$/, '');
  // If it already contains rest_route=/wp/v2 consider it valid
  if (/rest_route=\/wp\/v2/.test(base)) return base;
  // If it already looks like /wp-json/wp/v2 consider it valid
  if (/\/wp-json\/.+/.test(base)) return base;
  // Otherwise append standard wp-json path
  base = base + '/wp-json/wp/v2';
  return base;
}

function getWpLang(): string | undefined {
  // Optional language code for Polylang/WPML setups (e.g., 'es')
  // eslint-disable-next-line no-undef
  const pe: any = (typeof process !== 'undefined' && (process as any)?.env) ? (process as any).env : {};
  let lang: string | undefined = pe.WP_API_LANG || pe.PUBLIC_WP_API_LANG;
  if (!lang) {
    // eslint-disable-next-line no-undef
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    lang = envAny.WP_API_LANG || envAny.PUBLIC_WP_API_LANG;
  }
  return (lang && String(lang).trim()) || undefined;
}

export function getWpBase(): string | undefined {
  // Prefer WP_API_BASE, fallback to PUBLIC_WP_API_BASE for flexibility
  // eslint-disable-next-line no-undef
  const pe: any = (typeof process !== 'undefined' && (process as any)?.env) ? (process as any).env : {};
  // Runtime takes precedence so cPanel env overrides baked build vars
  let b: string | undefined = pe.WP_API_BASE || pe.PUBLIC_WP_API_BASE;
  if (!b) {
    // eslint-disable-next-line no-undef
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    b = envAny.WP_API_BASE || envAny.PUBLIC_WP_API_BASE;
  }
  return ensureApiBase(b);
}

export function getSiteRootFromBase(base?: string): string | undefined {
  if (!base) return undefined;
  // rest_route variant: https://site.com/subdir/?rest_route=/wp/v2 => site root is https://site.com/subdir
  if (base.includes('rest_route=')) {
    const idx = base.indexOf('?rest_route=');
    return idx !== -1 ? base.slice(0, idx) : base;
  }
  // wp-json variant: https://site.com[/subdir]/wp-json/wp/v2 => site root is https://site.com[/subdir]
  const m = base.match(/^(https?:\/\/[^\s]+?)\/wp-json\//i);
  if (m) return m[1];
  // Fallback: strip trailing /wp-json or /wp-json/wp/v2 if present
  return base.replace(/\/wp-json(?:\/wp\/v2)?$/i, '');
}

// Derive a media root for static assets (uploads), e.g., swap api. subdomain for main host but keep subdirectory like /blog
export function getMediaRootFromBase(base?: string): string | undefined {
  const site = getSiteRootFromBase(base);
  if (!site) return undefined;
  try {
    const u = new URL(site);
    let host = u.host;
    // Common pattern: API served from api.example.com but media served from example.com
    if (/^api\./i.test(host)) host = host.replace(/^api\./i, '');
    // Optionally also normalize www if needed in future
    const media = new URL(`${u.protocol}//${host}`);
    // Preserve subdirectory path (e.g., /blog)
    media.pathname = u.pathname || '/';
    return media.toString().replace(/\/$/, '');
  } catch {
    return site;
  }
}

export function getConfiguredMediaRoot(): string | undefined {
  // Allow explicit override via env
  // eslint-disable-next-line no-undef
  const pe: any = (typeof process !== 'undefined' && (process as any)?.env) ? (process as any).env : {};
  let override: string | undefined = pe.WP_MEDIA_ROOT || pe.PUBLIC_WP_MEDIA_ROOT;
  if (!override) {
    // eslint-disable-next-line no-undef
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    override = envAny.WP_MEDIA_ROOT || envAny.PUBLIC_WP_MEDIA_ROOT;
  }
  if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
  return getMediaRootFromBase(getWpBase());
}

function shouldProxyImages(): boolean {
  // Enable with PUBLIC_IMAGE_PROXY=on (or true). Useful in dev to bypass hotlinking.
  // eslint-disable-next-line no-undef
  const pe: any = (typeof process !== 'undefined' && (process as any)?.env) ? (process as any).env : {};
  let v: string = (pe.PUBLIC_IMAGE_PROXY || pe.IMAGE_PROXY || '').toString().toLowerCase();
  if (!v) {
    // eslint-disable-next-line no-undef
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    v = (envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString().toLowerCase();
  }
  return v === 'on' || v === 'true' || v === '1';
}

function normalizeImageUrl(url?: string, siteRoot?: string, mediaRoot?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  const wrapProxy = (u: string) => (shouldProxyImages() ? `/api/img-proxy?url=${encodeURIComponent(u)}` : u);
  if (/^https?:\/\//i.test(trimmed)) {
    // Optionally upgrade http->https if same host and siteRoot is https
    try {
      const u = new URL(trimmed);
      const s = siteRoot ? new URL(siteRoot) : undefined;
      const m = mediaRoot ? new URL(mediaRoot) : undefined;
      // Prefer https when target roots are https and host matches
      if (s && u.protocol === 'http:' && s.protocol === 'https:' && u.host === s.host) u.protocol = 'https:';
      if (m && u.protocol === 'http:' && m.protocol === 'https:' && u.host === m.host) u.protocol = 'https:';

      // If it's an uploads URL, align host and subdirectory with mediaRoot or siteRoot
      const desired = m || s; // mediaRoot has priority
      if (desired) {
        const d = new URL(desired);
        const uploadsPath = '/wp-content/uploads';
        if (u.pathname.startsWith(uploadsPath)) {
          // Ensure correct host
          u.host = d.host;
          u.protocol = d.protocol;
          // If the site is in a subdirectory (e.g., /blog), prefix it
          const basePath = d.pathname && d.pathname !== '/' ? d.pathname.replace(/\/$/, '') : '';
          if (basePath && !u.pathname.startsWith(basePath + uploadsPath)) {
            u.pathname = basePath + u.pathname;
          }
          return wrapProxy(u.toString());
        }
      }
    } catch {}
    return wrapProxy(trimmed);
  }
  if (/^\/\//.test(trimmed)) {
    return wrapProxy('https:' + trimmed);
  }
  if (trimmed.startsWith('/')) {
    const base = (mediaRoot || siteRoot);
    if (!base) return trimmed; // relative to current origin
    return wrapProxy(base.replace(/\/$/, '') + trimmed);
  }
  // Other relative paths
  if (mediaRoot || siteRoot) return wrapProxy((mediaRoot || siteRoot)!.replace(/\/$/, '') + '/' + trimmed.replace(/^\.\//, ''));
  return wrapProxy(trimmed);
}

function rewriteContentHtml(html: string, siteRoot?: string, mediaRoot?: string): string {
  if (!html) return html;
  const norm = (u?: string) => normalizeImageUrl(u, siteRoot, mediaRoot) || u || '';
  let out = html;
  // Promote data-lazy-src and data-src to src
  out = out.replace(/(<img[^>]*?)\sdata-lazy-src=["']([^"']+)["']([^>]*>)/gi, (_m, pre, url, post) => `${pre} src="${norm(url)}"${post}`);
  out = out.replace(/(<img[^>]*?)\sdata-src=["']([^"']+)["']([^>]*>)/gi, (_m, pre, url, post) => `${pre} src="${norm(url)}"${post}`);
  // Normalize existing src
  out = out.replace(/(<img[^>]*?\ssrc=["'])([^"']+)(["'])/gi, (_m, pre, url, suf) => `${pre}${norm(url)}${suf}`);
  // Normalize srcset (comma-separated list)
  out = out.replace(/(<img[^>]*?\ssrcset=["'])([^"']+)(["'])/gi, (_m, pre, list, suf) => {
    const fixed = list.split(',').map((entry: string) => {
      const e = entry.trim();
      if (!e) return e;
      const parts = e.split(/\s+/);
      const url = parts.shift() || '';
      const rest = parts.join(' ');
      return `${norm(url)}${rest ? ' ' + rest : ''}`;
    }).join(', ');
    return `${pre}${fixed}${suf}`;
  });

  // Helper to add/update query params on a URL string safely
  const addParams = (raw: string, params: Record<string, string | number | boolean>): string => {
    try {
      const u = new URL(raw, 'https://dummy.base'); // base for relative safety
      Object.entries(params).forEach(([k, v]) => {
        const val = String(v);
        // Avoid duplicates: if already present with different value, overwrite
        u.searchParams.set(k, val);
      });
      // If original was absolute, return absolute; if relative, strip dummy base
      if (/^https?:\/\//i.test(raw)) return u.toString();
      return u.pathname + (u.search ? u.search : '') + (u.hash ? u.hash : '');
    } catch {
      return raw;
    }
  };

  // Ensure HTML5 <video> tags start muted and inline
  out = out.replace(/<video\b([^>]*)>/gi, (m, attrs) => {
    let a = attrs || '';
    if (!/\bmuted(\b|=)/i.test(a)) a += ' muted';
    if (!/\bplaysinline(\b|=)/i.test(a)) a += ' playsinline';
    // Prefer to keep existing controls
    return `<video${a}>`;
  });

  // For YouTube embeds, add mute and playsinline parameters
  out = out.replace(/(<iframe[^>]*?\ssrc=["'])([^"']+youtube\.com\/embed\/[^"']+)(["'][^>]*>)/gi, (_m, pre, src, suf) => {
    const withParams = addParams(src, { mute: 1, playsinline: 1, rel: 0, modestbranding: 1 });
    return `${pre}${withParams}${suf}`;
  });

  // For Vimeo embeds, add muted and playsinline
  out = out.replace(/(<iframe[^>]*?\ssrc=["'])([^"']+player\.vimeo\.com\/video\/[^"']+)(["'][^>]*>)/gi, (_m, pre, src, suf) => {
    const withParams = addParams(src, { muted: 1, playsinline: 1 });
    return `${pre}${withParams}${suf}`;
  });

  return out;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'canvas-docente-astro/1.0 (+https://artenlaclase.cl)' } });
  if (!res.ok) throw new Error(`WP fetch failed ${res.status}: ${url}`);
  return (await res.json()) as T;
}

async function fetchJsonWithHeaders<T>(url: string): Promise<{ data: T; headers: Headers }>{
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'canvas-docente-astro/1.0 (+https://artenlaclase.cl)' } });
  if (!res.ok) throw new Error(`WP fetch failed ${res.status}: ${url}`);
  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}

function stripHtml(input: string): string {
  // Very basic HTML strip; WordPress returns HTML in excerpt
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function firstImageFromHtml(html?: string): string | undefined {
  if (!html || typeof html !== 'string') return undefined;
  // Prefer explicit src; also consider common lazy attributes
  const m = html.match(/<(?:img)[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/i);
  return m?.[1];
}

function getFeaturedImage(raw: WpRawPost): string | undefined {
  const emb = raw._embedded;
  const mediaArr = emb?.['wp:featuredmedia'] as Array<any> | undefined;
  const media = mediaArr?.[0];
  // Collect candidates with width if available
  type Candidate = { url: string; width?: number };
  const candidates: Candidate[] = [];
  if (typeof media?.source_url === 'string') candidates.push({ url: media.source_url, width: media?.media_details?.width });
  if (typeof raw.jetpack_featured_media_url === 'string') candidates.push({ url: raw.jetpack_featured_media_url });
  const sizes = media?.media_details?.sizes || {};
  for (const key of Object.keys(sizes)) {
    const s = sizes[key];
    if (s && typeof s.source_url === 'string') candidates.push({ url: s.source_url, width: s.width });
  }
  if (candidates.length === 0) return undefined;
  // Sort by width desc (undefined last) and pick first
  candidates.sort((a, b) => (b.width ?? -1) - (a.width ?? -1));
  return candidates[0].url;
}

function getAuthorName(raw: WpRawPost): string | undefined {
  const emb = raw._embedded;
  const authorArr = emb?.author as Array<any> | undefined;
  const name = authorArr?.[0]?.name;
  return typeof name === 'string' ? name : undefined;
}

function getCategories(raw: WpRawPost): Array<{ id?: number; name: string; slug?: string }> | undefined {
  const terms = raw._embedded?.['wp:term'] as any[] | undefined;
  if (!terms || !Array.isArray(terms)) return undefined;
  const flat = terms.flat().filter(Boolean);
  const cats = flat.filter((t: any) => t?.taxonomy === 'category');
  const mapped = cats.map((c: any) => ({ id: c?.id, name: String(c?.name || ''), slug: c?.slug }));
  return mapped.length ? mapped : undefined;
}

export function normalizePost(raw: WpRawPost): NormalizedPost {
  const title = raw.title?.rendered ?? '';
  const excerpt = raw.excerpt?.rendered ?? '';
  const content = raw.content?.rendered ?? '';
  const base = getWpBase();
  const siteRoot = getSiteRootFromBase(base);
  const mediaRoot = getConfiguredMediaRoot();
  let coverRaw = getFeaturedImage(raw);
  if (!coverRaw) {
    const firstImg = firstImageFromHtml(content);
    if (firstImg) coverRaw = firstImg;
  }
  const contentHtml = rewriteContentHtml(content, siteRoot, mediaRoot);
  return {
    id: raw.id,
    slug: raw.slug,
    data: {
      title: title.replace(/<[^>]+>/g, ''),
      excerpt: stripHtml(excerpt),
      date: raw.date,
      cover: normalizeImageUrl(coverRaw, siteRoot, mediaRoot),
      author: getAuthorName(raw),
      categories: getCategories(raw),
    },
    contentHtml,
  };
}

export async function listWpPosts(limit = 100): Promise<NormalizedPost[]> {
  const base = getWpBase();
  if (!base) return [];
  const lang = getWpLang();
  const langPart = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const url = base.includes('rest_route=')
    ? `${base}/posts&status=publish&_embed=1&per_page=${Math.min(limit, 100)}${langPart}`
    : `${base}/posts?status=publish&_embed=1&per_page=${Math.min(limit, 100)}${langPart}`;
  const items = await fetchJson<WpRawPost[]>(url);
  return items.map(normalizePost);
}

export async function listWpPostsPage(page = 1, perPage = 9, opts?: { search?: string }): Promise<{ posts: NormalizedPost[]; total: number; totalPages: number }>{
  const base = getWpBase();
  if (!base) return { posts: [], total: 0, totalPages: 0 };
  const lang = getWpLang();
  const searchPart = opts?.search ? `&search=${encodeURIComponent(opts.search)}` : '';
  const langPart = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const url = base.includes('rest_route=')
    ? `${base}/posts&status=publish&_embed=1&per_page=${Math.min(perPage, 100)}&page=${Math.max(1, page)}${searchPart}${langPart}`
    : `${base}/posts?status=publish&_embed=1&per_page=${Math.min(perPage, 100)}&page=${Math.max(1, page)}${searchPart}${langPart}`;
  const { data, headers } = await fetchJsonWithHeaders<WpRawPost[]>(url);
  const total = Number(headers.get('X-WP-Total') || headers.get('x-wp-total') || data.length || 0);
  const totalPages = Number(headers.get('X-WP-TotalPages') || headers.get('x-wp-totalpages') || (total ? Math.ceil(total / perPage) : 0));
  return { posts: data.map(normalizePost), total, totalPages };
}

export async function getWpPostBySlug(slug: string): Promise<NormalizedPost | undefined> {
  const base = getWpBase();
  if (!base) return undefined;
  const lang = getWpLang();
  // 1) Intento directo por slug (con status=publish para evitar borradores)
  const langPart = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const url = base.includes('rest_route=')
    ? `${base}/posts&status=publish&slug=${encodeURIComponent(slug)}&_embed=1${langPart}`
    : `${base}/posts?status=publish&slug=${encodeURIComponent(slug)}&_embed=1${langPart}`;
  const items = await fetchJson<WpRawPost[]>(url);
  let first = items?.[0];
  if (first) return normalizePost(first);
  // 2) Fallback: buscar por texto si no se encontró por slug (algunos sitios alteran slugs)
  const searchUrl = base.includes('rest_route=')
    ? `${base}/posts&status=publish&search=${encodeURIComponent(slug)}&_embed=1&per_page=1${langPart}`
    : `${base}/posts?status=publish&search=${encodeURIComponent(slug)}&_embed=1&per_page=1${langPart}`;
  try {
    const sItems = await fetchJson<WpRawPost[]>(searchUrl);
    first = sItems?.[0];
    return first ? normalizePost(first) : undefined;
  } catch {
    return undefined;
  }
}

export async function getWpPostById(id: number): Promise<NormalizedPost | undefined> {
  const base = getWpBase();
  if (!base) return undefined;
  const lang = getWpLang();
  const langPart = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const url = base.includes('rest_route=')
    ? `${base}/posts/${encodeURIComponent(String(id))}?_embed=1${langPart}`
    : `${base}/posts/${encodeURIComponent(String(id))}?_embed=1${langPart}`;
  try {
    const item = await fetchJson<WpRawPost>(url);
    return item ? normalizePost(item) : undefined;
  } catch {
    return undefined;
  }
}
