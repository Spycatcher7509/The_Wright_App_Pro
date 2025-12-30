
import type { Handler } from '@netlify/functions';
import sgMail from '@sendgrid/mail';

/**
 * THE_WRIGHT_APP_PRO: SENDGRID DISPATCH RELAY
 * This function routes forensic payloads via the SendGrid Master API.
 * 
 * REQUIRED ENV VARS:
 * - SENDGRID_API_KEY: The verified SendGrid Master Key.
 * - SENDGRID_FROM_EMAIL: The verified sender address (e.g. support@wrightapp.pro).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: 'PROTOCOL_ERROR: Only POST is authorised.' }) 
    };
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const verifiedFrom = process.env.SENDGRID_FROM_EMAIL || 'support@wrightapp.pro';

  if (!apiKey) {
    console.error("[CRITICAL] SENDGRID_API_KEY missing from Netlify environment.");
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'VAULT_ERROR: SendGrid Security Key is not provisioned.' }) 
    };
  }

  sgMail.setApiKey(apiKey);

  try {
    const { fromEmail, message, ticketId, toEmail } = JSON.parse(event.body || '{}');
    
    // Default to admin support if no specific destination is provided
    const recipient = toEmail || 'accounts@thewrightsupport.com';
    const isReply = recipient !== 'accounts@thewrightsupport.com';

    console.log(`[DISPATCH] SendGrid Handshake: Ticket ${ticketId} -> ${recipient}`);

    const msg = {
      to: recipient,
      from: verifiedFrom,
      replyTo: fromEmail,
      subject: `[${ticketId}] ${isReply ? 'ADMIN REPLY' : 'FORENSIC DISPATCH'}: ${fromEmail}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; padding: 40px; background-color: #f8fafc; color: #1e293b;">
          <div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 40px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-style: italic; font-weight: 900; letter-spacing: -0.05em;">The_Wright_App_pro</h1>
            <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 30px; font-weight: 800;">Forensic Dispatch Protocol</p>
            
            <div style="margin-bottom: 25px;">
              <span style="background: #eef2ff; color: #6366f1; padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 900; border: 1px solid #e0e7ff;">TICKET REF: ${ticketId}</span>
            </div>

            <div style="background: #f1f5f9; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <p style="color: #0f172a; font-size: 15px; line-height: 1.7; margin: 0; font-weight: 500;">${message}</p>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
              <p style="color: #94a3b8; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">Verified SendGrid Relay | Spike Wright</p>
              <p style="color: #cbd5e1; font-size: 8px; margin-top: 4px;">Source: ${fromEmail}</p>
            </div>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'DISPATCH_SUCCESS' }),
    };
  } catch (error: any) {
    console.error("[CRITICAL] SendGrid Relay Failure:", error);
    
    // Extract specific SendGrid errors if available
    const sgError = error.response ? error.response.body : String(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'RELAY_CRASH', 
        error: error.message || 'SendGrid Gateway Timeout',
        details: sgError
      }),
    };
  }
};
