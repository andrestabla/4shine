export type PaymentProviderKey = 'stripe' | 'wompi';

export interface PaymentProviderInfo {
  key: PaymentProviderKey;
  label: string;
  description: string;
  /** Order in which providers appear in UI (lower first). */
  sortOrder: number;
}

export interface EnabledPaymentProvidersResponse {
  providers: PaymentProviderInfo[];
  manualFallback: {
    enabled: boolean;
    label: string;
    description: string;
  };
}

export interface PaymentInitiationResult {
  /** External URL the user should be redirected to in order to complete payment. */
  redirectUrl: string;
  /** Provider-side reference for this payment attempt. */
  reference: string;
  provider: PaymentProviderKey;
}
