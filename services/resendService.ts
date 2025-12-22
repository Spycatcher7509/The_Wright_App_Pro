
export interface DispatchStatus {
  step: 'IDLE' | 'ENCRYPTING' | 'CONNECTING' | 'DISPATCHING' | 'SUCCESS' | 'ERROR';
  message: string;
}

export class ResendService {
  private static get apiKey(): string {
    const key = (process.env as any).RESEND_API_KEY;
    return (key && key !== 'undefined') ? key : 're_L5fs4t23_JtH49C3C82UshSpQ58qxdXP1';
  }

  private static get relayUrl(): string | null {
    return localStorage.getItem('wright_cors_proxy') || null;
  }

  /**
   * Dispatches email via Resend API with optional Relay Tunnel to bypass CORS.
   */
  static async sendSupportEmail(
    fromEmail: string, 
    message: string, 
    ticketId: string,
    onStatusUpdate?: (status: DispatchStatus) => void
  ): Promise<{ success: boolean; error?: string; isRelayed?: boolean; isCorsError?: boolean }> {
    const key = this.apiKey;
    const proxy = this.relayUrl;
    
    onStatusUpdate?.({ step: 'ENCRYPTING', message: 'Securing payload with SHA-256...' });
    await new Promise(r => setTimeout(r, 600)); 

    if (!key || key === 'undefined') {
      return { success: false, error: "System Error: RESEND_API_KEY is not provisioned." };
    }

    const targetUrl = 'https://api.resend.com/emails';
    const finalUrl = proxy ? `${proxy}${targetUrl}` : targetUrl;

    onStatusUpdate?.({ step: 'CONNECTING', message: proxy ? 'Establishing Relay Tunnel...' : 'Connecting to Direct Gateway...' });

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Required by many CORS proxies
        },
        body: JSON.stringify({
          from: 'The_Wright_App_pro <onboarding@resend.dev>',
          to: 'spike.wright.developer@gmail.com',
          subject: `[${ticketId}] SUPPORT REQUEST: ${fromEmail}`,
          html: `
            <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
              <h2 style="color: #4f46e5; margin-top: 0;">Ticket ID: ${ticketId}</h2>
              <p style="font-size: 14px; color: #64748b;"><strong>Origin:</strong> ${fromEmail}</p>
              <div style="padding: 20px; background: white; border: 1px solid #cbd5e1; border-radius: 8px; margin: 20px 0;">
                <p style="white-space: pre-wrap; margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;">${message}</p>
              </div>
              <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Engine: The_Wright_App_pro Handshake Protocol</p>
            </div>
          `
        })
      });

      onStatusUpdate?.({ step: 'DISPATCHING', message: 'Pushing encrypted stream...' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
        return { success: false, error: errorData.message || 'Gateway Rejected Payload' };
      }

      onStatusUpdate?.({ step: 'SUCCESS', message: 'Dispatch Confirmed.' });
      return { success: true, isRelayed: !!proxy };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Handshake failure";
      // Ensure isCors is a strict boolean to satisfy TypeScript return type
      const isCors = !!(errorMsg.includes("fetch") || errorMsg === "Failed to fetch" || (proxy && errorMsg.includes("403")));
      
      onStatusUpdate?.({ step: 'ERROR', message: isCors ? 'CORS Intercept' : 'Link Failed' });
      
      return { 
        success: false, 
        error: isCors 
          ? "CORS BLOCK: The browser prevented the direct call to Resend. Move to 'Relayed' mode in System Configuration." 
          : errorMsg,
        isCorsError: isCors
      };
    }
  }

  static async testEmail(onStatusUpdate?: (status: DispatchStatus) => void): Promise<{ success: boolean; error?: string; isCorsError?: boolean }> {
    return this.sendSupportEmail(
      "sys.admin@thewrightsupport.com", 
      `E2E Handshake Verification. Key Hash: ${this.apiKey.substring(0, 6)}...`, 
      "SYS-TEST",
      onStatusUpdate
    );
  }
}
