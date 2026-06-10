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

// ─── Workshops ───────────────────────────────────────────────────────────────

export interface WorkshopOrderRecord {
  orderId: string;
  workshopId: string;
  workshopTitle: string;
  ownerUserId: string;
  priceAmount: number;
  currencyCode: string;
  status: 'pending_payment' | 'paid' | 'cancelled' | 'refunded';
  paymentProvider: PaymentProviderKey | 'manual' | null;
  paymentReference: string | null;
  paymentStatus: string;
  paymentRedirectUrl: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReference: string | null;
  refundReason: string | null;
  attendanceStatus: 'registered' | 'waitlist' | null;
  createdAt: string;
  updatedAt: string;
}

export async function createWorkshopOrder(workshopId: string): Promise<{
  order: WorkshopOrderRecord;
  reused: boolean;
}> {
  return requestApi(`/api/v1/modules/workshops/${workshopId}/orders`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function createWorkshopCheckout(input: {
  orderId: string;
  provider: PaymentProviderKey;
}): Promise<PaymentInitiationResult> {
  return requestApi<PaymentInitiationResult>('/api/v1/payments/workshops/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Admin (pagos) ───────────────────────────────────────────────────────────

export interface MentorshipPaymentRecord {
  orderId: string;
  ownerName: string;
  ownerEmail: string;
  mentorName: string | null;
  title: string;
  topic: string | null;
  scheduledStartsAt: string | null;
  priceAmount: number;
  currencyCode: string;
  paymentProvider: PaymentProviderKey | 'manual' | null;
  paymentStatus: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
}

export interface PaymentAttemptRecord {
  attemptId: string;
  orderId: string;
  provider: PaymentProviderKey | 'manual';
  status: string;
  reference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export async function listMentorshipPaymentsAdmin(): Promise<MentorshipPaymentRecord[]> {
  return requestApi<MentorshipPaymentRecord[]>('/api/v1/payments/mentorias/admin/orders');
}

export async function listPaymentAttemptsAdmin(orderId: string): Promise<PaymentAttemptRecord[]> {
  return requestApi<PaymentAttemptRecord[]>(
    `/api/v1/payments/mentorias/admin/orders/${orderId}/attempts`,
  );
}

export async function refundMentorshipOrder(input: {
  orderId: string;
  reason: string;
}): Promise<{ orderId: string; provider: string; refundReference: string | null; status: string }> {
  return requestApi(`/api/v1/payments/mentorias/admin/orders/${input.orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason: input.reason }),
    timeoutMs: 60000,
  });
}
