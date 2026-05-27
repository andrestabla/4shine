import { withClient } from '@/server/db/pool';
import { listPlans } from '@/features/planes/service';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import { PricingMatrixClient } from './PricingMatrixClient';

export async function PricingMatrix() {
  let plans: SubscriptionPlanWithFeatures[] = [];
  try {
    plans = await withClient((client) => listPlans(client, { includeInactive: false }));
  } catch {
    plans = [];
  }
  return <PricingMatrixClient plans={plans} />;
}
