'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useUser } from '@/context/UserContext';
import {
  addAttachment,
  addImage,
  applyToConvocatoria,
  createForumPost,
  deleteConvocatoria,
  deleteForumPost,
  getConvocatoria,
  listForumPosts,
  notifyInterestedUsers,
  removeAttachment,
  removeImage,
  setDates,
  setFaqs,
  updateConvocatoria,
  withdrawApplication,
  type ConvocatoriaAttachment,
  type ConvocatoriaDate,
  type ConvocatoriaDetail,
  type ConvocatoriaFaq,
  type ConvocatoriaForumPost,
  type ConvocatoriaImage,
  type ConvocatoriaStatus,
  type ConvocatoriaTipo,
  type SetDatesInput,
  type SetFaqsInput,
} from '@/features/convocatorias/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortId(uuid: string, prefix: string) {
  return `${prefix}-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

const TIPO_LABELS: Record<string, string> = {
  laboral: 'Laboral',
  proyecto_social: 'Proyecto Social',
  proveedor: 'Proveedor',
  convenio: 'Convenio',
  otra: 'Otra',
};

const STATUS_CONFIG: Record<ConvocatoriaStatus, { label: string; classes: string }> = {
  draft:     { label: 'Borrador',   classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  open:      { label: 'Abierta',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:    { label: 'Cerrada',    classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  suspended: { label: 'Suspendida', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', { dateStyle: 'long' });
}

function toRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black text-white"
      style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}
    >
      {getInitials(name)}
    </div>
  );
}

function FaqItem({ faq }: { faq: ConvocatoriaFaq }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-[var(--app-border)] last:border-0">
      <button
        className="flex w-full items-center justify-between gap-3 px-1 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-[var(--app-ink)]">{faq.question}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-[var(--app-muted)]" /> : <ChevronDown size={16} className="shrink-0 text-[var(--app-muted)]" />}
      </button>
      {open && (
        <p className="pb-4 pl-1 pr-6 text-sm leading-relaxed text-[var(--app-muted)]">{faq.answer}</p>
      )}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface EditFormState {
  title: string;
  description: string;
  objetivo: string;
  tipo: ConvocatoriaTipo;
  fechaInicio: string;
  fechaFin: string;
  requisitos: string;
  enlacesComplementarios: string;
  contactoTelefono: string;
  contactoEmail: string;
  location: string;
  externalUrl: string;
  status: ConvocatoriaStatus;
}

interface EditModalProps {
  item: ConvocatoriaDetail;
  onSave: (data: EditFormState) => Promise<void>;
  onClose: () => void;
}

function EditModal({ item, onSave, onClose }: EditModalProps) {
  const [form, setForm] = React.useState<EditFormState>({
    title: item.title,
    description: item.description,
    objetivo: item.objetivo ?? '',
    tipo: item.tipo ?? 'otra',
    fechaInicio: item.fechaInicio ?? '',
    fechaFin: item.fechaFin ?? '',
    requisitos: item.requisitos ?? '',
    enlacesComplementarios: item.enlacesComplementarios ?? '',
    contactoTelefono: item.contactoTelefono ?? '',
    contactoEmail: item.contactoEmail ?? '',
    location: item.location ?? '',
    externalUrl: item.externalUrl ?? '',
    status: item.status,
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[var(--app-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--app-ink)]">Editar convocatoria</h2>
            <button onClick={onClose} className="text-[var(--app-muted)] hover:text-[var(--app-ink)]">
              <X size={20} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Título *</label>
            <input
              className="app-input"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Tipo</label>
            <select
              className="app-select"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value as ConvocatoriaTipo }))}
            >
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Objetivo */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Objetivo</label>
            <textarea
              className="app-textarea"
              rows={2}
              value={form.objetivo}
              onChange={(e) => setForm((s) => ({ ...s, objetivo: e.target.value }))}
              placeholder="Objetivo principal de la convocatoria"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Descripción</label>
            <textarea
              className="app-textarea"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="Descripción de la convocatoria..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Fecha inicio</label>
              <input
                className="app-input"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm((s) => ({ ...s, fechaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Fecha fin</label>
              <input
                className="app-input"
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm((s) => ({ ...s, fechaFin: e.target.value }))}
              />
            </div>
          </div>

          {/* Requisitos */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Requisitos</label>
            <textarea
              className="app-textarea"
              rows={2}
              value={form.requisitos}
              onChange={(e) => setForm((s) => ({ ...s, requisitos: e.target.value }))}
              placeholder="Requisitos para aplicar (opcional)"
            />
          </div>

          {/* Enlaces complementarios */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Enlaces complementarios</label>
            <input
              className="app-input"
              value={form.enlacesComplementarios}
              onChange={(e) => setForm((s) => ({ ...s, enlacesComplementarios: e.target.value }))}
              placeholder="https://... (opcional)"
            />
          </div>

          {/* Teléfono + Email contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Teléfono contacto</label>
              <input
                className="app-input"
                value={form.contactoTelefono}
                onChange={(e) => setForm((s) => ({ ...s, contactoTelefono: e.target.value }))}
                placeholder="+57 300 000 0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Email contacto</label>
              <input
                className="app-input"
                type="email"
                value={form.contactoEmail}
                onChange={(e) => setForm((s) => ({ ...s, contactoEmail: e.target.value }))}
                placeholder="contacto@ejemplo.com"
              />
            </div>
          </div>

          {/* Ubicación + URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Ubicación</label>
              <input
                className="app-input"
                value={form.location}
                onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                placeholder="Ciudad, País o Remoto"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">URL externa</label>
              <input
                className="app-input"
                value={form.externalUrl}
                onChange={(e) => setForm((s) => ({ ...s, externalUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Estado</label>
            <select
              className="app-select"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ConvocatoriaStatus }))}
            >
              <option value="draft">Borrador</option>
              <option value="open">Abierta</option>
              <option value="closed">Cerrada</option>
              <option value="suspended">Suspendida</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="app-button-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="app-button-primary" disabled={saving || !form.title.trim()}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dates editor ──────────────────────────────────────────────────────────────

interface DatesEditorProps {
  initialDates: ConvocatoriaDate[];
  onSave: (dates: SetDatesInput[]) => Promise<void>;
}

function DatesEditor({ initialDates, onSave }: DatesEditorProps) {
  const [rows, setRows] = React.useState<SetDatesInput[]>(
    initialDates.map((d) => ({ label: d.label, dateValue: d.dateValue, sortOrder: d.sortOrder })),
  );
  const [saving, setSaving] = React.useState(false);

  const addRow = () => setRows((s) => [...s, { label: '', dateValue: '', sortOrder: s.length }]);
  const removeRow = (i: number) => setRows((s) => s.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof SetDatesInput, value: string | number) =>
    setRows((s) => s.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rows.filter((r) => r.label.trim() && r.dateValue));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="app-input flex-1"
            placeholder="Nombre (ej. Cierre de postulaciones)"
            value={row.label}
            onChange={(e) => update(i, 'label', e.target.value)}
          />
          <input
            className="app-input w-40"
            type="date"
            value={row.dateValue}
            onChange={(e) => update(i, 'dateValue', e.target.value)}
          />
          <button type="button" onClick={() => removeRow(i)} className="shrink-0 text-[var(--app-muted)] hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={addRow} className="app-button-secondary inline-flex items-center gap-1.5 text-xs">
          <Plus size={13} />Agregar fecha
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="app-button-primary text-xs">
          {saving ? 'Guardando...' : 'Guardar fechas'}
        </button>
      </div>
    </div>
  );
}

// ── FAQ editor ────────────────────────────────────────────────────────────────

interface FaqEditorProps {
  initialFaqs: ConvocatoriaFaq[];
  onSave: (faqs: SetFaqsInput[]) => Promise<void>;
}

function FaqEditor({ initialFaqs, onSave }: FaqEditorProps) {
  const [rows, setRows] = React.useState<SetFaqsInput[]>(
    initialFaqs.map((f) => ({ question: f.question, answer: f.answer, sortOrder: f.sortOrder })),
  );
  const [saving, setSaving] = React.useState(false);

  const addRow = () => setRows((s) => [...s, { question: '', answer: '', sortOrder: s.length }]);
  const removeRow = (i: number) => setRows((s) => s.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof SetFaqsInput, value: string | number) =>
    setRows((s) => s.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rows.filter((r) => r.question.trim() && r.answer.trim()));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="app-input flex-1"
              placeholder="Pregunta"
              value={row.question}
              onChange={(e) => update(i, 'question', e.target.value)}
            />
            <button type="button" onClick={() => removeRow(i)} className="text-[var(--app-muted)] hover:text-red-500">
              <X size={16} />
            </button>
          </div>
          <textarea
            className="app-textarea"
            rows={2}
            placeholder="Respuesta"
            value={row.answer}
            onChange={(e) => update(i, 'answer', e.target.value)}
          />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button type="button" onClick={addRow} className="app-button-secondary inline-flex items-center gap-1.5 text-xs">
          <Plus size={13} />Agregar pregunta
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="app-button-primary text-xs">
          {saving ? 'Guardando...' : 'Guardar FAQ'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConvocatoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can, currentUser } = useUser();
  const { alert, confirm } = useAppDialog();

  const [item, setItem] = React.useState<ConvocatoriaDetail | null>(null);
  const [posts, setPosts] = React.useState<ConvocatoriaForumPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [applyLoading, setApplyLoading] = React.useState(false);
  const [forumMsg, setForumMsg] = React.useState('');
  const [forumLoading, setForumLoading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [adminTab, setAdminTab] = React.useState<'images' | 'attachments' | 'dates' | 'faqs'>('images');
  const [imageGalleryIdx, setImageGalleryIdx] = React.useState(0);
  const [notifyLoading, setNotifyLoading] = React.useState(false);
  const [notifyCount, setNotifyCount] = React.useState<number | null>(null);

  const isAdmin = can('convocatorias', 'create');

  const showError = React.useCallback(async (fallback: string, cause: unknown) => {
    await alert({ title: 'Error', message: cause instanceof Error ? cause.message : fallback, tone: 'error' });
  }, [alert]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [detail, forumPosts] = await Promise.all([
        getConvocatoria(id),
        listForumPosts(id),
      ]);
      setItem(detail);
      setPosts(forumPosts);
    } catch (err) {
      await showError('No se pudo cargar la convocatoria', err);
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[var(--app-muted)]">
        Cargando...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-12 text-center text-sm text-[var(--app-muted)]">
        Convocatoria no encontrada.
      </div>
    );
  }

  const cfg = STATUS_CONFIG[item.status];

  // ── Apply / Withdraw ──────────────────────────────────────────────────────

  const onApply = async () => {
    if (item.hasApplied) {
      const ok = await confirm({
        title: 'Retirar aplicación',
        message: '¿Deseas retirar tu aplicación a esta convocatoria?',
        confirmText: 'Retirar',
        cancelText: 'Cancelar',
        tone: 'warning',
      });
      if (!ok) return;
      setApplyLoading(true);
      try {
        await withdrawApplication(id);
        await load();
      } catch (err) {
        await showError('No se pudo retirar la aplicación', err);
      } finally {
        setApplyLoading(false);
      }
    } else {
      setApplyLoading(true);
      try {
        await applyToConvocatoria(id);
        await alert({
          title: '¡Aplicación enviada!',
          message: 'Tu aplicación fue registrada. Recibirás información por correo y en la plataforma.',
          tone: 'success',
        });
        await load();
      } catch (err) {
        await showError('No se pudo enviar la aplicación', err);
      } finally {
        setApplyLoading(false);
      }
    }
  };

  // ── Forum ─────────────────────────────────────────────────────────────────

  const onForumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumMsg.trim()) return;
    setForumLoading(true);
    try {
      await createForumPost(id, forumMsg);
      setForumMsg('');
      const updated = await listForumPosts(id);
      setPosts(updated);
    } catch (err) {
      await showError('No se pudo enviar el mensaje', err);
    } finally {
      setForumLoading(false);
    }
  };

  const onDeletePost = async (post: ConvocatoriaForumPost) => {
    const ok = await confirm({
      title: 'Eliminar mensaje',
      message: '¿Deseas eliminar este mensaje del foro?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteForumPost(id, post.postId);
      const updated = await listForumPosts(id);
      setPosts(updated);
    } catch (err) {
      await showError('No se pudo eliminar el mensaje', err);
    }
  };

  // ── Admin: edit ───────────────────────────────────────────────────────────

  const onSaveEdit = async (form: EditFormState) => {
    await updateConvocatoria(id, {
      title: form.title,
      description: form.description,
      objetivo: form.objetivo,
      tipo: form.tipo,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
      requisitos: form.requisitos,
      enlacesComplementarios: form.enlacesComplementarios,
      contactoTelefono: form.contactoTelefono,
      contactoEmail: form.contactoEmail,
      location: form.location || null,
      externalUrl: form.externalUrl || null,
      status: form.status,
    });
    setEditOpen(false);
    await load();
  };

  // ── Admin: delete ─────────────────────────────────────────────────────────

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar convocatoria',
      message: `¿Deseas eliminar "${item.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteConvocatoria(id);
      router.push('/dashboard/convocatorias');
    } catch (err) {
      await showError('No se pudo eliminar la convocatoria', err);
    }
  };

  // ── Admin: notify interested ──────────────────────────────────────────────

  const onNotifyInterested = async () => {
    setNotifyLoading(true);
    setNotifyCount(null);
    try {
      const result = await notifyInterestedUsers(id);
      setNotifyCount(result.notified);
      await alert({
        title: 'Notificaciones enviadas',
        message: `Se notificó a ${result.notified} usuario${result.notified !== 1 ? 's' : ''} interesados.`,
        tone: 'success',
      });
    } catch (err) {
      await showError('No se pudo notificar a los interesados', err);
    } finally {
      setNotifyLoading(false);
    }
  };

  // ── Admin: images ─────────────────────────────────────────────────────────

  const onImageUploaded = async (url: string) => {
    try {
      await addImage(id, url);
      await load();
    } catch (err) {
      await showError('No se pudo agregar la imagen', err);
    }
  };

  const onRemoveImage = async (image: ConvocatoriaImage) => {
    const ok = await confirm({ title: 'Eliminar imagen', message: '¿Eliminar esta imagen?', confirmText: 'Eliminar', cancelText: 'Cancelar', tone: 'warning' });
    if (!ok) return;
    try {
      await removeImage(id, image.imageId);
      await load();
    } catch (err) {
      await showError('No se pudo eliminar la imagen', err);
    }
  };

  const onAttachmentUploaded = async (url: string, payload: { fileName: string }) => {
    try {
      await addAttachment(id, url, payload.fileName);
      await load();
    } catch (err) {
      await showError('No se pudo agregar el archivo', err);
    }
  };

  const onRemoveAttachment = async (att: ConvocatoriaAttachment) => {
    const ok = await confirm({ title: 'Eliminar archivo', message: `¿Eliminar "${att.fileName}"?`, confirmText: 'Eliminar', cancelText: 'Cancelar', tone: 'warning' });
    if (!ok) return;
    try {
      await removeAttachment(id, att.attachmentId);
      await load();
    } catch (err) {
      await showError('No se pudo eliminar el archivo', err);
    }
  };

  const onSaveDates = async (dates: SetDatesInput[]) => {
    try {
      await setDates(id, dates);
      await load();
    } catch (err) {
      await showError('No se pudieron guardar las fechas', err);
    }
  };

  const onSaveFaqs = async (faqs: SetFaqsInput[]) => {
    try {
      await setFaqs(id, faqs);
      await load();
    } catch (err) {
      await showError('No se pudo guardar el FAQ', err);
    }
  };

  // All images: cover + gallery
  const allImages = [
    ...(item.coverImageUrl ? [{ imageId: '__cover__', url: item.coverImageUrl, sortOrder: -1 }] : []),
    ...item.images,
  ];
  const currentImage = allImages[imageGalleryIdx] ?? allImages[0];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-12">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/convocatorias')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-ink)] transition"
      >
        <ArrowLeft size={16} />
        Convocatorias
      </button>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white">
        {allImages.length > 0 ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage?.url}
              alt={item.title}
              className="h-64 w-full object-cover sm:h-80"
            />
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageGalleryIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === imageGalleryIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex h-40 items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }}
          >
            <Megaphone size={36} style={{ color: '#7c3aed' }} className="opacity-30" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.classes}`}>
                  {cfg.label}
                </span>
                {TIPO_LABELS[item.tipo] && item.tipo !== 'otra' && (
                  <span className="inline-block rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                    {TIPO_LABELS[item.tipo]}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--app-ink)] sm:text-3xl">
                {item.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-[var(--app-muted)]">{shortId(item.convocatoriaId, 'CONV')}</p>
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void onNotifyInterested()}
                  disabled={notifyLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#7c3aed] px-3 py-2 text-sm font-semibold text-[#5b2d8a] hover:bg-[#f3e8ff] transition disabled:opacity-50"
                >
                  <Send size={14} />
                  {notifyLoading ? 'Enviando...' : notifyCount !== null ? `Notificado (${notifyCount})` : 'Notificar interesados'}
                </button>
                <button
                  onClick={() => setEditOpen(true)}
                  className="app-button-secondary inline-flex items-center gap-1.5 text-sm"
                >
                  <Pencil size={14} />Editar
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--app-muted)]">
            {item.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />{item.location}
              </span>
            )}
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#5b2d8a] hover:underline"
              >
                <ExternalLink size={14} />Más información
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Users size={14} />{item.applicationsCount} {item.applicationsCount === 1 ? 'aplicación' : 'aplicaciones'}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mt-5 text-sm leading-relaxed text-[var(--app-ink)]/80 whitespace-pre-wrap">
              {item.description}
            </div>
          )}

          {/* Objetivo */}
          {item.objetivo && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--app-ink)]/80">
              <span className="font-bold">Objetivo: </span>{item.objetivo}
            </p>
          )}

          {/* Requisitos */}
          {item.requisitos && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--app-ink)]/80">
              <span className="font-bold">Requisitos: </span>{item.requisitos}
            </p>
          )}

          {/* Fechas de la convocatoria */}
          {(item.fechaInicio || item.fechaFin) && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--app-muted)]">
              {item.fechaInicio && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span className="font-semibold">Inicio:</span> {toDateLabel(item.fechaInicio)}
                </span>
              )}
              {item.fechaFin && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span className="font-semibold">Cierre:</span> {toDateLabel(item.fechaFin)}
                </span>
              )}
            </div>
          )}

          {/* Contacto */}
          {(item.contactoTelefono || item.contactoEmail) && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--app-muted)]">
              {item.contactoTelefono && (
                <a
                  href={`tel:${item.contactoTelefono}`}
                  className="flex items-center gap-1.5 hover:text-[#5b2d8a] transition"
                >
                  <Phone size={14} />{item.contactoTelefono}
                </a>
              )}
              {item.contactoEmail && (
                <a
                  href={`mailto:${item.contactoEmail}`}
                  className="flex items-center gap-1.5 hover:text-[#5b2d8a] transition"
                >
                  <Mail size={14} />{item.contactoEmail}
                </a>
              )}
            </div>
          )}

          {/* Enlace complementario */}
          {item.enlacesComplementarios && (
            <div className="mt-4">
              <a
                href={item.enlacesComplementarios}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#5b2d8a] hover:underline"
              >
                <Link2 size={14} />Enlace complementario
              </a>
            </div>
          )}

          {/* Apply CTA */}
          {item.status === 'open' && !isAdmin && (
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={onApply}
                disabled={applyLoading}
                className={`rounded-full px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  item.hasApplied
                    ? 'border border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
                    : 'bg-[#5b2d8a] text-white hover:opacity-90'
                }`}
              >
                {applyLoading
                  ? 'Procesando...'
                  : item.hasApplied
                  ? '✓ Aplicaste — Retirar aplicación'
                  : 'Aplicar a esta convocatoria'}
              </button>
              {item.hasApplied && (
                <span className="rounded-full bg-[#f3e8ff] px-3 py-1.5 text-xs font-bold text-[#5b2d8a]">
                  Tu aplicación fue enviada
                </span>
              )}
            </div>
          )}

          {item.status !== 'open' && !isAdmin && (
            <div className="mt-6 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]">
              {item.status === 'closed' && 'Esta convocatoria está cerrada.'}
              {item.status === 'suspended' && 'Esta convocatoria está temporalmente suspendida.'}
              {item.status === 'draft' && 'Esta convocatoria aún no está abierta.'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: dates + attachments + FAQ */}
        <div className="space-y-5 lg:col-span-1">
          {/* Key dates */}
          {item.dates.length > 0 && (
            <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">
                Fechas clave
              </h2>
              <ul className="space-y-3">
                {item.dates.map((d) => (
                  <li key={d.dateId} className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }}
                    >
                      <Calendar size={14} style={{ color: '#7c3aed' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--app-muted)]">{d.label}</p>
                      <p className="text-sm font-bold text-[var(--app-ink)]">{toDateLabel(d.dateValue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {item.attachments.length > 0 && (
            <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">
                Archivos adjuntos
              </h2>
              <ul className="space-y-2">
                {item.attachments.map((att) => (
                  <li key={att.attachmentId}>
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm hover:bg-[var(--app-surface-muted)] transition"
                    >
                      <FileText size={14} className="shrink-0 text-[var(--app-muted)]" />
                      <span className="truncate text-[var(--app-ink)]">{att.fileName}</span>
                      <ExternalLink size={12} className="ml-auto shrink-0 text-[var(--app-muted)]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: FAQ + Forum */}
        <div className="space-y-5 lg:col-span-2">
          {/* FAQ */}
          {item.faqs.length > 0 && (
            <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6">
              <h2 className="mb-2 text-base font-extrabold text-[var(--app-ink)]">
                Preguntas frecuentes
              </h2>
              <div>
                {item.faqs.map((faq) => (
                  <FaqItem key={faq.faqId} faq={faq} />
                ))}
              </div>
            </div>
          )}

          {/* Forum */}
          <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-[#7c3aed]" />
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">Foro de la convocatoria</h2>
              <span className="ml-auto text-xs text-[var(--app-muted)]">{posts.length} mensajes</span>
            </div>

            {/* Posts list */}
            {posts.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--app-muted)]">
                Sé el primero en escribir en este foro.
              </p>
            ) : (
              <ul className="space-y-4 mb-5">
                {posts.map((post) => (
                  <li key={post.postId} className={`flex gap-3 ${post.isPinned ? 'rounded-xl bg-[#faf5ff] p-3' : ''}`}>
                    <Avatar name={post.authorName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-[var(--app-ink)]">{post.authorName}</span>
                        {post.isPinned && (
                          <span className="rounded-full bg-[#e9d5ff] px-1.5 py-0.5 text-[10px] font-bold text-[#5b2d8a]">
                            Fijado
                          </span>
                        )}
                        <span className="text-xs text-[var(--app-muted)]">{toRelativeTime(post.createdAt)}</span>
                        {(isAdmin || post.authorUserId === currentUser?.id) && (
                          <button
                            onClick={() => void onDeletePost(post)}
                            className="ml-auto text-[var(--app-muted)] hover:text-red-500 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--app-ink)]/80 whitespace-pre-wrap">
                        {post.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Compose */}
            <form onSubmit={onForumSubmit} className="flex items-end gap-2">
              <textarea
                className="app-textarea flex-1"
                placeholder="Escribe un mensaje en el foro..."
                rows={2}
                value={forumMsg}
                onChange={(e) => setForumMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void onForumSubmit(e);
                }}
              />
              <button
                type="submit"
                disabled={forumLoading || !forumMsg.trim()}
                className="app-button-primary shrink-0 p-3 disabled:opacity-50"
              >
                {forumLoading ? '...' : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Admin panel */}
      {isAdmin && (
        <div className="rounded-2xl border border-[var(--app-border)] bg-white">
          <div className="border-b border-[var(--app-border)] px-6 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">
              Panel de gestión
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--app-border)] px-4">
            {([
              { key: 'images' as const,      label: 'Imágenes',   icon: Upload },
              { key: 'attachments' as const, label: 'Archivos',   icon: Paperclip },
              { key: 'dates' as const,        label: 'Fechas',     icon: Calendar },
              { key: 'faqs' as const,         label: 'FAQ',        icon: MessageSquare },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAdminTab(key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition ${
                  adminTab === key
                    ? 'border-[#5b2d8a] text-[#5b2d8a]'
                    : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                }`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Images tab */}
            {adminTab === 'images' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <R2UploadButton
                    moduleCode="convocatorias"
                    action="update"
                    pathPrefix="convocatorias/images"
                    entityTable="app_networking.convocatoria_images"
                    fieldName="url"
                    accept="image/*"
                    buttonLabel="Subir imagen"
                    onUploaded={(url) => void onImageUploaded(url)}
                  />
                  <p className="text-xs text-[var(--app-muted)]">
                    La primera imagen de la galería se usa como portada si no hay cover_image_url.
                  </p>
                </div>
                {item.images.length === 0 ? (
                  <p className="text-sm text-[var(--app-muted)]">No hay imágenes en la galería.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {item.images.map((img) => (
                      <div key={img.imageId} className="group relative">
                        {isImageUrl(img.url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt="" className="h-24 w-full rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center rounded-xl bg-[var(--app-surface-muted)] text-xs text-[var(--app-muted)]">
                            Archivo
                          </div>
                        )}
                        <button
                          onClick={() => void onRemoveImage(img)}
                          className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:flex"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cover image */}
                <div className="border-t border-[var(--app-border)] pt-4">
                  <p className="mb-2 text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">Imagen de portada (cover_image_url)</p>
                  <div className="flex items-center gap-3">
                    <R2UploadButton
                      moduleCode="convocatorias"
                      action="update"
                      pathPrefix="convocatorias/cover"
                      entityTable="app_networking.convocatorias"
                      fieldName="cover_image_url"
                      accept="image/*"
                      buttonLabel="Subir portada"
                      onUploaded={async (url) => {
                        try {
                          await updateConvocatoria(id, { coverImageUrl: url });
                          await load();
                        } catch (err) {
                          await showError('No se pudo actualizar la portada', err);
                        }
                      }}
                    />
                    {item.coverImageUrl && (
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.coverImageUrl} alt="cover" className="h-12 w-20 rounded-lg object-cover" />
                        <button
                          onClick={async () => {
                            try {
                              await updateConvocatoria(id, { coverImageUrl: null });
                              await load();
                            } catch (err) {
                              await showError('No se pudo eliminar la portada', err);
                            }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments tab */}
            {adminTab === 'attachments' && (
              <div className="space-y-4">
                <R2UploadButton
                  moduleCode="convocatorias"
                  action="update"
                  pathPrefix="convocatorias/attachments"
                  entityTable="app_networking.convocatoria_attachments"
                  fieldName="file_url"
                  buttonLabel="Subir archivo"
                  onUploaded={(url, payload) => void onAttachmentUploaded(url, { fileName: payload.fileName })}
                />
                {item.attachments.length === 0 ? (
                  <p className="text-sm text-[var(--app-muted)]">No hay archivos adjuntos.</p>
                ) : (
                  <ul className="space-y-2">
                    {item.attachments.map((att) => (
                      <li key={att.attachmentId} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] px-3 py-2">
                        <FileText size={14} className="shrink-0 text-[var(--app-muted)]" />
                        <span className="flex-1 truncate text-sm text-[var(--app-ink)]">{att.fileName}</span>
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--app-muted)] hover:text-[#5b2d8a]">
                          <ExternalLink size={13} />
                        </a>
                        <button onClick={() => void onRemoveAttachment(att)} className="text-[var(--app-muted)] hover:text-red-500">
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Dates tab */}
            {adminTab === 'dates' && (
              <DatesEditor initialDates={item.dates} onSave={onSaveDates} />
            )}

            {/* FAQs tab */}
            {adminTab === 'faqs' && (
              <FaqEditor initialFaqs={item.faqs} onSave={onSaveFaqs} />
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editOpen && (
        <EditModal item={item} onSave={onSaveEdit} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
