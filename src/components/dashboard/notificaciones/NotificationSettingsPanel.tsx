'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationGlobalSettings,
} from '@/features/notificaciones/client';
import { Settings2, Save, Loader2, Check } from 'lucide-react';
import clsx from 'clsx';

// ─── Live Email Frame Preview ─────────────────────────────────────────────────

function EmailFramePreview({
  platformName,
  headerBg,
  footerTagline,
  footerSupport,
  footerLegal,
}: {
  platformName: string;
  headerBg: string;
  footerTagline: string;
  footerSupport: string;
  footerLegal: string;
}) {
  const name = platformName || '4Shine';
  const tagline = footerTagline || 'Plataforma de desarrollo de equipos';
  const support = footerSupport || 'soporte@4shine.co';

  return (
    <div className="overflow-hidden rounded-[1rem] border border-[var(--app-border)] shadow-sm text-[11px]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Header */}
      <div
        className="flex items-center justify-center px-6 py-5"
        style={{ backgroundColor: headerBg || '#1e293b' }}
      >
        <span className="font-bold tracking-wide text-white text-base">{name}</span>
      </div>

      {/* Body placeholder */}
      <div className="bg-white px-6 py-5 space-y-2">
        <div className="h-3 w-3/4 rounded bg-[var(--app-border)]" />
        <div className="h-3 w-full rounded bg-[var(--app-border)] opacity-60" />
        <div className="h-3 w-5/6 rounded bg-[var(--app-border)] opacity-40" />
        <div className="mt-3 h-7 w-28 rounded-[0.5rem] bg-[var(--app-border)] opacity-70" />
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--app-border)] bg-[#f8fafc] px-6 py-4 text-center">
        <p className="text-[11px] text-[#94a3b8]">{name} · {tagline}</p>
        <p className="text-[11px] text-[#cbd5e1]">{support}</p>
        {footerLegal && <p className="mt-1 text-[10px] text-[#cbd5e1]">{footerLegal}</p>}
      </div>
    </div>
  );
}

// ─── Color input ──────────────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--app-ink)]">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#1e293b'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-[0.5rem] border border-[var(--app-border)] p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="app-input flex-1 font-mono text-sm uppercase"
          placeholder="#1e293b"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULTS: NotificationGlobalSettings = {
  varPlatformName: '',
  varPlatformUrl: '',
  emailHeaderBg: '#1e293b',
  emailFooterTagline: '',
  emailFooterSupport: '',
  emailFooterLegal: '',
};

export function NotificationSettingsPanel() {
  const [form, setForm] = useState<NotificationGlobalSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getNotificationSettings().then((res) => {
      if (res.ok && res.data) setForm(res.data);
      setLoading(false);
    });
  }, []);

  const set = useCallback(<K extends keyof NotificationGlobalSettings>(key: K, val: NotificationGlobalSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await updateNotificationSettings(form);
    if (res.ok && res.data) {
      setForm(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(res.error ?? 'Error al guardar');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[1.25rem] border border-[var(--app-border)] bg-white p-6 text-sm text-[var(--app-muted)]">
        <Loader2 size={14} className="animate-spin" /> Cargando configuración…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="rounded-[1.25rem] border border-[var(--app-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[var(--app-ink)] text-white">
          <Settings2 size={15} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--app-ink)]">Configuración general</p>
          <p className="text-[11px] text-[var(--app-muted)]">Variables globales y apariencia de los emails enviados por la plataforma</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 p-5">
        {/* Left: form fields */}
        <div className="space-y-6">

          {/* Variables globales */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Variables globales</h4>
            <p className="text-[11px] text-[var(--app-muted)] -mt-2 leading-relaxed">
              Valores que se auto-inyectan en todas las plantillas cuando no los provee el evento. Usados por <span className="font-mono">{"{{plataforma}}"}</span> y <span className="font-mono">{"{{enlace_plataforma}}"}</span>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">
                  Nombre de la plataforma <span className="font-mono text-[var(--app-muted)]">{"{{plataforma}}"}</span>
                </label>
                <input
                  type="text"
                  value={form.varPlatformName}
                  onChange={(e) => set('varPlatformName', e.target.value)}
                  className="app-input w-full"
                  placeholder="4Shine"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">
                  URL principal <span className="font-mono text-[var(--app-muted)]">{"{{enlace_plataforma}}"}</span>
                </label>
                <input
                  type="url"
                  value={form.varPlatformUrl}
                  onChange={(e) => set('varPlatformUrl', e.target.value)}
                  className="app-input w-full"
                  placeholder="https://4shine.co"
                />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-[var(--app-border)]" />

          {/* Header */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Header del email</h4>
            <ColorField
              label="Color de fondo del header"
              value={form.emailHeaderBg}
              onChange={(v) => set('emailHeaderBg', v)}
            />
          </div>

          {/* Separador */}
          <div className="border-t border-[var(--app-border)]" />

          {/* Footer */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Footer del email</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Tagline</label>
                <input
                  type="text"
                  value={form.emailFooterTagline}
                  onChange={(e) => set('emailFooterTagline', e.target.value)}
                  className="app-input w-full"
                  placeholder="Plataforma de desarrollo de equipos"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Email de soporte</label>
                <input
                  type="email"
                  value={form.emailFooterSupport}
                  onChange={(e) => set('emailFooterSupport', e.target.value)}
                  className="app-input w-full"
                  placeholder="soporte@4shine.co"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-ink)]">
                Texto legal <span className="font-normal text-[var(--app-muted)]">— opcional (dirección, desuscripción, etc.)</span>
              </label>
              <textarea
                rows={2}
                value={form.emailFooterLegal}
                onChange={(e) => set('emailFooterLegal', e.target.value)}
                className="app-input w-full text-sm resize-none"
                placeholder="© 2026 Tu empresa S.A.S. · Bogotá, Colombia"
              />
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Vista previa</p>
          <EmailFramePreview
            platformName={form.varPlatformName}
            headerBg={form.emailHeaderBg}
            footerTagline={form.emailFooterTagline}
            footerSupport={form.emailFooterSupport}
            footerLegal={form.emailFooterLegal}
          />
          <p className="text-[10px] text-[var(--app-muted)] text-center leading-relaxed">
            Así lucirá el marco de todos los emails enviados por la plataforma.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3.5">
        {error ? (
          <p className="text-xs font-semibold text-red-500">{error}</p>
        ) : saved ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Check size={13} /> Configuración guardada
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={saving}
          className={clsx(
            'app-button-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50',
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  );
}
