'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  applyToWorkshop,
  cancelApplication,
  createFaq,
  createForumPost,
  deleteFaq,
  deleteForumPost,
  getWorkshop,
  listFaqs,
  listForumPosts,
  sendInquiry,
  type WorkshopFaqRecord,
  type WorkshopForumPostRecord,
  type WorkshopRecord,
} from '@/features/workshops/client';
import {
  createWorkshopCheckout,
  createWorkshopOrder,
  getEnabledPaymentProviders,
  type EnabledPaymentProvidersResponse,
  type PaymentProviderKey,
} from '@/features/payments/client';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  relacionamiento: { label: 'Relacionamiento', bg: '#e8f4ff', text: '#3f6fa8', dot: '#3f6fa8' },
  formacion:       { label: 'Formación',       bg: '#f3e8ff', text: '#5b2d8a', dot: '#5b2d8a' },
  innovacion:      { label: 'Innovación',      bg: '#fff3e8', text: '#a85d2d', dot: '#a85d2d' },
  wellbeing:       { label: 'Wellbeing',       bg: '#e8fff3', text: '#2d8a5b', dot: '#2d8a5b' },
  otro:            { label: 'Otro',            bg: '#f5f5f5', text: '#6b7280', dot: '#6b7280' },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  upcoming:  { label: 'Próximo',    bg: '#f3e8ff', text: '#5b2d8a' },
  completed: { label: 'Completado', bg: '#e8fff3', text: '#2d8a5b' },
  cancelled: { label: 'Cancelado',  bg: '#fff1f1', text: '#dc2626' },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatMsgTime(value: string) {
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div className={`${cls} shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white`} style={{ backgroundColor: 'var(--brand-primary)' }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={name} className="h-full w-full object-cover" />
        : name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── FAQ Accordion item ─────────────────────────────────────────────────────────

function FaqItem({ faq, canDelete, onDelete }: { faq: WorkshopFaqRecord; canDelete: boolean; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-[var(--app-border)] last:border-0">
      <button
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-[var(--app-ink)]">{faq.question}</span>
        <div className="flex shrink-0 items-center gap-2">
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-rose-500 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-[var(--app-muted)]" /> : <ChevronDown size={16} className="text-[var(--app-muted)]" />}
        </div>
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--app-muted)]">{faq.answer}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkshopDetailPage() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const router = useRouter();
  const { can, currentRole, sessionUser } = useUser();
  const { alert, confirm } = useAppDialog();

  const [workshop, setWorkshop] = React.useState<WorkshopRecord | null>(null);
  const [faqs, setFaqs] = React.useState<WorkshopFaqRecord[]>([]);
  const [posts, setPosts] = React.useState<WorkshopForumPostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'info' | 'faq' | 'foro'>('info');

  // Action states
  const [applying, setApplying] = React.useState(false);
  const [postText, setPostText] = React.useState('');
  const [sendingPost, setSendingPost] = React.useState(false);
  const [showInquiryModal, setShowInquiryModal] = React.useState(false);
  const [inquiryText, setInquiryText] = React.useState('');
  const [sendingInquiry, setSendingInquiry] = React.useState(false);
  const [inquirySent, setInquirySent] = React.useState(false);

  // FAQ add form (gestors/admins)
  const [showAddFaq, setShowAddFaq] = React.useState(false);
  const [faqQ, setFaqQ] = React.useState('');
  const [faqA, setFaqA] = React.useState('');
  const [savingFaq, setSavingFaq] = React.useState(false);

  // ── Pago: estado del flujo de compra para workshops con price > 0 ───────
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentProviders, setPaymentProviders] =
    React.useState<EnabledPaymentProvidersResponse | null>(null);
  const [selectedProvider, setSelectedProvider] =
    React.useState<PaymentProviderKey | 'manual'>('stripe');
  const [purchasing, setPurchasing] = React.useState(false);
  const [paymentBanner, setPaymentBanner] =
    React.useState<{ kind: 'success' | 'cancel'; orderId?: string } | null>(null);

  const canManage = can('workshops', 'manage');
  const isAdmin = ['gestor', 'admin'].includes(currentRole ?? '');

  const showError = React.useCallback(
    async (msg: string, err: unknown) => {
      await alert({ title: 'Error', message: err instanceof Error ? err.message : msg, tone: 'error' });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ws, faqData, postData] = await Promise.all([
        getWorkshop(workshopId),
        listFaqs(workshopId),
        listForumPosts(workshopId),
      ]);
      setWorkshop(ws);
      setFaqs(faqData);
      setPosts(postData);
    } catch (err) {
      await showError('No se pudo cargar el workshop', err);
      router.push('/dashboard/workshops');
    } finally {
      setLoading(false);
    }
  }, [workshopId, showError, router]);

  React.useEffect(() => { void load(); }, [load]);

  // Si volvemos del proveedor de pago (?payment=success|cancel), mostramos
  // el banner y limpiamos la URL para que un refresh no re-dispare. Si fue
  // success, recargamos para que se vea el estado "Inscrito" / "Waitlist".
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('order') ?? undefined;
    if (payment !== 'success' && payment !== 'cancel') return;

    setPaymentBanner({ kind: payment, orderId });
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('order');
    window.history.replaceState({}, '', url.toString());
    if (payment === 'success') {
      void load();
    }
  }, [load]);

  // Cargar proveedores cuando el usuario abra el modal de pago.
  React.useEffect(() => {
    if (!showPaymentModal || paymentProviders !== null) return;
    void getEnabledPaymentProviders()
      .then((data) => {
        setPaymentProviders(data);
        if (data.providers.length > 0) {
          setSelectedProvider(data.providers[0].key);
        } else {
          setSelectedProvider('manual');
        }
      })
      .catch(() => {
        setPaymentProviders({
          providers: [],
          manualFallback: {
            enabled: true,
            label: 'Coordinar pago con 4Shine',
            description:
              'Reservamos tu cupo y nuestro equipo te contactará para coordinar el pago.',
          },
        });
        setSelectedProvider('manual');
      });
  }, [showPaymentModal, paymentProviders]);

  const onApply = async () => {
    if (!workshop) return;
    setApplying(true);
    try {
      const updated = await applyToWorkshop(workshop.workshopId);
      setWorkshop(updated);
    } catch (err) {
      await showError('No se pudo completar la inscripción', err);
    } finally {
      setApplying(false);
    }
  };

  const onCancel = async () => {
    if (!workshop) return;
    const ok = await confirm({
      title: 'Cancelar inscripción',
      message: '¿Deseas cancelar tu inscripción a este workshop?',
      confirmText: 'Cancelar inscripción',
      cancelText: 'Mantener',
      tone: 'warning',
    });
    if (!ok) return;
    setApplying(true);
    try {
      const updated = await cancelApplication(workshop.workshopId);
      setWorkshop(updated);
    } catch (err) {
      await showError('No se pudo cancelar la inscripción', err);
    } finally {
      setApplying(false);
    }
  };

  // Compra del workshop. Crea una orden (o reutiliza la pending) y arranca
  // el checkout del proveedor elegido. Si solo hay fallback manual, marca
  // la intención y muestra al usuario un aviso de coordinación.
  const onPurchase = async () => {
    if (!workshop) return;
    setPurchasing(true);
    try {
      const created = await createWorkshopOrder(workshop.workshopId);
      const orderId = created.order.orderId;

      const providerKey = selectedProvider;
      if (
        providerKey === 'manual' ||
        !paymentProviders?.providers.some((p) => p.key === providerKey)
      ) {
        // Sin proveedor real: la orden queda en pending_payment para que
        // admin la concilie manualmente.
        await alert({
          title: 'Compra registrada',
          message:
            'Tu reserva quedó pendiente. Nuestro equipo te contactará para coordinar el pago.',
          tone: 'info',
        });
        setShowPaymentModal(false);
        return;
      }

      const checkout = await createWorkshopCheckout({ orderId, provider: providerKey });
      window.location.href = checkout.redirectUrl;
    } catch (err) {
      await showError('No se pudo iniciar la compra', err);
    } finally {
      setPurchasing(false);
    }
  };

  const onSendPost = async () => {
    if (!workshop || !postText.trim()) return;
    setSendingPost(true);
    try {
      const post = await createForumPost(workshop.workshopId, postText.trim());
      setPosts((prev) => [...prev, post]);
      setPostText('');
    } catch (err) {
      await showError('No se pudo enviar el mensaje', err);
    } finally {
      setSendingPost(false);
    }
  };

  const onDeletePost = async (postId: string) => {
    if (!workshop) return;
    const ok = await confirm({ title: 'Eliminar mensaje', message: '¿Eliminar este mensaje?', confirmText: 'Eliminar', cancelText: 'Cancelar', tone: 'warning' });
    if (!ok) return;
    try {
      await deleteForumPost(workshop.workshopId, postId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (err) {
      await showError('No se pudo eliminar el mensaje', err);
    }
  };

  const onSaveFaq = async () => {
    if (!workshop || !faqQ.trim() || !faqA.trim()) return;
    setSavingFaq(true);
    try {
      const faq = await createFaq(workshop.workshopId, { question: faqQ.trim(), answer: faqA.trim() });
      setFaqs((prev) => [...prev, faq]);
      setFaqQ(''); setFaqA(''); setShowAddFaq(false);
    } catch (err) {
      await showError('No se pudo guardar la pregunta', err);
    } finally {
      setSavingFaq(false);
    }
  };

  const onDeleteFaq = async (faqId: string) => {
    if (!workshop) return;
    try {
      await deleteFaq(workshop.workshopId, faqId);
      setFaqs((prev) => prev.filter((f) => f.faqId !== faqId));
    } catch (err) {
      await showError('No se pudo eliminar la pregunta', err);
    }
  };

  const onSendInquiry = async () => {
    if (!workshop || !inquiryText.trim()) return;
    setSendingInquiry(true);
    try {
      await sendInquiry(workshop.workshopId, inquiryText.trim());
      setInquirySent(true);
      setInquiryText('');
    } catch (err) {
      await showError('No se pudo enviar la consulta', err);
    } finally {
      setSendingInquiry(false);
    }
  };

  if (loading || !workshop) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[var(--app-muted)]">Cargando...</p>
      </div>
    );
  }

  const type = TYPE_META[workshop.workshopType] ?? TYPE_META.otro;
  const status = STATUS_META[workshop.status] ?? STATUS_META.upcoming;
  const isUpcoming = workshop.status === 'upcoming';
  const isRegistered = workshop.myAttendanceStatus === 'registered' || workshop.myAttendanceStatus === 'attended';

  // ── Action card ──────────────────────────────────────────────────────────────
  const actionCard = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 shadow-sm">
        {/* Dates */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
              <CalendarDays size={15} className="text-[var(--app-muted)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Fecha</p>
              <p className="text-sm font-semibold text-[var(--app-ink)]">{formatDate(workshop.startsAt)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
              <Clock size={15} className="text-[var(--app-muted)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Horario</p>
              <p className="text-sm font-semibold text-[var(--app-ink)]">{formatTime(workshop.startsAt)} – {formatTime(workshop.endsAt)}</p>
            </div>
          </div>
          {workshop.facilitatorName && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
                <User size={15} className="text-[var(--app-muted)]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Facilitador</p>
                <p className="text-sm font-semibold text-[var(--app-ink)]">{workshop.facilitatorName}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
              <Users size={15} className="text-[var(--app-muted)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Inscritos</p>
              <p className="text-sm font-semibold text-[var(--app-ink)]">
                {workshop.attendees}{workshop.maxAttendees ? ` / ${workshop.maxAttendees}` : ''}
              </p>
            </div>
          </div>
          {workshop.price !== null && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
                <DollarSign size={15} className="text-[var(--app-muted)]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Precio</p>
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  {workshop.currency} {Number(workshop.price).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2.5 border-t border-[var(--app-border)] pt-4">
          {paymentBanner?.kind === 'success' && (
            <div className="rounded-xl bg-[#e8fff3] px-4 py-2.5 text-sm font-semibold text-[#2d8a5b]">
              ✓ Pago confirmado. Te inscribimos al workshop.
            </div>
          )}
          {paymentBanner?.kind === 'cancel' && (
            <div className="rounded-xl bg-[#fef3c7] px-4 py-2.5 text-sm font-semibold text-[#92400e]">
              Cancelaste el pago. Tu reserva sigue pendiente.
            </div>
          )}
          {isUpcoming && (
            isRegistered ? (
              <>
                <div className="flex items-center gap-2 rounded-xl bg-[#e8fff3] px-4 py-2.5">
                  <span className="text-sm font-bold text-[#2d8a5b]">✓ Inscrito</span>
                </div>
                {workshop.meetingUrl && (
                  <a
                    href={workshop.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
                  >
                    <ExternalLink size={15} />
                    Unirme a la sesión
                  </a>
                )}
                <button
                  onClick={() => void onCancel()}
                  disabled={applying}
                  className="w-full text-center text-xs text-[var(--app-muted)] underline hover:text-[var(--app-ink)] disabled:opacity-50"
                >
                  Cancelar inscripción
                </button>
              </>
            ) : workshop.price !== null && Number(workshop.price) > 0 ? (
              // Workshop de pago: botón "Comprar" abre selector de proveedor.
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={applying || purchasing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                Comprar · {workshop.currency} {Number(workshop.price).toLocaleString('es-CO')}
              </button>
            ) : (
              // Workshop gratis: flujo de inscripción directa (sin órdenes).
              <button
                onClick={() => void onApply()}
                disabled={applying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {applying ? 'Inscribiendo...' : 'Inscribirme'}
              </button>
            )
          )}

          {!isUpcoming && (
            <div
              className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              {status.label}
            </div>
          )}

          <button
            onClick={() => { setShowInquiryModal(true); setInquirySent(false); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <MessageCircle size={15} />
            Solicitar información
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Back + edit */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/workshops')}
          className="flex items-center gap-1.5 text-sm text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
        >
          <ArrowLeft size={15} /> Workshops
        </button>
        {canManage && (
          <button
            onClick={() => router.push(`/dashboard/workshops/${workshopId}/edit`)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] shadow-sm transition hover:bg-[var(--app-surface-muted)]"
          >
            <Pencil size={12} /> Editar
          </button>
        )}
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl px-7 py-8"
        style={{ background: `linear-gradient(135deg, ${type.bg} 0%, #ffffff 100%)` }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: type.bg, color: type.text }}>{type.label}</span>
          <span className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: status.bg, color: status.text }}>{status.label}</span>
        </div>
        <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--app-ink)] sm:text-3xl">{workshop.title}</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {formatDate(workshop.startsAt)} · {formatTime(workshop.startsAt)}–{formatTime(workshop.endsAt)}
          {workshop.facilitatorName && ` · ${workshop.facilitatorName}`}
        </p>
      </div>

      {/* Mobile action card */}
      <div className="mt-4 lg:hidden">{actionCard}</div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-2xl border border-[var(--app-border)] bg-white p-1.5">
        {(['info', 'faq', 'foro'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            {tab === 'info' ? 'Información' : tab === 'faq' ? 'Preguntas frecuentes' : 'Foro'}
          </button>
        ))}
      </div>

      {/* Desktop: 2 column layout */}
      <div className="mt-4 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-5">
        {/* Left: tab content */}
        <div>
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6">
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">Acerca del workshop</h2>
                {workshop.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">{workshop.description}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-[var(--app-muted)]">Sin descripción disponible.</p>
                )}
              </div>

              {/* Location */}
              {(workshop.locationName || workshop.locationAddress) && (
                <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6">
                  <h2 className="mb-3 text-base font-extrabold text-[var(--app-ink)]">Ubicación</h2>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
                      <MapPin size={15} className="text-[var(--app-muted)]" />
                    </div>
                    <div>
                      {workshop.locationName && (
                        <p className="text-sm font-semibold text-[var(--app-ink)]">{workshop.locationName}</p>
                      )}
                      {workshop.locationAddress && (
                        <p className="text-sm text-[var(--app-muted)]">{workshop.locationAddress}</p>
                      )}
                      {(workshop.locationLat || workshop.locationAddress) && (() => {
                        const url = workshop.locationLat && workshop.locationLng
                          ? `https://www.google.com/maps?q=${workshop.locationLat},${workshop.locationLng}`
                          : `https://www.google.com/maps/search/${encodeURIComponent(workshop.locationAddress ?? '')}`;
                        return (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline">
                            Ver en Google Maps <ExternalLink size={10} />
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                  {workshop.locationPhotos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {workshop.locationPhotos.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="" className="h-28 w-40 rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              {workshop.price !== null && (
                <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6">
                  <h2 className="mb-3 text-base font-extrabold text-[var(--app-ink)]">Precio</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-muted)]">
                      <DollarSign size={15} className="text-[var(--app-muted)]" />
                    </div>
                    <p className="text-sm font-bold text-[var(--app-ink)]">
                      {workshop.currency} {Number(workshop.price).toLocaleString('es-CO')}
                    </p>
                    {workshop.maxAttendees && (
                      <span className="text-xs text-[var(--app-muted)]">· Máx. {workshop.maxAttendees} asistentes</span>
                    )}
                  </div>
                </div>
              )}

              {/* Speakers */}
              {workshop.speakers.length > 0 && (
                <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6">
                  <h2 className="mb-4 text-base font-extrabold text-[var(--app-ink)]">Ponentes</h2>
                  <div className="space-y-4">
                    {workshop.speakers.map((speaker, i) => (
                      <div key={i} className="flex gap-3">
                        {speaker.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={speaker.avatarUrl} alt={speaker.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-surface-strong)] text-sm font-bold text-[var(--brand-primary)]">
                            {speaker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[var(--app-ink)]">{speaker.name}</p>
                          {speaker.role && <p className="text-xs font-semibold text-[var(--app-muted)]">{speaker.role}</p>}
                          {speaker.bio && <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{speaker.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agenda */}
              {workshop.agenda.length > 0 && (
                <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6">
                  <h2 className="mb-4 text-base font-extrabold text-[var(--app-ink)]">Agenda</h2>
                  <ol className="relative border-l border-[var(--app-border)] pl-5 space-y-4">
                    {workshop.agenda.map((item, i) => (
                      <li key={i} className="relative">
                        <div className="absolute -left-[1.35rem] flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--brand-primary)] bg-white" />
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--brand-primary)]">{item.time}</span>
                          <p className="text-sm font-semibold text-[var(--app-ink)]">{item.title}</p>
                          {item.description && <p className="text-xs text-[var(--app-muted)]">{item.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="rounded-2xl border border-[var(--app-border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">Preguntas frecuentes</h2>
                {canManage && (
                  <button
                    onClick={() => setShowAddFaq((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                )}
              </div>

              {showAddFaq && canManage && (
                <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-4 space-y-2.5">
                  <input
                    value={faqQ}
                    onChange={(e) => setFaqQ(e.target.value)}
                    placeholder="Pregunta"
                    className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
                  />
                  <textarea
                    value={faqA}
                    onChange={(e) => setFaqA(e.target.value)}
                    placeholder="Respuesta"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[var(--app-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => void onSaveFaq()} disabled={savingFaq || !faqQ.trim() || !faqA.trim()} className="rounded-full bg-[var(--brand-primary)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition">
                      {savingFaq ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => { setShowAddFaq(false); setFaqQ(''); setFaqA(''); }} className="rounded-full border border-[var(--app-border)] px-4 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:bg-white transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {faqs.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-[var(--app-muted)]">No hay preguntas frecuentes aún.</p>
              ) : (
                faqs.map((faq) => (
                  <FaqItem key={faq.faqId} faq={faq} canDelete={isAdmin} onDelete={() => void onDeleteFaq(faq.faqId)} />
                ))
              )}
            </div>
          )}

          {activeTab === 'foro' && (
            <div className="rounded-2xl border border-[var(--app-border)] bg-white">
              <div className="border-b border-[var(--app-border)] px-5 py-4">
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">Foro</h2>
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">Preguntas y comentarios de la comunidad.</p>
              </div>

              <div className="divide-y divide-[var(--app-border)]">
                {posts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-[var(--app-muted)]">Sé el primero en participar.</p>
                ) : (
                  posts.map((post) => {
                    const isMine = post.authorUserId === sessionUser?.id;
                    const canDel = isMine || isAdmin;
                    return (
                      <div key={post.postId} className="group flex gap-3 px-5 py-4">
                        <Avatar name={post.authorName} url={post.authorAvatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-[var(--app-ink)]">{post.authorName}</span>
                            <span className="text-[11px] text-[var(--app-muted)]">{formatMsgTime(post.createdAt)}</span>
                            {canDel && (
                              <button
                                onClick={() => void onDeletePost(post.postId)}
                                className="ml-auto hidden rounded-full p-1 text-[var(--app-muted)] hover:text-rose-500 transition group-hover:block"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">{post.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Post input */}
              <div className="border-t border-[var(--app-border)] px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void onSendPost(); } }}
                    placeholder="Escribe un mensaje al foro..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--brand-primary)] focus:bg-white placeholder:text-[var(--app-muted)]"
                  />
                  <button
                    onClick={() => void onSendPost()}
                    disabled={!postText.trim() || sendingPost}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop action card */}
        <div className="hidden lg:block">
          <div className="sticky top-6">{actionCard}</div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => setShowInquiryModal(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[var(--app-ink)]">Solicitar información</h3>
              <button onClick={() => setShowInquiryModal(false)} className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] transition">
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--app-muted)]">Tu pregunta llegará directamente al facilitador o gestor del workshop.</p>

            {inquirySent ? (
              <div className="mt-5 rounded-2xl bg-[#e8fff3] px-5 py-4 text-center">
                <p className="text-sm font-bold text-[#2d8a5b]">¡Mensaje enviado!</p>
                <p className="mt-1 text-xs text-[#2d8a5b]">Revisa Mensajes para ver la respuesta.</p>
                <button
                  onClick={() => router.push('/dashboard/mensajes')}
                  className="mt-3 rounded-full bg-[#2d8a5b] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                >
                  Ver en Mensajes →
                </button>
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  rows={4}
                  className="mt-4 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:bg-white placeholder:text-[var(--app-muted)]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void onSendInquiry()}
                    disabled={!inquiryText.trim() || sendingInquiry}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition"
                  >
                    <Send size={14} />
                    {sendingInquiry ? 'Enviando...' : 'Enviar pregunta'}
                  </button>
                  <button
                    onClick={() => setShowInquiryModal(false)}
                    className="rounded-full border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] transition"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de pago: aparece cuando el usuario da click en "Comprar". */}
      {showPaymentModal && workshop && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => !purchasing && setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[24px] bg-white shadow-2xl sm:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Workshop
                </p>
                <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                  {workshop.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !purchasing && setShowPaymentModal(false)}
                className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Total a pagar
                </p>
                <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">
                  {workshop.currency} {Number(workshop.price ?? 0).toLocaleString('es-CO')}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Método de pago
                </p>
                <div className="mt-2 space-y-2">
                  {paymentProviders === null ? (
                    <p className="text-sm text-[var(--app-muted)]">Cargando opciones…</p>
                  ) : paymentProviders.providers.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">
                      {paymentProviders.manualFallback.description}
                    </p>
                  ) : (
                    paymentProviders.providers.map((p) => {
                      const isActive = selectedProvider === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setSelectedProvider(p.key)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            isActive
                              ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]'
                              : 'border-[var(--app-border)] bg-white hover:border-[var(--app-border-strong)]'
                          }`}
                        >
                          <span
                            className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full border-2 ${
                              isActive
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]'
                                : 'border-[var(--app-border)] bg-white'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--app-ink)]">
                              {p.label}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                              {p.description}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border)] pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !purchasing && setShowPaymentModal(false)}
                  disabled={purchasing}
                  className="rounded-xl border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-ink)] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void onPurchase()}
                  disabled={purchasing || paymentProviders === null}
                  className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {purchasing ? 'Procesando…' : 'Ir a pagar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
