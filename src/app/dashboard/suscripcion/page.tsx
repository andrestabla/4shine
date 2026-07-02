'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { SubscriptionPlansGrid } from '@/components/dashboard/planes/SubscriptionPlansGrid';
import { requestApi } from '@/lib/api-client';
import { formatDate } from '@/lib/format-date';

interface MeSubscription {
  subscriptionPlanId: string | null;
  planCode: string | null;
  planName: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
}

// Etiqueta visible del módulo que originó el "muro" (param ?desde=<moduleCode>).
const MODULE_LABELS: Record<string, string> = {
  trayectoria: 'Trayectoria',
  networking: 'Networking',
  convocatorias: 'Convocatorias',
  mensajes: 'Mensajes',
  workshops: 'Workshops',
  mentorias: 'Mentorías',
  aprendizaje: 'Aprendizaje',
  descubrimiento: 'Descubrimiento',
};

function SuscripcionInner() {
  const searchParams = useSearchParams();
  const desde = searchParams.get('desde') || '';
  const desdeLabel = MODULE_LABELS[desde] || '';

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

      {desdeLabel && (
        <div className="flex items-start gap-3 rounded-[1rem] border border-[var(--brand-border-strong)] bg-[var(--brand-surface-strong)] p-4">
          <Lock size={16} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <p className="text-sm text-[var(--app-ink)]">
            Estás aquí porque <strong>{desdeLabel}</strong> requiere un plan que lo incluya.
            Resaltamos abajo los planes que lo desbloquean.
          </p>
        </div>
      )}

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
                  {formatDate(me.subscriptionExpiresAt)}
                </p>
              )}
            </div>
          )}

          <SubscriptionPlansGrid
            currentPlanId={me?.subscriptionPlanId ?? null}
            highlightModule={desde || null}
          />
        </>
      )}
    </div>
  );
}

export default function SuscripcionPage() {
  return (
    <Suspense fallback={null}>
      <SuscripcionInner />
    </Suspense>
  );
}
