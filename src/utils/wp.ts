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
  };
  contentHtml?: string;
};

function ensureApiBase(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Accept either https://site.com or https://site.com/wp-json/wp/v2
  let base = raw.trim().replace(/\/$/, '');
  if (!/\/wp-json\/.+/.test(base)) {
    base = base + '/wp-json/wp/v2';
  }
  return base;
}

export function getWpBase(): string | undefined {
  // Prefer WP_API_BASE, fallback to PUBLIC_WP_API_BASE for flexibility
  // eslint-disable-next-line no-undef
  const envAny: any = import.meta.env as any;
  const b = envAny.WP_API_BASE || envAny.PUBLIC_WP_API_BASE;
  return ensureApiBase(b);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`WP fetch failed ${res.status}: ${url}`);
  return (await res.json()) as T;
}

async function fetchJsonWithHeaders<T>(url: string): Promise<{ data: T; headers: Headers }>{
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
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

function getFeaturedImage(raw: WpRawPost): string | undefined {
  // Preferred: _embedded['wp:featuredmedia'][0].source_url
  const emb = raw._embedded;
  const mediaArr = emb?.['wp:featuredmedia'] as Array<any> | undefined;
  const url = mediaArr?.[0]?.source_url || raw.jetpack_featured_media_url;
  return typeof url === 'string' ? url : undefined;
}

export function normalizePost(raw: WpRawPost): NormalizedPost {
  const title = raw.title?.rendered ?? '';
  const excerpt = raw.excerpt?.rendered ?? '';
  const content = raw.content?.rendered ?? '';
  return {
    id: raw.id,
    slug: raw.slug,
    data: {
      title: title.replace(/<[^>]+>/g, ''),
      excerpt: stripHtml(excerpt),
      date: raw.date,
      cover: getFeaturedImage(raw),
    },
    contentHtml: content,
  };
}

export async function listWpPosts(limit = 100): Promise<NormalizedPost[]> {
  const base = getWpBase();
  if (!base) return [];
  const url = `${base}/posts?status=publish&_embed=1&per_page=${Math.min(limit, 100)}`;
  const items = await fetchJson<WpRawPost[]>(url);
  return items.map(normalizePost);
}

export async function listWpPostsPage(page = 1, perPage = 9): Promise<{ posts: NormalizedPost[]; total: number; totalPages: number }>{
  const base = getWpBase();
  if (!base) return { posts: [], total: 0, totalPages: 0 };
  const url = `${base}/posts?status=publish&_embed=1&per_page=${Math.min(perPage, 100)}&page=${Math.max(1, page)}`;
  const { data, headers } = await fetchJsonWithHeaders<WpRawPost[]>(url);
  const total = Number(headers.get('X-WP-Total') || headers.get('x-wp-total') || data.length || 0);
  const totalPages = Number(headers.get('X-WP-TotalPages') || headers.get('x-wp-totalpages') || (total ? Math.ceil(total / perPage) : 0));
  return { posts: data.map(normalizePost), total, totalPages };
}

export async function getWpPostBySlug(slug: string): Promise<NormalizedPost | undefined> {
  const base = getWpBase();
  if (!base) return undefined;
  const url = `${base}/posts?slug=${encodeURIComponent(slug)}&_embed=1`;
  const items = await fetchJson<WpRawPost[]>(url);
  const first = items?.[0];
  return first ? normalizePost(first) : undefined;
}
