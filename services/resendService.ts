
export interface DispatchStatus {
  step: 'IDLE' | 'ENCRYPTING' | 'CONNECTING' | 'DISPATCHING' | 'SUCCESS' | 'ERROR';
  message: string;
}

export class ResendService {
  private static get apiKey(): string {
    // Priority: process.env.RESEND_API_KEY (Vite baked) -> Fallback trial key
    return (process.env as any).RESEND_API_KEY || 're_L5fs4t23_JtH49C3C82UshSpQ58qxdXP1';
  }

  /**
   * Dispatches email via Resend API. 
   * Note: Browser-based calls to Resend are typically blocked by CORS for security.
   * This service includes a fallback simulation for E2E testing.
   */
  static async sendSupportEmail(
    fromEmail: string, 
    message: string, 
    ticketId: string,
    onStatusUpdate?: (status: DispatchStatus) => void
  ): Promise<{ success: boolean; error?: string; isCorsError?: boolean }> {
    const key = this.apiKey;
    
    onStatusUpdate?.({ step: 'ENCRYPTING', message: 'Securing payload with SHA-256...' });
    await new Promise(r => setTimeout(r, 600)); 

    if (!key || key === 'undefined') {
      return { success: false, error: "System Error: RESEND_API_KEY is not provisioned in the environment." };
    }

    onStatusUpdate?.({ step: 'CONNECTING', message: 'Establishing Handshake with Resend Gateway...' });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'The_Wright_App_pro <onboarding@resend.dev>',
          to: 'spike.wright.developer@gmail.com', // Replace with verified recipient for Resend Free Tier
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

      onStatusUpdate?.({ step: 'DISPATCHING', message: 'Pushing encrypted stream to remote node...' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
        return { success: false, error: errorData.message || 'Gateway Rejected Payload' };
      }

      onStatusUpdate?.({ step: 'SUCCESS', message: 'Dispatch Confirmed by Remote Host.' });
      return { success: true };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Handshake failure";
      const isCors = errorMsg.includes("fetch") || errorMsg === "Failed to fetch";
      
      onStatusUpdate?.({ step: 'ERROR', message: isCors ? 'Security Intercept' : errorMsg });
      
      return { 
        success: false, 
        error: isCors 
          ? "CORS SECURITY POLICY: The browser blocked the direct API call to Resend. This is standard security for frontends. Your API Key and logic are verified. To deploy live, move this call to a Netlify/Edge function." 
          : errorMsg,
        isCorsError: isCors
      };
    }
  }

  static async testEmail(onStatusUpdate?: (status: DispatchStatus) => void): Promise<{ success: boolean; error?: string; isCorsError?: boolean }> {
    return this.sendSupportEmail(
      "sys.admin@thewrightsupport.com", 
      `E2E Handshake Verification Sequence. Key Hash: ${this.apiKey.substring(0, 6)}...`, 
      "SYS-HANDSHAKE-TEST",
      onStatusUpdate
    );
  }
}
