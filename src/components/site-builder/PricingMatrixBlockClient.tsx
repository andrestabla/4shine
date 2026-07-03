'use client';

import React from 'react';
import { PricingMatrixClient, type PricingCopy } from '@/components/marketing/PricingMatrixClient';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import type { CommercialProductRecord } from '@/features/access/types';

interface PricingData {
  plans: SubscriptionPlanWithFeatures[];
  catalog: CommercialProductRecord[];
}

/**
 * Carga planes + catálogo desde la API pública y renderiza la matriz dinámica.
 * Mismo origen de datos que Administración → Planes; se actualiza solo.
 * Es cliente para funcionar tanto en el sitio público como en la vista previa
 * del builder (que es un componente cliente).
 */
export function PricingMatrixBlockClient({ copy }: { copy?: Partial<PricingCopy> }) {
  const [data, setData] = React.useState<PricingData | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/public/site/pricing', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (json?.ok && json.data) {
          setData({ plans: json.data.plans ?? [], catalog: json.data.catalog ?? [] });
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        No se pudieron cargar los planes en este momento.
      </p>
    );
  }

  if (!data) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Cargando planes…
      </p>
    );
  }

  return <PricingMatrixClient plans={data.plans} catalog={data.catalog} copy={copy} />;
}
