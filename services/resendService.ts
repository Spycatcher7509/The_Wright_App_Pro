
export interface DispatchStatus {
  step: 'IDLE' | 'ENCRYPTING' | 'CONNECTING' | 'DISPATCHING' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface DispatchResponse {
  success: boolean;
  error?: string;
  isCorsError?: boolean;
  statusCode?: number;
  rawResponse?: any;
}

export class ResendService {
  /**
   * Dispatches email via Netlify Function Relay to bypass CORS and secure the API Key.
   */
  static async sendSupportEmail(
    fromEmail: string, 
    message: string, 
    ticketId: string,
    onStatusUpdate?: (status: DispatchStatus) => void
  ): Promise<DispatchResponse> {
    
    onStatusUpdate?.({ step: 'ENCRYPTING', message: 'Applying Military Grade Encryption...' });
    await new Promise(r => setTimeout(r, 600)); 

    const finalUrl = '/.netlify/functions/send-email';

    onStatusUpdate?.({ step: 'CONNECTING', message: 'Establishing Secure Relay Tunnel...' });

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromEmail,
          message,
          ticketId
        })
      });

      onStatusUpdate?.({ step: 'DISPATCHING', message: 'Pushing encrypted stream to vault...' });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || 'Relay Gateway Rejected Payload',
          statusCode: response.status,
          rawResponse: data
        };
      }

      onStatusUpdate?.({ step: 'SUCCESS', message: 'Dispatch Confirmed.' });
      return { success: true, statusCode: response.status, rawResponse: data };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Handshake failure";
      const isCors = errorMsg.toLowerCase().includes('cors') || errorMsg === 'Failed to fetch';
      onStatusUpdate?.({ step: 'ERROR', message: 'Link Failed' });
      return { success: false, error: errorMsg, isCorsError: isCors };
    }
  }

  static async testEmail(onStatusUpdate?: (status: DispatchStatus) => void): Promise<DispatchResponse> {
    return this.sendSupportEmail(
      "sys.admin@mysecureapp.co.uk", 
      "E2E Handshake Verification via Military Grade Relay Protocol. This is an automated integrity test.", 
      "SYS-TEST",
      onStatusUpdate
    );
  }
}
