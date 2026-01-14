export const prerender = false;
import type { APIRoute } from 'astro';
import * as nodemailer from 'nodemailer';

const REQUIRED = ['name', 'email', 'subject', 'message'] as const;

// In-memory rate limiting store (IP -> { count, resetTime })
// In production on cPanel, consider using Redis or a database for persistence across restarts
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 emails per hour per IP

function getRateLimitKey(request: Request): string {
  // Try to get client IP from common headers
  const clientIP =
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-forwarded-for')?.split(',')[0] || // Nginx/Apache with proxy
    request.headers.get('x-real-ip') || // X-Real-IP header
    'unknown';
  return clientIP.trim();
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count < RATE_LIMIT_MAX_REQUESTS) {
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
  }

  return { allowed: false, remaining: 0 };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const isDebug = url.searchParams.get('debug') === '1';
    const data = await request.json().catch(() => ({}));
    
    // Get client IP for rate limiting
    const clientIP = getRateLimitKey(request);
    const { allowed, remaining } = checkRateLimit(clientIP);

    // Check rate limit
    if (!allowed) {
      console.warn(`[contact] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Has excedido el límite de mensajes. Intenta de nuevo más tarde.' }),
        { 
          status: 429,
          headers: {
            'Retry-After': '3600', // Retry after 1 hour
          }
        }
      );
    }

    // Resolve env from process.env or import.meta.env (avoid dynamic object access)
    const rawUser = (
      process.env.GMAIL_USER ?? (import.meta as any).env?.GMAIL_USER ?? ''
    ).toString();
    const rawPass = (
      process.env.GMAIL_APP_PASSWORD ?? (import.meta as any).env?.GMAIL_APP_PASSWORD ?? ''
    ).toString();
    const rawTo = (
      data.to ?? process.env.CONTACT_TO ?? (import.meta as any).env?.CONTACT_TO ?? ''
    ).toString();

    // Gmail app passwords sometimes are pasted with spaces, strip whitespace just in case
    const user = rawUser.trim();
    const pass = rawPass.replace(/\s+/g, '').trim();
    const to = (rawTo || user || 'devweb.venta@gmail.com').toString();

    // Optional debug probe (safe: no secrets leaked)
    if (isDebug) {
      return new Response(
        JSON.stringify({
          ok: true,
          debug: {
            hasUser: Boolean(user),
            hasPass: Boolean(pass),
            to,
            rateLimit: { allowed, remaining },
          },
        }),
        { status: 200 }
      );
    }

    // Basic validation
    for (const key of REQUIRED) {
      if (!data?.[key] || String(data[key]).trim() === '') {
        return new Response(JSON.stringify({ error: `Falta el campo: ${key}` }), { status: 400 });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = String(data.email);
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'El email no es válido.' }), { status: 400 });
    }

    // Validate message length (prevent spam)
    const message = String(data.message);
    if (message.length > 5000) {
      return new Response(JSON.stringify({ error: 'El mensaje es demasiado largo (máximo 5000 caracteres).' }), { status: 400 });
    }

    const name = String(data.name);
    const subject = String(data.subject);
    
    if (!user || !pass) {
      console.error('[contact] Missing envs:', {
        hasUser: Boolean(user),
        hasPass: Boolean(pass),
      });
      return new Response(
        JSON.stringify({ error: 'Servidor no configurado para enviar correo (faltan variables de entorno).'}),
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    try {
      // Verify SMTP credentials before sending
      await transporter.verify();
    } catch (e: any) {
      console.error('[contact] SMTP verify failed:', e?.code || e?.message || e);
      return new Response(
        JSON.stringify({ error: 'No se pudo autenticar con Gmail. Verifica GMAIL_USER y GMAIL_APP_PASSWORD.' }),
        { status: 500 }
      );
    }

    const html = `
      <h2>Nuevo mensaje desde Canvas Docente</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `;

    await transporter.sendMail({
      from: `Canvas Docente <${user}>`,
      to,
      replyTo: email,
      subject: `[Contacto] ${subject}`,
      text: `Nombre: ${name}\nEmail: ${email}\nAsunto: ${subject}\n\n${message}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('Contact error', err);
    return new Response(
      JSON.stringify({ error: 'Error al enviar el mensaje.', code: err?.code || undefined }),
      { status: 500 }
    );
  }
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const isDebug = url.searchParams.get('debug') === '1';
    if (!isDebug) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const rawUser = (
      process.env.GMAIL_USER ?? (import.meta as any).env?.GMAIL_USER ?? ''
    ).toString();
    const rawPass = (
      process.env.GMAIL_APP_PASSWORD ?? (import.meta as any).env?.GMAIL_APP_PASSWORD ?? ''
    ).toString();
    const rawTo = (
      process.env.CONTACT_TO ?? (import.meta as any).env?.CONTACT_TO ?? ''
    ).toString();
    const user = rawUser.trim();
    const pass = rawPass.replace(/\s+/g, '').trim();
    const to = (rawTo || user || 'devweb.venta@gmail.com').toString();

    // If missing envs, report immediately
    if (!user || !pass) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing-env', debug: { hasUser: Boolean(user), hasPass: Boolean(pass), to } }),
        { status: 200 }
      );
    }

    // Try verifying SMTP credentials (no email sent)
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    try {
      await transporter.verify();
      return new Response(
        JSON.stringify({ ok: true, debug: { hasUser: true, hasPass: true, to, smtpVerify: 'ok' } }),
        { status: 200 }
      );
    } catch (e: any) {
      console.error('[contact][debug] SMTP verify failed:', e?.code || e?.message || e);
      return new Response(
        JSON.stringify({ ok: false, error: 'smtp-verify', code: e?.code, message: e?.message, debug: { hasUser: true, hasPass: true, to } }),
        { status: 200 }
      );
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
};
