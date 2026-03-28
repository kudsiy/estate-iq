

export interface ChapaCheckoutData {
  amount: number;
  currency: "ETB" | "USD";
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title: string;
    description: string;
  };
}

export interface ChapaWebhookPayload {
  event: string;
  tx_ref: string;
  status: "success" | "failed";
  currency: string;
  amount: number;
}

/**
 * Mocks generating a Chapa payment link.
 * In production, you would use axios/fetch to hit https://api.chapa.co/v1/transaction/initialize
 */
export async function createChapaCheckoutSession(data: ChapaCheckoutData & { plan?: string }): Promise<string> {
  // If we had a real CHAPA_SECRET_KEY, we'd hit the API here.
  // For the mock, we simulate a checkout page URL.
  
  if (!process.env.CHAPA_SECRET_KEY) {
    console.warn("[Chapa Mock] Using mocked Chapa session generation");
  }

  // Generate a mock checkout URL.
  // We include the tx_ref in a local route so we can simulate the callback.
  const appBaseUrl = process.env.BASE_URL || "http://localhost:5000";
  const planParam = data.plan ? `&plan=${encodeURIComponent(data.plan)}` : "";
  return `${appBaseUrl}/api/webhooks/chapa/mock-checkout?tx_ref=${encodeURIComponent(data.tx_ref)}&amount=${data.amount}&return_url=${encodeURIComponent(data.return_url)}${planParam}`;
}

/**
 * Verify Chapa Webhook Hash
 * In production, you verify the 'x-chapa-signature' header.
 */
export function verifyChapaWebhook(payload: Record<string, unknown>, signature: string): boolean {
  // Mock verification. Always true for now.
  return true;
}
