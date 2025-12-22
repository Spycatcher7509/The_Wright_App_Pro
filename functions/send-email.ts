
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server Configuration Error: Missing API Key' }) };
  }

  try {
    const { fromEmail, message, ticketId } = JSON.parse(event.body || '{}');

    // Updated 'from' to verified domain and 'to' to the requested support address
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The_Wright_App_pro <support@mysecureapp.co.uk>',
        to: 'accounts@thewrightsupport.com',
        reply_to: fromEmail,
        subject: `[${ticketId}] SUPPORT REQUEST: ${fromEmail}`,
        html: `
          <div style="font-family: sans-serif; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-style: italic; font-weight: 900;">The_Wright_App_pro</h2>
              <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 5px;">Forensic Dispatch Protocol | Military Grade Encryption</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <span style="font-size: 10px; font-weight: 900; color: #6366f1; background: #eef2ff; padding: 4px 12px; border-radius: 100px; text-transform: uppercase;">Ticket: ${ticketId}</span>
            </div>

            <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
              <strong>Originating Identity:</strong><br/>
              <span style="color: #1e293b; font-family: monospace;">${fromEmail}</span>
            </p>

            <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin: 24px 0;">
              <p style="white-space: pre-wrap; margin: 0; color: #0f172a; font-size: 15px; line-height: 1.7; font-weight: 500;">${message}</p>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; pt: 20px; text-align: center;">
              <p style="font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.3em; margin: 0;">Verified Military Grade Dual-Block Handshake | Spike Wright</p>
            </div>
          </div>
        `
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email dispatched successfully via Verified Domain', id: data.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: String(error) }),
    };
  }
};
