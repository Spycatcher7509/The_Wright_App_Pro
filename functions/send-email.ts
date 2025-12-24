export async function handler(event) {
  // Basic CORS (adjust origin if you want to lock it down)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const defaultTo = process.env.CONTACT_TO;

  if (!apiKey || !from) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: "Missing RESEND_API_KEY or RESEND_FROM in Netlify env vars",
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: "Invalid JSON" };
  }

  const to = payload.to ?? defaultTo;
  const subject = (payload.subject ?? "").toString().trim();
  const message = (payload.message ?? "").toString().trim();
  const replyTo = (payload.replyTo ?? "").toString().trim();

  if (!to || !subject || !message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Required: to (or CONTACT_TO), subject, message",
    };
  }

  const resendBody = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    // Keep it simple: HTML + text fallback
    html: `<div style="font-family:system-ui,Segoe UI,Roboto,Arial">
             <h3>${escapeHtml(subject)}</h3>
             <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
           </div>`,
    text: message,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendBody),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: json }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, data: json }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
