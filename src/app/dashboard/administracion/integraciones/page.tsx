'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

interface IntegrationConfig {
  key: string;
  label: string;
  provider: string;
  enabled: boolean;
  value: string;
}

const STORAGE_KEY = '4shine-admin-integrations-v1';

const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  { key: 'google_meet', label: 'Google Meet', provider: 'Google Workspace', enabled: false, value: '' },
  { key: 'google_calendar', label: 'Google Calendar', provider: 'Google Workspace', enabled: false, value: '' },
  { key: 'r2', label: 'Cloudflare R2', provider: 'Cloudflare', enabled: false, value: '' },
  { key: 'gemini', label: 'Gemini', provider: 'Google AI', enabled: false, value: '' },
  { key: 'google_sso', label: 'SSO Google', provider: 'Google OAuth', enabled: false, value: '' },
  { key: 'openai', label: 'OpenAI', provider: 'OpenAI', enabled: false, value: '' },
];

export default function IntegracionesAdminPage() {
  const { alert } = useAppDialog();
  const [integrations, setIntegrations] = React.useState<IntegrationConfig[]>(DEFAULT_INTEGRATIONS);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as IntegrationConfig[];
      if (!Array.isArray(parsed)) return;

      const byKey = new Map(parsed.map((item) => [item.key, item]));
      setIntegrations(
        DEFAULT_INTEGRATIONS.map((item) => {
          const stored = byKey.get(item.key);
          return stored ? { ...item, enabled: !!stored.enabled, value: stored.value ?? '' } : item;
        }),
      );
    } catch {
      // Ignore invalid local storage payload
    }
  }, []);

  const setIntegration = (key: string, updater: (current: IntegrationConfig) => IntegrationConfig) => {
    setIntegrations((prev) => prev.map((item) => (item.key === key ? updater(item) : item)));
  };

  const onSave = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
    await alert({
      title: 'Integraciones actualizadas',
      message: 'Los cambios de integraciones se guardaron correctamente.',
      tone: 'success',
    });
  };

  const enabledCount = integrations.filter((item) => item.enabled).length;

  return (
    <div className="space-y-4">
      <PageTitle
        title="Integraciones"
        subtitle="Gestiona conectores de calendario, reuniones, almacenamiento, SSO y modelos IA."
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">Integraciones activas</p>
            <p className="text-2xl font-semibold text-slate-800">{enabledCount}</p>
          </div>
          <button className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm" onClick={onSave} type="button">
            Guardar cambios
          </button>
        </div>
        <div className="space-y-3">
          {integrations.map((item) => (
            <article key={item.key} className="border border-slate-200 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-800">{item.label}</h3>
                  <p className="text-xs text-slate-500">{item.provider}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) =>
                      setIntegration(item.key, (current) => ({ ...current, enabled: event.target.checked }))
                    }
                  />
                  Habilitada
                </label>
              </div>

              <div className="mt-3">
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  placeholder="API key / client secret / token"
                  value={item.value}
                  onChange={(event) =>
                    setIntegration(item.key, (current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>
            </article>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Valores ocultos en UI. Persistencia actual en navegador local; siguiente fase: almacenamiento cifrado vía backend.
        </p>
      </div>
    </div>
  );
}
