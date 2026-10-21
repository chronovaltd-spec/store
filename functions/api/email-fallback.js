const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 32_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function onRequestPost({ request, env }) {
  // This endpoint is called by the storefront on the same origin. Reject cross-origin
  // browser requests; also add a Cloudflare rate-limit rule before enabling in production.
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return json({ ok: false, message: 'Request origin is not allowed.' }, 403);
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ ok: false, message: 'Expected a JSON request.' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, message: 'Request is too large.' }, 413);
  }

  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, message: 'Request is too large.' }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, message: 'Invalid JSON request.' }, 400);
  }

  const { action, requestId, orderNumber, recipientRole, message } = body || {};
  if (!['send-order-email', 'send-contact-email'].includes(action)) {
    return json({ ok: false, message: 'Unsupported email action.' }, 400);
  }
  if (typeof requestId !== 'string' || requestId.length < 1 || requestId.length > 100) {
    return json({ ok: false, message: 'Invalid request identifier.' }, 400);
  }
  if (action === 'send-order-email' && (typeof orderNumber !== 'string' || orderNumber.length > 100)) {
    return json({ ok: false, message: 'Invalid order number.' }, 400);
  }
  if (!message || typeof message !== 'object') {
    return json({ ok: false, message: 'Missing email message.' }, 400);
  }

  const to = typeof message.to_email === 'string' ? message.to_email.trim() : '';
  const replyTo = typeof message.reply_to === 'string' ? message.reply_to.trim() : '';
  const subject = typeof message.subject === 'string' ? message.subject.trim() : '';
  const text = typeof message.message_text === 'string' ? message.message_text : '';

  if (!EMAIL_RE.test(to) || !EMAIL_RE.test(replyTo) || !subject || subject.length > 200 || !text || text.length > 20_000) {
    return json({ ok: false, message: 'Email fields are missing or invalid.' }, 400);
  }
  if (action === 'send-order-email' && !['customer', 'store'].includes(recipientRole)) {
    return json({ ok: false, message: 'Invalid order email recipient type.' }, 400);
  }
  if (action === 'send-contact-email' && recipientRole !== 'store') {
    return json({ ok: false, message: 'Invalid contact email recipient type.' }, 400);
  }
  if ((recipientRole === 'store') && (!env.STORE_EMAIL || to.toLowerCase() !== env.STORE_EMAIL.trim().toLowerCase())) {
    return json({ ok: false, message: 'Store recipient does not match the configured address.' }, 400);
  }
  if (!env.RESEND_API_KEY || !env.RESEND_FROM || !env.STORE_EMAIL) {
    console.error('Resend fallback is missing one or more required server environment variables.');
    return json({ ok: false, message: 'Email fallback is not configured.' }, 503);
  }

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
        tags: [
          { name: 'provider', value: 'chronova-pages-fallback' },
          { name: 'action', value: action },
          ...(orderNumber ? [{ name: 'order_number', value: orderNumber.slice(0, 256) }] : []),
        ],
      }),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !result.id) {
      console.error('Resend rejected a fallback email:', upstream.status, result);
      return json({ ok: false, message: 'Resend could not accept this email.' }, 502);
    }
    return json({ ok: true, provider: 'resend', id: result.id });
  } catch (error) {
    console.error('Resend fallback request failed:', error);
    return json({ ok: false, message: 'Email provider could not be reached.' }, 502);
  }
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
    });
  }
  return onRequestPost(context);
}
