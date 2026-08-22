'use client';

import React from 'react';
import { Lock, Plus, Save, Sparkles, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  createAdvisorCategory,
  getAdvisorProfile,
  listAdvisorCategories,
  updateAdvisorProfile,
  type AdvisorCategory,
  type AdvisorProfileRecord,
} from '@/features/advisors/client';
import { YEARS_EXPERIENCE_OPTIONS, yearsToKey, keyToStoredValue } from '@/lib/demographics';
import { USER_COUNTRY_OPTIONS } from '@/lib/user-demographics';

interface FormState {
  profession: string;
  bio: string;
  location: string;
  country: string;
  yearsExperience: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  topics: string[];
  category: string;
  sessionPriceAmount: string;
  sessionPriceCurrency: string;
  paymentLinkUrl: string;
}

function toForm(record: AdvisorProfileRecord): FormState {
  return {
    profession: record.profession,
    bio: record.bio,
    location: record.location,
    country: record.country,
    yearsExperience: yearsToKey(record.yearsExperience),
    linkedinUrl: record.linkedinUrl,
    twitterUrl: record.twitterUrl,
    websiteUrl: record.websiteUrl,
    topics: record.topics,
    category: record.category ?? '',
    sessionPriceAmount: record.sessionPriceAmount === null ? '' : String(record.sessionPriceAmount),
    sessionPriceCurrency: record.sessionPriceCurrency || 'COP',
    paymentLinkUrl: record.paymentLinkUrl,
  };
}

const labelClass = 'mb-1 block text-[11px] font-extrabold uppercase tracking-[0.13em] text-[var(--app-muted)]';

/**
 * Ficha de Advisor. El advisor edita su perfil profesional; la categoría, el
 * precio de la sesión y el link de pago son comerciales y solo los cambian
 * gestor y admin (el servidor lo exige, esto solo lo hace visible).
 */
