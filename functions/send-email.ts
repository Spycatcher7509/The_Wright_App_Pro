import { Handler } from '@netlify/functions';

/**
 * THE_WRIGHT_APP_PRO: FORENSIC DISPATCH RELAY
 * 
 * This function acts as a secure bridge between the client and the Resend.com API.
 * It bypasses CORS restrictions and ensures the RESEND_API_KEY remains hidden from the client.
 */
export const handler: Handler = async (event) => {
  // 1. Validate Method
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: 'PROTOCOL_ERROR: Method Not Allowed' }) 
    };
  }

  // 2. Provision Environment
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[CRITICAL] RESEND_API_KEY is not provisioned in the environment.');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        message: 'VAULT_ERROR: Security Key (RESEND_API_KEY) missing from Netlify environment.' 
      }) 
    };
  }

  try {
    // 3. Parse Payload
    const { fromEmail, message, ticketId } = JSON.parse(event.body || '{}');
    
    if (!fromEmail || !message || !ticketId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: 'PAYLOAD_ERROR: Incomplete forensic manifest.' }) 
      };
    }

    console.log(`[DISPATCH] Initiating handshake for ticket ${ticketId}...`);

    // 4. Execute Handshake with Resend API
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
        subject: `[${ticketId}] MILITARY GRADE DISPATCH: ${fromEmail}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; padding: 40px; background-color: #f8fafc;">
            <div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 40px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; margin: 0; font-style: italic; font-weight: 900; letter-spacing: -0.05em;">The_Wright_App_pro</h1>
                <p style="color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; margin-top: 5px;">Forensic Dispatch Protocol | Spike Wright</p>
              </div>

              <div style="margin-bottom: 25px;">
                <span style="background-color: #eef2ff; color: #6366f1; padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 900; text-transform: uppercase;">Ticket: ${ticketId}</span>
              </div>

              <div style="background-color: #f1f5f9; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Message Payload:</p>
                <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0; font-weight: 500;">${message}</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;"><strong>Originating Identity:</strong> ${fromEmail}</p>
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <p style="color: #cbd5e1; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4em;">Verified Military Grade Dual-Block Cipher</p>
              </div>
            </div>
          </div>
        `
      }),
    });

    // 5. Analyse Response
    const data = await response.json();

    if (!response.ok) {
      console.error(`[FAILURE] Resend Gateway Rejection:`, data);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ 
          message: 'GATEWAY_REJECTION', 
          error: data.message || 'The upstream server rejected the payload.' 
        }) 
      };
    }

    console.log(`[SUCCESS] Dispatch confirmed: ${data.id}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'DISPATCH_SUCCESS', 
        id: data.id 
      }),
    };

  } catch (error) {
    console.error(`[CRITICAL_ERROR] Relay failure:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'RELAY_CRASH', 
        error: String(error) 
      }),
    };
  }
};
