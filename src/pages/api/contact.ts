import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const REQUIRED = ['name', 'email', 'subject', 'message'] as const;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json().catch(() => ({}));
    // Basic validation
    for (const key of REQUIRED) {
      if (!data?.[key] || String(data[key]).trim() === '') {
        return new Response(JSON.stringify({ error: `Falta el campo: ${key}` }), { status: 400 });
      }
    }

    const name = String(data.name);
    const email = String(data.email);
    const subject = String(data.subject);
    const message = String(data.message);
    const to = String(
      data.to || process.env.CONTACT_TO || process.env.GMAIL_USER || 'devweb.venta@gmail.com'
    );

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD; // Use an app password
    if (!user || !pass) {
      return new Response(JSON.stringify({ error: 'Servidor no configurado para enviar correo (faltan variables de entorno).'}), { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

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
  } catch (err) {
    console.error('Contact error', err);
    return new Response(JSON.stringify({ error: 'Error al enviar el mensaje.' }), { status: 500 });
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
