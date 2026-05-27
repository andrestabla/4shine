'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { PlanEditor } from '@/components/dashboard/planes/PlanEditor';
import { getPlan } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/client';

export default function EditarPlanPage() {
  const params = useParams<{ id: string }>();
  const planId = params?.id;
  const [plan, setPlan] = useState<SubscriptionPlanWithFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getPlan(planId);
      if (cancelled) return;
      if (res.ok && res.data) setPlan(res.data);
      else setError(res.error ?? 'Error al cargar el plan');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[var(--app-muted)]">Cargando plan…</div>;
  }
  if (error || !plan) {
    return (
      <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error ?? 'Plan no encontrado'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Editar plan · ${plan.name}`}
        subtitle="Modifica los datos comerciales, vigencia y permisos por módulo de este plan."
      />
      <PlanEditor initial={plan} />
    </div>
  );
}
