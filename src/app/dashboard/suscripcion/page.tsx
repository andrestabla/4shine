'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { SubscriptionPlansGrid } from '@/components/dashboard/planes/SubscriptionPlansGrid';
import { requestApi } from '@/lib/api-client';

interface MeSubscription {
  subscriptionPlanId: string | null;
  planCode: string | null;
  planName: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
}

export default function SuscripcionPage() {
  const [me, setMe] = useState<MeSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await requestApi<MeSubscription>('/api/v1/me/subscription');
        setMe(data);
      } catch {
        setMe({
          subscriptionPlanId: null,
          planCode: null,
          planName: null,
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Mi suscripción"
        subtitle="Elige el plan que mejor se ajusta a tu momento. Cada plan define el acceso a los módulos de la plataforma."
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--app-muted)]">
          Cargando tu suscripción…
        </div>
      ) : (
        <>
          {me?.subscriptionPlanId && me?.planName && (
            <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Plan activo: {me.planName}</p>
              {me.subscriptionExpiresAt && (
                <p className="mt-0.5 text-xs text-emerald-800/80">
                  Vigencia hasta{' '}
                  {new Date(me.subscriptionExpiresAt).toLocaleDateString('es-CO', {
                    dateStyle: 'long',
                  })}
                </p>
              )}
            </div>
          )}

          <SubscriptionPlansGrid currentPlanId={me?.subscriptionPlanId ?? null} />
        </>
      )}
    </div>
  );
}
