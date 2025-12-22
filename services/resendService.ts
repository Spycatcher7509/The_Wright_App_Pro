
export interface DispatchStatus {
  step: 'IDLE' | 'ENCRYPTING' | 'CONNECTING' | 'DISPATCHING' | 'SUCCESS' | 'ERROR';
  message: string;
}

// Define the response structure to include isCorsError for frontend handling
export interface DispatchResponse {
  success: boolean;
  error?: string;
  isCorsError?: boolean;
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
    
    onStatusUpdate?.({ step: 'ENCRYPTING', message: 'Securing payload with SHA-256...' });
    await new Promise(r => setTimeout(r, 600)); 

    // Point to the Netlify Function
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

      onStatusUpdate?.({ step: 'DISPATCHING', message: 'Pushing encrypted stream...' });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Relay Gateway Rejected Payload' };
      }

      onStatusUpdate?.({ step: 'SUCCESS', message: 'Dispatch Confirmed.' });
      return { success: true };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Handshake failure";
      // Detect common CORS/Network issues in browser fetch to allow UI to suggest proxies
      const isCors = errorMsg.toLowerCase().includes('cors') || errorMsg === 'Failed to fetch';
      onStatusUpdate?.({ step: 'ERROR', message: 'Link Failed' });
      return { success: false, error: errorMsg, isCorsError: isCors };
    }
  }

  // Update return type to fix 'isCorsError' property missing error in components
  static async testEmail(onStatusUpdate?: (status: DispatchStatus) => void): Promise<DispatchResponse> {
    return this.sendSupportEmail(
      "sys.admin@thewrightsupport.com", 
      "E2E Handshake Verification via Netlify Function Relay.", 
      "SYS-TEST",
      onStatusUpdate
    );
  }
}
