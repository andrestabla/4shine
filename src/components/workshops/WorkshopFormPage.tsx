'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  createWorkshop,
  getWorkshop,
  updateWorkshop,
  type AgendaItem,
  type CreateWorkshopInput,
  type Speaker,
  type WorkshopType,
  type WorkshopStatus,
} from '@/features/workshops/client';

// ── Field helpers ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6 space-y-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-[var(--app-muted)]">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 text-sm text-[var(--app-ink)] outline-none transition focus:border-[#5b2d8a] focus:bg-white placeholder:text-[var(--app-muted)]';

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  workshopType: WorkshopType;
  status: WorkshopStatus;
  description: string;
  startsAt: string;
  endsAt: string;
  facilitatorName: string;
  facilitatorUserId: string;
  meetingUrl: string;
  locationName: string;
  locationAddress: string;
  locationLat: string;
  locationLng: string;
  locationPhotos: string[];
  price: string;
  currency: string;
  maxAttendees: string;
  agenda: AgendaItem[];
  speakers: Speaker[];
}

const BLANK: FormState = {
  title: '',
  workshopType: 'formacion',
  status: 'upcoming',
  description: '',
  startsAt: '',
  endsAt: '',
  facilitatorName: '',
  facilitatorUserId: '',
  meetingUrl: '',
  locationName: '',
  locationAddress: '',
  locationLat: '',
  locationLng: '',
  locationPhotos: [],
  price: '',
  currency: 'USD',
  maxAttendees: '',
  agenda: [],
  speakers: [],
};

function toIso(v: string) {
  if (!v) return '';
  return new Date(v).toISOString();
}

function toLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  workshopId?: string;
}

