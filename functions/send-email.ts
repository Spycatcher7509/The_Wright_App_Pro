export async function handler(event) {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Change "*" to your specific domain in production for better security
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // 1. Handle Preflight Options
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  // 2. Reject non-POST methods
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  // 3. Load Environment Variables
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const defaultTo = process.env.CONTACT_TO;

  if (!apiKey || !from) {
    console.error("Missing Env Vars: RESEND_API_KEY or RESEND_FROM");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Server configuration error" }),
    };
  }

  // 4. Parse Body
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

  // 5. Validate Input
  if (!to || !subject || !message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Missing required fields: to, subject, or message" }),
    };
  }

  // 6. Construct Resend Payload
  const resendBody = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: `<div style="font-family:system-ui,Segoe UI,Roboto,Arial">
             <h3>${escapeHtml(subject)}</h3>
             <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
           </div>`,
    text: message,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  // 7. Send to Resend
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
      console.error("Resend API Error:", json);
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
    console.error("Function Error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
}

// Helper to prevent HTML injection
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
