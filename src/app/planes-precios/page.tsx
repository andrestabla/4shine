import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PricingMatrix } from '@/components/marketing/PricingMatrix';

export default function PlanesPreciosPage() {
  return (
    <MarketingShell
      title="Planes y precios"
      subtitle="Elige el acceso que mejor se ajusta a tu momento. Todos los caminos llevan a Stripe — pago seguro, sin fricciones."
    >
      <PricingMatrix />
    </MarketingShell>
  );
}