export function WorkshopFormPage({ mode, workshopId }: Props) {
  const router = useRouter();
  const { alert } = useAppDialog();

  const [form, setForm] = React.useState<FormState>(BLANK);
  const [loading, setLoading] = React.useState(mode === 'edit');
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load existing workshop for edit mode
  React.useEffect(() => {
    if (mode !== 'edit' || !workshopId) return;
    (async () => {
      try {
        const ws = await getWorkshop(workshopId);
        setForm({
          title: ws.title ?? '',
          workshopType: ws.workshopType,
          status: ws.status,
          description: ws.description ?? '',
          startsAt: toLocal(ws.startsAt),
          endsAt: toLocal(ws.endsAt),
          facilitatorName: ws.facilitatorName ?? '',
          facilitatorUserId: ws.facilitatorUserId ?? '',
          meetingUrl: ws.meetingUrl ?? '',
          locationName: ws.locationName ?? '',
          locationAddress: ws.locationAddress ?? '',
          locationLat: ws.locationLat !== null ? String(ws.locationLat) : '',
          locationLng: ws.locationLng !== null ? String(ws.locationLng) : '',
          locationPhotos: ws.locationPhotos ?? [],
          price: ws.price !== null ? String(ws.price) : '',
          currency: ws.currency ?? 'USD',
          maxAttendees: ws.maxAttendees !== null ? String(ws.maxAttendees) : '',
          agenda: ws.agenda ?? [],
          speakers: ws.speakers ?? [],
        });
      } catch (err) {
        await alert({ title: 'Error', message: err instanceof Error ? err.message : 'No se pudo cargar', tone: 'error' });
        router.push('/dashboard/workshops');
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, workshopId, alert, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startsAt || !form.endsAt) return;
    setSaving(true);

    const input: CreateWorkshopInput = {
      title: form.title.trim(),
      workshopType: form.workshopType,
      status: form.status,
      description: form.description.trim() || null,
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt),
      facilitatorName: form.facilitatorName.trim() || null,
      facilitatorUserId: form.facilitatorUserId.trim() || null,
      meetingUrl: form.meetingUrl.trim() || null,
      locationName: form.locationName.trim() || null,
      locationAddress: form.locationAddress.trim() || null,
      locationLat: form.locationLat ? Number(form.locationLat) : null,
      locationLng: form.locationLng ? Number(form.locationLng) : null,
      locationPhotos: form.locationPhotos,
      price: form.price ? Number(form.price) : null,
      currency: form.currency || 'USD',
      maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
      agenda: form.agenda.filter((a) => a.title.trim()),
      speakers: form.speakers.filter((s) => s.name.trim()),
    };

    try {
      if (mode === 'create') {
        const ws = await createWorkshop(input);
        router.push(`/dashboard/workshops/${ws.workshopId}`);
      } else {
        await updateWorkshop(workshopId!, input);
        router.push(`/dashboard/workshops/${workshopId}`);
      }
    } catch (err) {
      await alert({ title: 'Error', message: err instanceof Error ? err.message : 'No se pudo guardar', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Agenda helpers ───────────────────────────────────────────────────────────

  const addAgendaItem = () =>
    setForm((p) => ({ ...p, agenda: [...p.agenda, { time: '', title: '', description: '' }] }));

  const updateAgendaItem = (i: number, patch: Partial<AgendaItem>) =>
    setForm((p) => {
      const agenda = [...p.agenda];
      agenda[i] = { ...agenda[i]!, ...patch };
      return { ...p, agenda };
    });

  const removeAgendaItem = (i: number) =>
    setForm((p) => ({ ...p, agenda: p.agenda.filter((_, idx) => idx !== i) }));

  // ── Speaker helpers ──────────────────────────────────────────────────────────

  const addSpeaker = () =>
    setForm((p) => ({ ...p, speakers: [...p.speakers, { name: '', role: '', bio: '', avatarUrl: '' }] }));

  const updateSpeaker = (i: number, patch: Partial<Speaker>) =>
    setForm((p) => {
      const speakers = [...p.speakers];
      speakers[i] = { ...speakers[i]!, ...patch };
      return { ...p, speakers };
    });

  const removeSpeaker = (i: number) =>
    setForm((p) => ({ ...p, speakers: p.speakers.filter((_, idx) => idx !== i) }));

  // ── Photo helpers ────────────────────────────────────────────────────────────

  const removePhoto = (url: string) =>
    setForm((p) => ({ ...p, locationPhotos: p.locationPhotos.filter((u) => u !== url) }));

  // ── Maps link ────────────────────────────────────────────────────────────────

  const mapsUrl =
    form.locationLat && form.locationLng
      ? `https://www.google.com/maps?q=${form.locationLat},${form.locationLng}`
      : form.locationAddress
        ? `https://www.google.com/maps/search/${encodeURIComponent(form.locationAddress)}`
        : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[var(--app-muted)]">Cargando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              mode === 'edit' && workshopId
                ? `/dashboard/workshops/${workshopId}`
                : '/dashboard/workshops',
            )
          }
          className="flex items-center gap-1.5 text-sm text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
        >
          <ArrowLeft size={15} />
          {mode === 'edit' ? 'Workshop' : 'Workshops'}
        </button>
        <span className="text-[var(--app-muted)]">/</span>
        <span className="text-sm font-semibold text-[var(--app-ink)]">
          {mode === 'create' ? 'Nuevo workshop' : 'Editar workshop'}
        </span>
      </div>

      {/* Basic info */}
      <SectionCard title="Información básica">
        <Field label="Título" required>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Nombre del workshop"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select
              value={form.workshopType}
              onChange={(e) => set('workshopType', e.target.value as WorkshopType)}
              className={inputCls}
            >
              <option value="relacionamiento">Relacionamiento</option>
              <option value="formacion">Formación</option>
              <option value="innovacion">Innovación</option>
              <option value="wellbeing">Wellbeing</option>
              <option value="otro">Otro</option>
            </select>
          </Field>
          <Field label="Estado">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as WorkshopStatus)}
              className={inputCls}
            >
              <option value="upcoming">Próximo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </Field>
        </div>
        <Field label="Descripción">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción del workshop..."
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </SectionCard>

      {/* Date & time */}
      <SectionCard title="Fecha y hora">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Inicio" required>
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Fin" required>
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Facilitator */}
      <SectionCard title="Facilitador">
        <Field label="Nombre del facilitador">
          <input
            value={form.facilitatorName}
            onChange={(e) => set('facilitatorName', e.target.value)}
            placeholder="Nombre completo"
            className={inputCls}
          />
        </Field>
        <Field label="Link de sesión (Zoom, Meet, etc.)">
          <input
            value={form.meetingUrl}
            onChange={(e) => set('meetingUrl', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </Field>
      </SectionCard>

      {/* Pricing & capacity */}
      <SectionCard title="Precio y capacidad">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Precio">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </Field>
          <Field label="Moneda">
            <select
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              className={inputCls}
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
              <option value="ARS">ARS</option>
              <option value="CLP">CLP</option>
              <option value="PEN">PEN</option>
            </select>
          </Field>
          <Field label="Máx. asistentes">
            <input
              type="number"
              min="1"
              value={form.maxAttendees}
              onChange={(e) => set('maxAttendees', e.target.value)}
              placeholder="Sin límite"
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Location */}
      <SectionCard title="Ubicación">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del lugar">
            <input
              value={form.locationName}
              onChange={(e) => set('locationName', e.target.value)}
              placeholder="Ej: Centro de Convenciones Bogotá"
              className={inputCls}
            />
          </Field>
          <Field label="Dirección">
            <input
              value={form.locationAddress}
              onChange={(e) => set('locationAddress', e.target.value)}
              placeholder="Calle y ciudad"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Latitud (opcional)">
            <input
              type="number"
              step="any"
              value={form.locationLat}
              onChange={(e) => set('locationLat', e.target.value)}
              placeholder="4.710989"
              className={inputCls}
            />
          </Field>
          <Field label="Longitud (opcional)">
            <input
              type="number"
              step="any"
              value={form.locationLng}
              onChange={(e) => set('locationLng', e.target.value)}
              placeholder="-74.072090"
              className={inputCls}
            />
          </Field>
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b2d8a] hover:underline"
          >
            <MapPin size={12} /> Ver en Google Maps
            <ExternalLink size={11} />
          </a>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[var(--app-muted)]">Fotos del lugar</p>
          {form.locationPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.locationPhotos.map((url) => (
                <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <R2UploadButton
            moduleCode="workshops"
            action="update"
            pathPrefix="workshops/location-photos"
            entityTable="app_networking.workshops"
            fieldName="location_photos"
            accept="image/*"
            buttonLabel="Agregar foto"
            onUploaded={(url) => setForm((p) => ({ ...p, locationPhotos: [...p.locationPhotos, url] }))}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          />
        </div>
      </SectionCard>

      {/* Speakers */}
      <SectionCard title="Ponentes / Invitados">
        {form.speakers.length === 0 && (
          <p className="text-sm text-[var(--app-muted)]">No hay ponentes agregados aún.</p>
        )}
        <div className="space-y-3">
          {form.speakers.map((speaker, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 space-y-2.5"
            >
              <button
                type="button"
                onClick={() => removeSpeaker(i)}
                className="absolute right-3 top-3 rounded-full p-1 text-[var(--app-muted)] hover:text-rose-500 transition"
              >
                <Minus size={14} />
              </button>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="Nombre">
                  <input
                    value={speaker.name}
                    onChange={(e) => updateSpeaker(i, { name: e.target.value })}
                    placeholder="Nombre completo"
                    className={inputCls}
                  />
                </Field>
                <Field label="Rol / Cargo">
                  <input
                    value={speaker.role ?? ''}
                    onChange={(e) => updateSpeaker(i, { role: e.target.value })}
                    placeholder="CEO, Coach, etc."
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Biografía breve">
                <textarea
                  value={speaker.bio ?? ''}
                  onChange={(e) => updateSpeaker(i, { bio: e.target.value })}
                  placeholder="Breve descripción..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <div className="flex items-center gap-3">
                {speaker.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={speaker.avatarUrl} alt={speaker.name} className="h-10 w-10 rounded-full object-cover" />
                )}
                <R2UploadButton
                  moduleCode="workshops"
                  action="update"
                  pathPrefix="workshops/speakers"
                  accept="image/*"
                  buttonLabel={speaker.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                  onUploaded={(url) => updateSpeaker(i, { avatarUrl: url })}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSpeaker}
          className="flex items-center gap-2 rounded-full border border-dashed border-[var(--app-border)] px-4 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[#5b2d8a] hover:text-[#5b2d8a]"
        >
          <Plus size={13} /> Agregar ponente
        </button>
      </SectionCard>

      {/* Agenda */}
      <SectionCard title="Agenda / Actividades">
        {form.agenda.length === 0 && (
          <p className="text-sm text-[var(--app-muted)]">No hay agenda configurada aún.</p>
        )}
        <div className="space-y-3">
          {form.agenda.map((item, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 space-y-2.5"
            >
              <button
                type="button"
                onClick={() => removeAgendaItem(i)}
                className="absolute right-3 top-3 rounded-full p-1 text-[var(--app-muted)] hover:text-rose-500 transition"
              >
                <Minus size={14} />
              </button>
              <div className="grid gap-2.5 sm:grid-cols-[10rem_1fr]">
                <Field label="Hora">
                  <input
                    value={item.time}
                    onChange={(e) => updateAgendaItem(i, { time: e.target.value })}
                    placeholder="9:00 AM"
                    className={inputCls}
                  />
                </Field>
                <Field label="Actividad">
                  <input
                    value={item.title}
                    onChange={(e) => updateAgendaItem(i, { title: e.target.value })}
                    placeholder="Nombre de la actividad"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Descripción (opcional)">
                <input
                  value={item.description ?? ''}
                  onChange={(e) => updateAgendaItem(i, { description: e.target.value })}
                  placeholder="Detalle adicional..."
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAgendaItem}
          className="flex items-center gap-2 rounded-full border border-dashed border-[var(--app-border)] px-4 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[#5b2d8a] hover:text-[#5b2d8a]"
        >
          <Plus size={13} /> Agregar actividad
        </button>
      </SectionCard>

      {/* Delete / Save buttons */}
      <div className="flex gap-3 pb-8 pt-2">
        <button
          type="submit"
          disabled={saving || !form.title.trim() || !form.startsAt || !form.endsAt}
          className="flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? mode === 'create'
              ? 'Creando...'
              : 'Guardando...'
            : mode === 'create'
              ? 'Crear workshop'
              : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(
              mode === 'edit' && workshopId
                ? `/dashboard/workshops/${workshopId}`
                : '/dashboard/workshops',
            )
          }
          className="rounded-full border border-[var(--app-border)] px-6 py-3 text-sm font-semibold text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
