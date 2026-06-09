import { requestApi } from '@/lib/api-client';
import type {
  EnabledPaymentProvidersResponse,
  PaymentInitiationResult,
  PaymentProviderKey,
} from './types';

export type {
  EnabledPaymentProvidersResponse,
  PaymentInitiationResult,
  PaymentProviderInfo,
  PaymentProviderKey,
} from './types';

export async function getEnabledPaymentProviders(): Promise<EnabledPaymentProvidersResponse> {
  return requestApi<EnabledPaymentProvidersResponse>('/api/v1/payments/providers');
}

export async function createMentorshipCheckout(input: {
  orderId: string;
  provider: PaymentProviderKey;
}): Promise<PaymentInitiationResult> {
  return requestApi<PaymentInitiationResult>('/api/v1/payments/mentorias/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
