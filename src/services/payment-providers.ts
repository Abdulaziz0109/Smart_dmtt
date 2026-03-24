export type ProviderResult = { success: boolean; reference: string };

export interface PaymentProvider {
  name: "click" | "payme";
  pay(invoiceId: string, amount: number): Promise<ProviderResult>;
}

class ClickMockProvider implements PaymentProvider {
  name = "click" as const;
  async pay(invoiceId: string, amount: number) {
    return { success: true, reference: `CLICK-${invoiceId.slice(0, 6)}-${Math.round(amount)}` };
  }
}

class PaymeMockProvider implements PaymentProvider {
  name = "payme" as const;
  async pay(invoiceId: string, amount: number) {
    return { success: true, reference: `PAYME-${invoiceId.slice(0, 6)}-${Math.round(amount)}` };
  }
}

const providers: Record<string, PaymentProvider> = {
  click: new ClickMockProvider(),
  payme: new PaymeMockProvider()
};

export function getProvider(provider: "click" | "payme") {
  return providers[provider];
}
