'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { TemplateBuilder } from '@/components/dashboard/notificaciones/TemplateBuilder';
import { TemplatePreviewModal } from '@/components/dashboard/notificaciones/TemplatePreviewModal';
import { GroupReminderWindowsConfig } from '@/components/dashboard/notificaciones/GroupReminderWindowsConfig';
import { getTemplate, updateTemplate, previewTemplate, sendTestTemplate } from '@/features/notificaciones/client';
import type { NotificationTemplateRecord } from '@/features/notificaciones/types';
import { EVENTS_BY_KEY } from '@/features/notificaciones/events-catalog';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function EditarPlantillaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<NotificationTemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    void getTemplate(id).then((res) => {
      if (res.ok && res.data) setTemplate(res.data);
      else setFetchError(res.error ?? 'Plantilla no encontrada');
      setLoading(false);
    });
  }, [id]);

  async function handleSave(data: import('@/features/notificaciones/types').CreateTemplateInput) {
    setSaving(true);
    setSaveError(null);
    const res = await updateTemplate(id, data);
    if (res.ok && res.data) {
      setTemplate(res.data);
      router.push('/dashboard/administracion/notificaciones/plantillas');
    } else {
      setSaveError(res.error ?? 'Error al guardar');
      setSaving(false);
    }
  }

  async function fetchPreview(_id: string, vars: Record<string, string>) {
    const res = await previewTemplate(id, vars);
    return res.ok ? res.data ?? null : null;
  }

  async function handleSendTest(toEmail: string) {
    return await sendTestTemplate(id, toEmail);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-[var(--app-muted)] text-sm">
        <Loader2 size={16} className="animate-spin" /> Cargando plantilla…
      </div>
    );
  }

  if (fetchError || !template) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-rose-600">{fetchError ?? 'Plantilla no encontrada'}</p>
        <Link href="/dashboard/administracion/notificaciones/plantillas" className="mt-4 inline-block text-sm underline">
          Volver
        </Link>
      </div>
    );
  }

  const eventDef = EVENTS_BY_KEY[template.eventKey];
  if (!eventDef) {
    return (
      <div className="py-16 text-center text-sm text-rose-600">
        Evento &quot;{template.eventKey}&quot; no encontrado en el catálogo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Editar plantilla"
        subtitle={`Modificando: ${template.name}`}
      />

      <Link
        href="/dashboard/administracion/notificaciones/plantillas"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-ink)]"
      >
        <ChevronLeft size={14} />
        Volver a plantillas
      </Link>

      {saveError && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{saveError}</div>
      )}

      {template.eventKey === 'mentorias.group_session_reminder' && <GroupReminderWindowsConfig />}

      <TemplateBuilder
        eventDef={eventDef}
        initial={template}
        onSave={handleSave}
        onPreview={(vars) => setPreviewVars(vars)}
        onSendTest={handleSendTest}
        saving={saving}
      />

      {previewVars && (
        <TemplatePreviewModal
          templateId={id}
          sampleVars={previewVars}
          onClose={() => setPreviewVars(null)}
          onFetch={fetchPreview}
        />
      )}
    </div>
  );
}