export function AdvisorProfilePanel({ advisorUserId }: { advisorUserId: string }) {
  const { currentRole } = useUser();
  const { alert } = useAppDialog();
  const [record, setRecord] = React.useState<AdvisorProfileRecord | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [categories, setCategories] = React.useState<AdvisorCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [newTopic, setNewTopic] = React.useState('');

  const canEditCommercial = record?.canEditCommercial ?? false;

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [profile, cats] = await Promise.all([
          getAdvisorProfile(advisorUserId),
          listAdvisorCategories().catch(() => [] as AdvisorCategory[]),
        ]);
        if (cancelled) return;
        setRecord(profile);
        setForm(toForm(profile));
        setCategories(cats);
      } catch {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [advisorUserId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const addTopic = () => {
    const clean = newTopic.trim();
    if (!clean || !form) return;
    if (form.topics.length >= 12) return;
    if (form.topics.some((t) => t.toLowerCase() === clean.toLowerCase())) return;
    set('topics', [...form.topics, clean]);
    setNewTopic('');
  };

  const addCategory = async () => {
    const label = window.prompt('Nombre de la nueva categoría de advisor:')?.trim();
    if (!label) return;
    try {
      const next = await createAdvisorCategory(label);
      setCategories(next);
      set('category', label);
    } catch (error) {
      await alert({
        title: 'No se pudo agregar',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
        tone: 'error',
      });
    }
  };

  const save = async () => {
    if (!form || !record) return;
    setSaving(true);
    try {
      const payload = {
        profession: form.profession,
        bio: form.bio,
        location: form.location,
        country: form.country || null,
        yearsExperience: keyToStoredValue(form.yearsExperience),
        linkedinUrl: form.linkedinUrl,
        twitterUrl: form.twitterUrl,
        websiteUrl: form.websiteUrl,
        topics: form.topics,
        // Los comerciales solo se envían si quien edita puede cambiarlos; así
        // el advisor nunca recibe un rechazo por algo que no tocó.
        ...(canEditCommercial
          ? {
              category: form.category || null,
              sessionPriceAmount: form.sessionPriceAmount.trim()
                ? Number(form.sessionPriceAmount.replace(/[^\d.]/g, ''))
                : null,
              sessionPriceCurrency: form.sessionPriceCurrency,
              paymentLinkUrl: form.paymentLinkUrl,
            }
          : {}),
      };
      const updated = await updateAdvisorProfile(advisorUserId, payload);
      setRecord(updated);
      setForm(toForm(updated));
      await alert({ title: 'Datos guardados', message: 'La ficha del advisor quedó actualizada.', tone: 'success' });
    } catch (error) {
      await alert({
        title: 'No se pudo guardar',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="app-panel p-5">
        <p className="text-sm text-[var(--app-muted)]">Cargando datos del advisor…</p>
      </section>
    );
  }
  if (!record || !form) return null;

  return (
    <section className="app-panel p-5">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
          <Sparkles size={18} />
          Datos de Advisor
        </h2>
        <p className="mt-0.5 text-xs text-[var(--app-muted)]">
          Perfil profesional que se muestra a los líderes y en el sitio público.
          {!canEditCommercial && ' La categoría, el precio y el link de pago los gestiona el equipo 4Shine.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="md:col-span-1">
          <span className={labelClass}>Título</span>
          <input
            className="app-input w-full"
            value={form.profession}
            onChange={(e) => set('profession', e.target.value)}
            placeholder="Consultor en transformación digital · Tecnología, Educación"
          />
        </label>

        <label>
          <span className={labelClass}>Ubicación</span>
          <input
            className="app-input w-full"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Bogotá, Colombia"
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>Perfil</span>
          <textarea
            className="app-input w-full"
            rows={5}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Educador y gerente de proyectos de implementación de tecnologías digitales…"
          />
        </label>

        <div className="md:col-span-2">
          <span className={labelClass}>Áreas de experticia</span>
          <div className="flex flex-wrap gap-1.5">
            {form.topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)]"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => set('topics', form.topics.filter((t) => t !== topic))}
                  aria-label={`Quitar ${topic}`}
                  className="text-[var(--app-muted)] hover:text-red-500"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              className="app-input flex-1"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic();
                }
              }}
              placeholder="Agregar un área (Pedagogía, Comunicación…)"
            />
            <button type="button" onClick={addTopic} className="app-button-secondary">
              <Plus size={14} /> Agregar
            </button>
          </div>
        </div>

        <label>
          <span className={labelClass}>País</span>
          <select className="app-select w-full" value={form.country} onChange={(e) => set('country', e.target.value)}>
            <option value="">Sin definir</option>
            {USER_COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Años de experiencia</span>
          <select
            className="app-select w-full"
            value={form.yearsExperience}
            onChange={(e) => set('yearsExperience', e.target.value)}
          >
            <option value="">Sin definir</option>
            {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>LinkedIn</span>
          <input className="app-input w-full" value={form.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://www.linkedin.com/in/…" />
        </label>

        <label>
          <span className={labelClass}>Sitio web</span>
          <input className="app-input w-full" value={form.websiteUrl}
            onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://…" />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>X / Twitter</span>
          <input className="app-input w-full" value={form.twitterUrl}
            onChange={(e) => set('twitterUrl', e.target.value)} placeholder="https://x.com/…" />
        </label>
      </div>

      {/* ── Datos comerciales ─────────────────────────────────────────────── */}
      <div className="mt-5 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[var(--app-muted)]">
          {!canEditCommercial && <Lock size={12} />}
          Datos comerciales {canEditCommercial ? '' : '· los gestiona el equipo 4Shine'}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <span className={labelClass}>Categoría</span>
            {canEditCommercial ? (
              <div className="flex gap-1.5">
                <select
                  className="app-select w-full"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.label}>{cat.label}</option>
                  ))}
                  {form.category && !categories.some((c) => c.label === form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                </select>
                <button type="button" onClick={() => void addCategory()} title="Agregar otra categoría"
                  className="app-button-secondary shrink-0 px-3">
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-[var(--app-ink)]">{form.category || '—'}</p>
            )}
          </div>

          <div>
            <span className={labelClass}>Precio sesión de trabajo</span>
            {canEditCommercial ? (
              <div className="flex gap-1.5">
                <input
                  className="app-input w-full"
                  inputMode="numeric"
                  value={form.sessionPriceAmount}
                  onChange={(e) => set('sessionPriceAmount', e.target.value)}
                  placeholder="500000"
                />
                <select
                  className="app-select w-24 shrink-0"
                  value={form.sessionPriceCurrency}
                  onChange={(e) => set('sessionPriceCurrency', e.target.value)}
                >
                  {['COP', 'USD', 'MXN', 'EUR'].map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm font-semibold text-[var(--app-ink)]">
                {form.sessionPriceAmount
                  ? `${Number(form.sessionPriceAmount).toLocaleString('es-CO')} ${form.sessionPriceCurrency}`
                  : '—'}
              </p>
            )}
          </div>

          <div>
            <span className={labelClass}>Link de pago</span>
            {canEditCommercial ? (
              <input
                className="app-input w-full"
                value={form.paymentLinkUrl}
                onChange={(e) => set('paymentLinkUrl', e.target.value)}
                placeholder="https://…"
              />
            ) : form.paymentLinkUrl ? (
              <a href={form.paymentLinkUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--brand-primary)] underline">
                Ver link
              </a>
            ) : (
              <p className="text-sm font-semibold text-[var(--app-ink)]">—</p>
            )}
          </div>
        </div>
      </div>

      <button type="button" onClick={() => void save()} disabled={saving}
        className="app-button-primary mt-4 disabled:opacity-60">
        <Save size={16} />
        {saving ? 'Guardando…' : 'Guardar datos de advisor'}
      </button>
      {currentRole === 'mentor' && (
        <p className="mt-2 text-[11.5px] text-[var(--app-muted)]">
          Estos datos alimentan tu perfil público y lo que ven los líderes al agendar contigo.
        </p>
      )}
    </section>
  );
}
