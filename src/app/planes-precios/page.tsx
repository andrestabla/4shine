import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PricingMatrix } from '@/components/marketing/PricingMatrix';
import { BlockRenderer } from '@/components/site-builder/BlockRenderer';
import { getPublicPageByKey } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlanesPreciosPage() {
  const builderPage = await getPublicPageByKey('planes_precios');
  if (builderPage && !builderPage.isVisible) notFound();
  if (builderPage?.useBuilder && builderPage.sections.length > 0) {
    return (
      <MarketingShell>
        <BlockRenderer sections={builderPage.sections} />
      </MarketingShell>
    );
  }
  return (
    <MarketingShell
      title="Planes y precios"
      subtitle="Elige el acceso que mejor se ajusta a tu momento. Todos los caminos llevan a Stripe — pago seguro, sin fricciones."
    >
      <PricingMatrix />
    </MarketingShell>
  );
}
