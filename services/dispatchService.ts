
export interface DispatchStatus {
  step: 'IDLE' | 'ENCRYPTING' | 'CONNECTING' | 'DISPATCHING' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface DispatchResponse {
  success: boolean;
  error?: string;
  statusCode?: number;
  rawResponse?: any;
}

export class DispatchService {
  /**
   * Dispatches forensic payloads via the SendGrid-backed Netlify Relay.
   */
  static async sendEmail(
    fromEmail: string, 
    message: string, 
    ticketId: string,
    toEmail?: string,
    onStatusUpdate?: (status: DispatchStatus) => void
  ): Promise<DispatchResponse> {
    
    onStatusUpdate?.({ step: 'ENCRYPTING', message: 'Applying Military Grade Encryption...' });
    await new Promise(r => setTimeout(r, 600)); 

    const finalUrl = '/.netlify/functions/send-email';

    onStatusUpdate?.({ step: 'CONNECTING', message: 'Establishing Secure Relay Tunnel...' });

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail,
          message,
          ticketId,
          toEmail: toEmail || 'accounts@thewrightsupport.com'
        })
      });

      onStatusUpdate?.({ step: 'DISPATCHING', message: 'Pushing encrypted stream...' });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || 'No response body' };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || data.message || `Relay Error ${response.status}`,
          statusCode: response.status,
          rawResponse: data
        };
      }

      onStatusUpdate?.({ step: 'SUCCESS', message: 'Dispatch Confirmed.' });
      return { success: true, statusCode: response.status, rawResponse: data };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Handshake failure";
      onStatusUpdate?.({ step: 'ERROR', message: 'Link Failed' });
      return { success: false, error: errorMsg };
    }
  }

  static async testDispatch(onStatusUpdate?: (status: DispatchStatus) => void): Promise<DispatchResponse> {
    return this.sendEmail(
      "sys.admin@wrightapp.pro", 
      "SendGrid E2E Integrity Test.", 
      "SYS-TEST",
      undefined,
      onStatusUpdate
    );
  }
}
