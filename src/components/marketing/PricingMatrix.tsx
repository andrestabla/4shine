import { withClient } from '@/server/db/pool';
import { listPlans } from '@/features/planes/service';
import { listActiveProducts } from '@/features/access/service';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import type { CommercialProductRecord } from '@/features/access/types';
import { PricingMatrixClient } from './PricingMatrixClient';

export async function PricingMatrix() {
  let plans: SubscriptionPlanWithFeatures[] = [];
  let catalog: CommercialProductRecord[] = [];
  try {
    await withClient(async (client) => {
      plans = await listPlans(client, { includeInactive: false });
      catalog = await listActiveProducts(client);
    });
  } catch {
    plans = [];
    catalog = [];
  }
  return <PricingMatrixClient plans={plans} catalog={catalog} />;
}
