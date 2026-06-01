'use client';

import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  PartyPopper,
  Pencil,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  bulkCreateMentorAvailability,
  deleteAvailabilitySlot,
  createAdditionalMentorshipOrder,
  createGroupSession,
  createGroupSessionRecording,
  createMentorship,
  deleteGroupSession,
  deleteMentorship,
  dispatchGroupSessionReminders,
  dispatchProgramMentorshipReminders,
  getGroupSessionAnalytics,
  getMentorshipOverview,
  inviteGroupSessionByRoles,
  participateInGroupSession,
  reactToGroupSessionRecording,
  scheduleProgramMentorship,
  commentGroupSessionRecording,
  upsertMentorAvailabilitySlot,
  updateGroupSession,
  updateMentorship,
  type AdditionalMentorshipOrderRecord,
  type GroupSessionAnalyticsRecord,
  type GroupSessionEventRecord,
  type GroupSessionParticipationStatus,
  type GroupSessionReaction,
  type GroupSessionRecordingRecord,
  type MentorCatalogRecord,
  type MentorOfferingRecord,
  type MentorshipOverviewRecord,
  type MentorshipRecord,
  type MentorshipSessionType,
  type MentorshipStatus,
} from '@/features/mentorias/client';

interface ProgramScheduleFormState {
  entitlementId: string;
  mentorUserId: string;
  startsAt: string;
  note: string;
}

interface AdditionalPurchaseFormState {
  offerId: string;
  startsAt: string;
  topic: string;
  note: string;
}

interface OpsCreateFormState {
  title: string;
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  meetingUrl: string;
}

interface GroupSessionFormState {
  title: string;
  startsAt: string;
  durationMinutes: string;
  hostUserId: string;
  externalExpertName: string;
  externalExpertBio: string;
  description: string;
  bannerImageUrl: string;
}

interface GroupRecordingFormState {
  eventId: string;
  title: string;
  recordingUrl: string;
  durationMinutes: string;
  description: string;
}

interface AvailabilitySlotFormState {
  mentorUserId: string;
  startsAt: string;
}

interface AvailabilityBulkFormState {
  mentorUserId: string;
  fromDate: string;
  toDate: string;
  startHour: string;
  weekdays: number[];
  numberOfSlots: string;
}

type MentoriaSection = 'grupales' | 'programa' | 'comprar';
interface MentoriasViewProps {
  forcedSection?: MentoriaSection;
}
type WizardStep = 1 | 2 | 3;

const SESSION_STATUS_META: Record<MentorshipStatus, { label: string; tone: string }> = {
  scheduled: { label: 'Programada', tone: 'bg-sky-100 text-sky-700' },
  completed: { label: 'Completada', tone: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelada', tone: 'bg-rose-100 text-rose-700' },
  pending_rating: { label: 'Pendiente de feedback', tone: 'bg-violet-100 text-violet-700' },
  pending_approval: { label: 'Pendiente de aprobación', tone: 'bg-amber-100 text-amber-700' },
  no_show: { label: 'No asistió', tone: 'bg-slate-200 text-slate-700' },
};

const PROGRAM_STATUS_META = {
  available: { label: 'Disponible', tone: 'bg-white text-[var(--app-ink)] border-[var(--app-border)]' },
  scheduled: { label: 'Programada', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completada', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  locked: { label: 'Bloqueada', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
} as const;

const ORDER_STATUS_META = {
  pending_payment: { label: 'Pago pendiente', tone: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Agendada', tone: 'bg-sky-100 text-sky-700' },
  completed: { label: 'Completada', tone: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelada', tone: 'bg-rose-100 text-rose-700' },
} as const;

function startOfWeek(input: Date): Date {
  const date = new Date(input);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, amount: number): Date {
  const date = new Date(input);
  date.setDate(date.getDate() + amount);
  return date;
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function isGroupSessionPast(event: { endsAt: string }): boolean {
  return new Date(event.endsAt).getTime() < Date.now();
}

function toDatetimeLocalInput(value: string): string {
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function nextSlotValue(): string {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 2);
  return toDatetimeLocalInput(date.toISOString());
}

function formatDateTime(value: string | null, timezone?: string): string {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || undefined,
  });
}

function formatTime(value: string, timezone?: string): string {
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || undefined,
  });
}

function formatWeekday(value: Date): string {
  return value.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatCurrency(value: number, currencyCode: string): string {
  if (value <= 0) {
    return 'Precio a coordinar';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function phaseLabel(value: string): string {
  if (value === 'shine_within') return 'Shine Within';
  if (value === 'shine_out') return 'Shine Out';
  if (value === 'shine_up') return 'Shine Up';
  if (value === 'shine_beyond') return 'Shine Beyond';
  return 'Programa';
}

function sessionOriginLabel(session: MentorshipRecord): string {
  if (session.sessionOrigin === 'program_included') return 'Incluida';
  if (session.sessionOrigin === 'additional_paid') return 'Adicional';
  return 'Operativa';
}

function findOfferById(overview: MentorshipOverviewRecord | null, offerId: string): {
  mentor: MentorCatalogRecord;
  offer: MentorOfferingRecord;
} | null {
  if (!overview) return null;

  for (const mentor of overview.mentorCatalog) {
    for (const offer of mentor.offers) {
      if (offer.offerId === offerId) {
        return { mentor, offer };
      }
    }
  }

  return null;
}

function sessionsForWeek(sessions: MentorshipRecord[], weekStart: Date): MentorshipRecord[] {
  const weekEnd = addDays(weekStart, 7);
  return sessions
    .filter((session) => {
      const date = new Date(session.startsAt);
      return date >= weekStart && date < weekEnd && session.status !== 'cancelled';
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

function upcomingSessions(sessions: MentorshipRecord[]): MentorshipRecord[] {
  const now = Date.now();
  return sessions
    .filter((session) => new Date(session.startsAt).getTime() >= now && session.status !== 'cancelled')
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 5);
}

function monthStart(input: Date): Date {
  const date = new Date(input);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthLabel(input: Date): string {
  return input.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function MentoriasView({ forcedSection }: MentoriasViewProps = {}) {
  const { alert, confirm } = useAppDialog();
  const { tokens: brandingTokens } = useBranding();
  const tz = brandingTokens.layout.timezone || undefined;
  const { can, currentRole, currentUser, refreshBootstrap, viewerAccess } = useUser();
  const [overview, setOverview] = React.useState<MentorshipOverviewRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submittingProgram, setSubmittingProgram] = React.useState(false);
  const [submittingAdditional, setSubmittingAdditional] = React.useState(false);
  const [submittingOps, setSubmittingOps] = React.useState(false);
  const [submittingGroupSession, setSubmittingGroupSession] = React.useState(false);
  const [submittingGroupRecording, setSubmittingGroupRecording] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<MentoriaSection>(forcedSection ?? 'grupales');
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<Date>(() => startOfWeek(new Date()));
  const [selectedMonthStart, setSelectedMonthStart] = React.useState<Date>(() => monthStart(new Date()));
  const [groupWizardStep, setGroupWizardStep] = React.useState<WizardStep>(1);
  const [opsWizardStep, setOpsWizardStep] = React.useState<WizardStep>(1);
  const [programWizardStep, setProgramWizardStep] = React.useState<WizardStep>(1);
  const [additionalWizardStep, setAdditionalWizardStep] = React.useState<WizardStep>(1);
  const [activeAdviserId, setActiveAdviserId] = React.useState<string | null>(null);
  const [programForm, setProgramForm] = React.useState<ProgramScheduleFormState>({
    entitlementId: '',
    mentorUserId: '',
    startsAt: nextSlotValue(),
    note: '',
  });
  const [additionalForm, setAdditionalForm] = React.useState<AdditionalPurchaseFormState>({
    offerId: '',
    startsAt: nextSlotValue(),
    topic: '',
    note: '',
  });
  const [opsForm, setOpsForm] = React.useState<OpsCreateFormState>({
    title: '',
    startsAt: '',
    endsAt: '',
    sessionType: 'individual',
    meetingUrl: '',
  });
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [selectedGroupSession, setSelectedGroupSession] = React.useState<GroupSessionEventRecord | null>(null);
  const [confirmedSession, setConfirmedSession] = React.useState<GroupSessionEventRecord | null>(null);
  const [confirmedProgramBooking, setConfirmedProgramBooking] = React.useState<MentorshipRecord | null>(null);
  const [cancellingSession, setCancellingSession] = React.useState<MentorshipRecord | null>(null);
  const [cancelForm, setCancelForm] = React.useState({ reason: '', proposedStartsAt: '' });
  const [participatingInId, setParticipatingInId] = React.useState<string | null>(null);
  const [groupSessionForm, setGroupSessionForm] = React.useState<GroupSessionFormState>({
    title: '',
    startsAt: nextSlotValue(),
    durationMinutes: '60',
    hostUserId: '',
    externalExpertName: '',
    externalExpertBio: '',
    description: '',
    bannerImageUrl: '',
  });
  const [groupRecordingForm, setGroupRecordingForm] = React.useState<GroupRecordingFormState>({
    eventId: '',
    title: '',
    recordingUrl: '',
    durationMinutes: '',
    description: '',
  });
  const [recordingCommentDrafts, setRecordingCommentDrafts] = React.useState<Record<string, string>>({});
  const [recordingSearch, setRecordingSearch] = React.useState('');
  const [recordingTopicFilter, setRecordingTopicFilter] = React.useState<string | null>(null);
  const [groupAnalytics, setGroupAnalytics] = React.useState<GroupSessionAnalyticsRecord[]>([]);
  const [availabilitySlotForm, setAvailabilitySlotForm] = React.useState<AvailabilitySlotFormState>({
    mentorUserId: '',
    startsAt: nextSlotValue(),
  });
  const [availabilityTab, setAvailabilityTab] = React.useState<'single' | 'bulk'>('single');
  const [availabilityBulkForm, setAvailabilityBulkForm] = React.useState<AvailabilityBulkFormState>({
    mentorUserId: '',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    startHour: '9',
    weekdays: [1, 2, 3, 4, 5],
    numberOfSlots: '1',
  });

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMentorshipOverview();
      setOverview(data);
    } catch (error) {
      await showError('No se pudo cargar el módulo de mentorías.', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'gestor') return;
    void getGroupSessionAnalytics()
      .then(setGroupAnalytics)
      .catch(() => setGroupAnalytics([]));
  }, [currentRole, overview]);

  React.useEffect(() => {
    if (!overview) {
      return;
    }

    const firstAvailableEntitlement =
      overview.programEntitlements.find((item) => item.status === 'available') ??
      overview.programEntitlements[0];
    const firstMentor = overview.mentorCatalog[0];
    const firstOffer = overview.mentorCatalog.flatMap((mentor) => mentor.offers)[0];

    setProgramForm((prev) => ({
      entitlementId: prev.entitlementId || firstAvailableEntitlement?.entitlementId || '',
      mentorUserId: prev.mentorUserId || firstMentor?.mentorUserId || '',
      startsAt: prev.startsAt || nextSlotValue(),
      note: prev.note,
    }));

    setAdditionalForm((prev) => ({
      offerId: prev.offerId || firstOffer?.offerId || '',
      startsAt: prev.startsAt || nextSlotValue(),
      topic: prev.topic,
      note: prev.note,
    }));
    if (currentRole !== 'lider') {
      const defaultMentorId = currentRole === 'mentor'
        ? (currentUser?.id ?? '')
        : (overview.mentorCatalog[0]?.mentorUserId ?? '');
      setAvailabilitySlotForm((prev) => ({
        ...prev,
        mentorUserId: prev.mentorUserId || defaultMentorId,
      }));
      setAvailabilityBulkForm((prev) => ({
        ...prev,
        mentorUserId: prev.mentorUserId || defaultMentorId,
      }));
    }
  }, [overview, currentRole]);

  React.useEffect(() => {
    if (forcedSection) {
      setActiveSection(forcedSection);
    }
  }, [forcedSection]);

  const leaderName = currentUser?.name?.split(' ')[0] ?? 'Líder';
  const isOpenLeader =
    currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const mentorshipOffers = filterCommercialProducts(viewerAccess?.catalog, {
    groups: ['program', 'mentoring_pack'],
  });
  const weekSessions = sessionsForWeek(overview?.sessions ?? [], selectedWeekStart);
  const nextSessions = upcomingSessions(overview?.sessions ?? []);
  const days = Array.from({ length: 7 }, (_, index) => addDays(selectedWeekStart, index));
  const selectedOffer = findOfferById(overview, additionalForm.offerId);
  const selectedEntitlement =
    overview?.programEntitlements.find((item) => item.entitlementId === programForm.entitlementId) ?? null;
  const mentorCatalog = overview?.mentorCatalog ?? [];
  const groupSessions = [...(overview?.groupSessions ?? [])].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  const upcomingGroupSession =
    groupSessions.find((item) => new Date(item.startsAt).getTime() >= Date.now()) ?? groupSessions[0] ?? null;
  const groupRecordings = overview?.groupSessionRecordings ?? [];
  const monthDays = React.useMemo(() => {
    const base = monthStart(selectedMonthStart);
    const start = new Date(base);
    start.setDate(1 - ((base.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [selectedMonthStart]);

  const leaderStats = overview
    ? [
        {
          label: 'Incluidas',
          value: overview.programEntitlements.length,
          hint: isOpenLeader
            ? 'El plan free no incluye mentorías del programa.'
            : 'Mentorías del programa disponibles para agendar.',
        },
        {
          label: 'Agendadas',
          value: overview.programEntitlements.filter((item) => item.status === 'scheduled').length,
          hint: isOpenLeader
            ? 'Verás aquí las incluidas cuando actives el programa.'
            : 'Mentorías incluidas ya reservadas con Adviser.',
        },
        {
          label: 'Adicionales',
          value: overview.additionalOrders.length,
          hint: 'Compras o reservas extra realizadas por el líder.',
        },
        {
          label: 'Semana',
          value: weekSessions.length,
          hint: 'Sesiones visibles en la agenda semanal.',
        },
      ]
    : [];

  const opsStats = overview
    ? [
        {
          label: 'Sesiones',
          value: overview.sessions.length,
          hint: 'Registro total visible para tu rol.',
        },
        {
          label: 'Programadas',
          value: overview.sessions.filter((item) => item.status === 'scheduled').length,
          hint: 'Próximas sesiones activas.',
        },
        {
          label: 'Completadas',
          value: overview.sessions.filter((item) => item.status === 'completed').length,
          hint: 'Sesiones cerradas y finalizadas.',
        },
        {
          label: 'Advisers',
          value: overview.mentorCatalog.length,
          hint: 'Advisers activos en el catálogo.',
        },
      ]
    : [];

  const handleProgramSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!programForm.entitlementId || !programForm.mentorUserId || !programForm.startsAt) {
      return;
    }

    setSubmittingProgram(true);
    try {
      const booked = await scheduleProgramMentorship({
        entitlementId: programForm.entitlementId,
        mentorUserId: programForm.mentorUserId,
        startsAt: toIso(programForm.startsAt),
        note: programForm.note.trim() || null,
      });
      setProgramForm((prev) => ({
        ...prev,
        entitlementId: '',
        startsAt: nextSlotValue(),
        note: '',
      }));
      await Promise.all([load(), refreshBootstrap()]);
      setConfirmedProgramBooking(booked);
    } catch (error) {
      await showError('No se pudo programar la mentoría incluida.', error);
    } finally {
      setSubmittingProgram(false);
    }
  };

  const handleAdditionalPurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!additionalForm.offerId || !additionalForm.startsAt) {
      return;
    }

    setSubmittingAdditional(true);
    try {
      await createAdditionalMentorshipOrder({
        offerId: additionalForm.offerId,
        startsAt: toIso(additionalForm.startsAt),
        topic: additionalForm.topic.trim() || null,
        note: additionalForm.note.trim() || null,
      });
      setAdditionalForm((prev) => ({
        ...prev,
        startsAt: nextSlotValue(),
        topic: '',
        note: '',
      }));
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo registrar la sesión adicional.', error);
    } finally {
      setSubmittingAdditional(false);
    }
  };

  const handleOpsCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!opsForm.title.trim() || !opsForm.startsAt || !opsForm.endsAt) {
      return;
    }

    setSubmittingOps(true);
    try {
      await createMentorship({
        title: opsForm.title.trim(),
        startsAt: toIso(opsForm.startsAt),
        endsAt: toIso(opsForm.endsAt),
        sessionType: opsForm.sessionType,
        meetingUrl: opsForm.meetingUrl.trim() || null,
      });
      setOpsForm({
        title: '',
        startsAt: '',
        endsAt: '',
        sessionType: 'individual',
        meetingUrl: '',
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo crear la mentoría.', error);
    } finally {
      setSubmittingOps(false);
    }
  };

  const handleDeleteSession = async (session: MentorshipRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar mentoría',
      message: `¿Deseas eliminar la sesión "${session.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteMentorship(session.sessionId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo eliminar la mentoría.', error);
    }
  };

  const handleStatusChange = async (session: MentorshipRecord, status: MentorshipStatus) => {
    if (status === 'cancelled') {
      setCancellingSession(session);
      setCancelForm({ reason: '', proposedStartsAt: '' });
      return;
    }
    try {
      await updateMentorship(session.sessionId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo actualizar el estado de la sesión.', error);
    }
  };

  const handleCancelSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancellingSession || !cancelForm.reason.trim() || !cancelForm.proposedStartsAt) return;
    try {
      await updateMentorship(cancellingSession.sessionId, {
        status: 'cancelled',
        changeReason: cancelForm.reason.trim(),
        proposedStartsAt: toIso(cancelForm.proposedStartsAt),
      });
      setCancellingSession(null);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo cancelar la mentoría.', error);
    }
  };

  const handleCreateGroupSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupSessionForm.title.trim() || !groupSessionForm.startsAt) return;

    const startsAt = toIso(groupSessionForm.startsAt);
    const durationMs = Math.max(15, parseInt(groupSessionForm.durationMinutes, 10)) * 60000;
    const endsAt = new Date(new Date(startsAt).getTime() + durationMs).toISOString();
    const payload = {
      title: groupSessionForm.title.trim(),
      description: groupSessionForm.description.trim() || null,
      startsAt,
      endsAt,
      hostUserId: groupSessionForm.hostUserId || null,
      externalExpertName: groupSessionForm.externalExpertName.trim() || null,
      externalExpertBio: groupSessionForm.externalExpertBio.trim() || null,
      bannerImageUrl: groupSessionForm.bannerImageUrl.trim() || null,
    };

    setSubmittingGroupSession(true);
    try {
      if (editingEventId) {
        await updateGroupSession(editingEventId, payload);
        setEditingEventId(null);
      } else {
        await createGroupSession(payload);
      }
      setGroupSessionForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        externalExpertName: '',
        externalExpertBio: '',
        bannerImageUrl: '',
      }));
      setGroupWizardStep(1);
      await load();
    } catch (error) {
      await showError(editingEventId ? 'No se pudo actualizar la sesión.' : 'No se pudo crear la sesión grupal.', error);
    } finally {
      setSubmittingGroupSession(false);
    }
  };

  const handleEditGroupSession = (session: GroupSessionEventRecord) => {
    const durationMs = new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime();
    const mins = Math.max(15, Math.round(durationMs / 60000));
    const closestOption = [30, 45, 60, 90, 120, 180].reduce((a, b) =>
      Math.abs(b - mins) < Math.abs(a - mins) ? b : a,
    );
    setEditingEventId(session.eventId);
    setGroupSessionForm({
      title: session.title,
      startsAt: toDatetimeLocalInput(session.startsAt),
      durationMinutes: String(closestOption),
      hostUserId: session.hostUserId ?? '',
      externalExpertName: session.externalExpertName ?? '',
      externalExpertBio: session.externalExpertBio ?? '',
      description: session.description ?? '',
      bannerImageUrl: session.bannerImageUrl ?? '',
    });
    setGroupWizardStep(1);
  };

  const handleDeleteGroupSession = async (session: GroupSessionEventRecord) => {
    const confirmed = await confirm({
      title: 'Eliminar sesión',
      message: `¿Estás seguro de que deseas eliminar "${session.title}"? Esta acción también cancelará la reunión en Zoom.`,
      confirmText: 'Eliminar',
      tone: 'warning',
    });
    if (!confirmed) return;
    try {
      await deleteGroupSession(session.eventId);
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la sesión.', error);
    }
  };

  const handleParticipate = async (eventItem: GroupSessionEventRecord, status: GroupSessionParticipationStatus) => {
    setParticipatingInId(eventItem.eventId);
    try {
      const updated = await participateInGroupSession(eventItem.eventId, status);
      setSelectedGroupSession(null);
      if (status === 'joined') setConfirmedSession(updated);
      await load();
    } catch (error) {
      await showError('No se pudo actualizar tu participación.', error);
    } finally {
      setParticipatingInId(null);
    }
  };

  const handleCreateRecording = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupRecordingForm.eventId || !groupRecordingForm.title.trim() || !groupRecordingForm.recordingUrl.trim()) {
      return;
    }

    setSubmittingGroupRecording(true);
    try {
      await createGroupSessionRecording({
        eventId: groupRecordingForm.eventId,
        title: groupRecordingForm.title.trim(),
        description: groupRecordingForm.description.trim() || null,
        recordingUrl: groupRecordingForm.recordingUrl.trim(),
        durationMinutes: groupRecordingForm.durationMinutes ? Number(groupRecordingForm.durationMinutes) : 0,
      });
      setGroupRecordingForm({
        eventId: '',
        title: '',
        recordingUrl: '',
        durationMinutes: '',
        description: '',
      });
      await load();
    } catch (error) {
      await showError('No se pudo publicar la grabación.', error);
    } finally {
      setSubmittingGroupRecording(false);
    }
  };

  const handleReactRecording = async (recording: GroupSessionRecordingRecord, reaction: GroupSessionReaction) => {
    try {
      await reactToGroupSessionRecording(recording.recordingId, reaction);
      await load();
    } catch (error) {
      await showError('No se pudo registrar la reacción.', error);
    }
  };

  const handleCommentRecording = async (recording: GroupSessionRecordingRecord) => {
    const text = recordingCommentDrafts[recording.recordingId]?.trim() || '';
    if (!text) return;
    try {
      await commentGroupSessionRecording(recording.recordingId, text);
      setRecordingCommentDrafts((prev) => ({ ...prev, [recording.recordingId]: '' }));
      await load();
    } catch (error) {
      await showError('No se pudo publicar el comentario.', error);
    }
  };

  const handleInviteByRoles = async (eventItem: GroupSessionEventRecord) => {
    try {
      await inviteGroupSessionByRoles(eventItem.eventId, ['lider']);
      await load();
    } catch (error) {
      await showError('No se pudieron enviar invitaciones por rol.', error);
    }
  };

  const handleDispatchReminder = async (windowType: '14h' | '30m') => {
    try {
      await dispatchGroupSessionReminders(windowType);
      await load();
    } catch (error) {
      await showError('No se pudo despachar el recordatorio.', error);
    }
  };

  const handleUpsertAvailabilitySlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!availabilitySlotForm.mentorUserId || !availabilitySlotForm.startsAt) return;
    try {
      const startsAt = toIso(availabilitySlotForm.startsAt);
      const endsAt = new Date(new Date(startsAt).getTime() + 90 * 60000).toISOString();
      await upsertMentorAvailabilitySlot({
        mentorUserId: availabilitySlotForm.mentorUserId,
        startsAt,
        endsAt,
      });
      setAvailabilitySlotForm((prev) => ({ ...prev, startsAt: nextSlotValue() }));
      await load();
    } catch (error) {
      await showError('No se pudo guardar la franja de disponibilidad.', error);
    }
  };

  const handleBulkAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!availabilityBulkForm.mentorUserId) return;
    try {
      await bulkCreateMentorAvailability({
        mentorUserId: availabilityBulkForm.mentorUserId,
        fromDate: availabilityBulkForm.fromDate,
        toDate: availabilityBulkForm.toDate,
        startHour: Number(availabilityBulkForm.startHour),
        weekdays: availabilityBulkForm.weekdays,
        numberOfSlots: Number(availabilityBulkForm.numberOfSlots),
      });
      await load();
    } catch (error) {
      await showError('No se pudo crear la disponibilidad masiva.', error);
    }
  };

  const handleDeleteAvailabilitySlot = async (mentorUserId: string, startsAt: string) => {
    try {
      await deleteAvailabilitySlot({ mentorUserId, startsAt });
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la franja.', error);
    }
  };

  const handleDispatchProgramReminder = async () => {
    try {
      await dispatchProgramMentorshipReminders();
      await load();
    } catch (error) {
      await showError('No se pudo disparar el recordatorio 1h de mentorías del programa.', error);
    }
  };

  const wizardHeader = (label: string, step: WizardStep) => (
    <div className="mb-4">
      <p className="app-section-kicker">{label}</p>
      <p className="mt-1 text-xs text-[var(--app-muted)]">Paso {step} de 3</p>
      <div className="mt-2 h-2 rounded-full bg-[var(--app-surface-muted)]">
        <div
          className="h-2 rounded-full bg-[var(--brand-primary)] transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  const sectionTabs = (
    <div className="inline-flex rounded-[16px] border border-[var(--app-border)] bg-white p-1">
      <Link
        href="/dashboard/mentorias/grupales"
        className={clsx(
          'rounded-[12px] px-4 py-2 text-sm font-semibold',
          activeSection === 'grupales'
            ? 'bg-[var(--brand-primary)] font-bold text-white'
            : 'text-[var(--app-muted)]',
        )}
      >
        Sesiones grupales
      </Link>
      <Link
        href="/dashboard/mentorias/programa"
        className={clsx(
          'rounded-[12px] px-4 py-2 text-sm font-semibold',
          activeSection === 'programa'
            ? 'bg-[var(--brand-primary)] font-bold text-white'
            : 'text-[var(--app-muted)]',
        )}
      >
        Mentorías del programa
      </Link>
      <Link
        href="/dashboard/mentorias/comprar"
        className={clsx(
          'rounded-[12px] px-4 py-2 text-sm font-semibold',
          activeSection === 'comprar'
            ? 'bg-[var(--brand-primary)] font-bold text-white'
            : 'text-[var(--app-muted)]',
        )}
      >
        Comprar sesiones
      </Link>
    </div>
  );

  const groupSection = (
    <div className="space-y-6">
      {currentRole === 'lider' && isOpenLeader && (
        <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-6 py-8 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-[0.9rem]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-surface-strong) 0%, color-mix(in srgb, var(--brand-accent) 18%, white) 100%)",
            }}
          >
            <span className="text-xl">👥</span>
          </div>
          <p className="mt-4 text-base font-extrabold text-[var(--app-ink)]">Sesiones grupales del programa</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--app-muted)]">
            Las sesiones grupales en vivo con tu cohorte están disponibles para líderes con suscripción activa.
          </p>
          <a
            href="https://www.4shine.co/planes-precios"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ background: "var(--brand-primary)", color: "var(--brand-on-dark)" }}
          >
            Activar programa · $3,000 USD
          </a>
        </div>
      )}
      {(currentRole === 'admin' || currentRole === 'gestor') && (
        <section className="app-panel p-5 sm:p-6">
          {wizardHeader(editingEventId ? 'Editar sesión grupal' : 'Nueva sesión grupal', groupWizardStep)}
          <form className="mt-4 grid gap-3" onSubmit={handleCreateGroupSession}>
            {groupWizardStep === 1 && (
              <>
                <input
                  className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  placeholder="Tema de la sesión"
                  value={groupSessionForm.title}
                  onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="px-1 text-xs font-semibold text-[var(--app-muted)]">Fecha y hora de inicio</label>
                    <input
                      className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                      type="datetime-local"
                      value={groupSessionForm.startsAt}
                      onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="px-1 text-xs font-semibold text-[var(--app-muted)]">Duración</label>
                    <select
                      className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                      value={groupSessionForm.durationMinutes}
                      onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="90">1 hora 30 min</option>
                      <option value="120">2 horas</option>
                      <option value="180">3 horas</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            {groupWizardStep === 2 && (
              <>
                <select
                  className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  value={groupSessionForm.hostUserId}
                  onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, hostUserId: event.target.value }))}
                >
                  <option value="">Sin Adviser anfitrión</option>
                  {mentorCatalog.map((mentor) => (
                    <option key={mentor.mentorUserId} value={mentor.mentorUserId}>
                      {mentor.name}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  placeholder="Nombre de experto externo (opcional)"
                  value={groupSessionForm.externalExpertName}
                  onChange={(event) =>
                    setGroupSessionForm((prev) => ({ ...prev, externalExpertName: event.target.value }))
                  }
                />
                {groupSessionForm.externalExpertName.trim() && (
                  <textarea
                    className="min-h-[80px] rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                    placeholder="Bio del experto externo"
                    value={groupSessionForm.externalExpertBio}
                    onChange={(event) =>
                      setGroupSessionForm((prev) => ({ ...prev, externalExpertBio: event.target.value }))
                    }
                  />
                )}
              </>
            )}
            {groupWizardStep === 3 && (
              <>
                {/* Banner image */}
                <div className="grid gap-2">
                  {groupSessionForm.bannerImageUrl ? (
                    <div className="relative">
                      <img src={groupSessionForm.bannerImageUrl} alt="Banner" className="h-32 w-full rounded-[16px] object-cover" />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
                        onClick={() => setGroupSessionForm((prev) => ({ ...prev, bannerImageUrl: '' }))}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <R2UploadButton
                      moduleCode="mentorias"
                      action="update"
                      pathPrefix="group-sessions/banners"
                      entityTable="app_mentoring.group_session_events"
                      fieldName="banner_image_url"
                      accept="image/*"
                      buttonLabel="Subir imagen de portada"
                      className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--app-border)] bg-white px-4 py-4 text-sm text-[var(--app-muted)]"
                      onUploaded={(url) => setGroupSessionForm((prev) => ({ ...prev, bannerImageUrl: url }))}
                    />
                  )}
                </div>
                {/* Description — rich text editor */}
                <RichTextEditor
                  value={groupSessionForm.description}
                  onChange={(html) => setGroupSessionForm((prev) => ({ ...prev, description: html }))}
                  placeholder="Descripción de la sesión. Usa la barra de herramientas para dar formato."
                  minHeight="120px"
                />
                <div className="flex items-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-[#2D8CFF]" aria-hidden="true">
                    <path d="M12.002 2a10 10 0 1 0 10 10 10.011 10.011 0 0 0-10-10Zm4.93 6.81-2 4a.999.999 0 0 1-.894.553H9.964a1 1 0 0 1 0-2h3.618l1.764-3.528a1 1 0 0 1 1.788.895ZM17 15.36a4.645 4.645 0 0 1-10 0V13a1 1 0 0 1 2 0v2.36a2.645 2.645 0 0 0 5.29 0V13a1 1 0 0 1 2 0v2.36Z" />
                  </svg>
                  <p className="text-xs text-[var(--app-muted)]">
                    {editingEventId
                      ? 'Los cambios se sincronizarán con Zoom automáticamente si modificas la hora.'
                      : 'La reunión de '}
                    {!editingEventId && <strong className="text-[var(--app-ink)]">Zoom se crea automáticamente</strong>}
                    {!editingEventId && ' — los participantes recibirán el enlace de acceso.'}
                  </p>
                </div>
                <button
                  type="submit"
                  className="rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  disabled={submittingGroupSession || !groupSessionForm.title.trim() || !groupSessionForm.startsAt}
                >
                  {submittingGroupSession
                    ? (editingEventId ? 'Guardando…' : 'Creando sesión…')
                    : (editingEventId ? 'Guardar cambios' : 'Crear sesión grupal')}
                </button>
                {editingEventId && (
                  <button
                    type="button"
                    className="rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-semibold text-[var(--app-muted)]"
                    onClick={() => { setEditingEventId(null); setGroupSessionForm({ title: '', startsAt: nextSlotValue(), durationMinutes: '60', hostUserId: '', externalExpertName: '', externalExpertBio: '', description: '', bannerImageUrl: '' }); setGroupWizardStep(1); }}
                  >
                    Cancelar edición
                  </button>
                )}
              </>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                disabled={groupWizardStep === 1}
                onClick={() => setGroupWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
              >
                Atrás
              </button>
              {groupWizardStep < 3 && (
                <button
                  type="button"
                  className="rounded-[12px] bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  disabled={groupWizardStep === 1 && (!groupSessionForm.title.trim() || !groupSessionForm.startsAt)}
                  onClick={() => setGroupWizardStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))}
                >
                  Siguiente
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {!isOpenLeader && (
      <>
      <section className="app-panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-section-kicker">Próxima sesión recomendada</p>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Un solo lugar para entrar a Zoom, confirmar participación y revisar quién lidera la sesión.
            </p>
          </div>
        </div>
        {upcomingGroupSession ? (
          <article className="mt-4 rounded-[16px] border border-[var(--app-border)] bg-white p-4">
            <p className="font-bold text-[var(--app-ink)]">{upcomingGroupSession.title}</p>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {formatDateTime(upcomingGroupSession.startsAt, tz)} ·{' '}
              {upcomingGroupSession.hostName ?? upcomingGroupSession.externalExpertName ?? 'Anfitrión por definir'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {upcomingGroupSession.zoomJoinUrl && !isGroupSessionPast(upcomingGroupSession) ? (
                <a
                  href={upcomingGroupSession.zoomJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]"
                >
                  Entrar a Zoom
                </a>
              ) : null}
              {(currentRole === 'lider' || currentRole === 'mentor') && (
                upcomingGroupSession.participationStatus === 'joined' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 size={12} />
                    Inscrito
                  </span>
                ) : (
                  <button
                    type="button"
                    className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)] disabled:opacity-50"
                    onClick={() => void handleParticipate(upcomingGroupSession, 'joined')}
                    disabled={(currentRole === 'lider' && isOpenLeader) || participatingInId === upcomingGroupSession.eventId}
                  >
                    {participatingInId === upcomingGroupSession.eventId ? 'Confirmando…' : 'Confirmar participación'}
                  </button>
                )
              )}
            </div>
          </article>
        ) : (
          <div className="mt-4">
            <EmptyState message="No hay sesiones grupales próximas por ahora." />
          </div>
        )}
      </section>

      <section className="app-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="app-section-kicker">Calendario mensual</p>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-[var(--app-border)] bg-white p-2" onClick={() => setSelectedMonthStart((prev) => monthStart(addDays(prev, -31)))} type="button"><ArrowLeft size={16} /></button>
            <p className="text-sm font-semibold capitalize">{monthLabel(selectedMonthStart)}</p>
            <button className="rounded-full border border-[var(--app-border)] bg-white p-2" onClick={() => setSelectedMonthStart((prev) => monthStart(addDays(prev, 31)))} type="button"><ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-[11px]">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-[var(--app-muted)]">{d}</div>
          ))}
          {monthDays.map((day) => {
            const isCurrentMonth = day.getMonth() === selectedMonthStart.getMonth();
            const dayEvents = groupSessions.filter((item) => {
              const date = new Date(item.startsAt);
              return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
            });
            return (
              <div key={day.toISOString()} className={clsx('min-h-[72px] rounded-[12px] border p-2', isCurrentMonth ? 'border-[var(--app-border)] bg-white' : 'border-transparent bg-transparent')}>
                <p className="font-semibold text-[var(--app-muted)]">{day.getDate()}</p>
                {dayEvents.slice(0, 2).map((item) => (
                  <button
                    key={item.eventId}
                    type="button"
                    className="mt-1 w-full truncate rounded bg-[var(--app-surface-muted)] px-1 py-0.5 text-left text-[10px] font-semibold text-[var(--app-ink)] hover:bg-[var(--brand-primary)]/10"
                    onClick={() => setSelectedGroupSession(item)}
                  >
                    {formatTime(item.startsAt, tz)} {item.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </section>
      </>
      )}

      {(currentRole === 'admin' || currentRole === 'gestor') && (
        <section className="app-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="app-section-kicker">Automatizaciones y analítica</p>
            <div className="flex gap-2">
              <button type="button" className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold" onClick={() => void handleDispatchReminder('14h')}>
                Enviar recordatorios 14h
              </button>
              <button type="button" className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold" onClick={() => void handleDispatchReminder('30m')}>
                Enviar recordatorios 30m
              </button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-[var(--app-border)] text-left text-[var(--app-muted)]">
                <tr>
                  <th className="py-2 pr-3">Sesión</th>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Interesados</th>
                  <th className="py-2 pr-3">Confirmados</th>
                  <th className="py-2 pr-3">Declinaron</th>
                </tr>
              </thead>
              <tbody>
                {groupAnalytics.map((row) => (
                  <tr key={row.eventId} className="border-b border-[var(--app-border)]">
                    <td className="py-2 pr-3 font-semibold text-[var(--app-ink)]">{row.title}</td>
                    <td className="py-2 pr-3 text-[var(--app-muted)]">{formatDateTime(row.startsAt, tz)}</td>
                    <td className="py-2 pr-3">{row.interestedCount}</td>
                    <td className="py-2 pr-3">{row.joinedCount}</td>
                    <td className="py-2 pr-3">{row.declinedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!isOpenLeader && (
      <section className="app-panel p-5 sm:p-6">
        <p className="app-section-kicker">Sesiones grupales próximas</p>
        <div className="mt-4 space-y-3">
          {groupSessions.length === 0 ? (
            <EmptyState message="No hay sesiones grupales registradas todavía." />
          ) : (
            groupSessions.slice(0, 12).map((eventItem) => (
              <article key={eventItem.eventId} className="rounded-[16px] border border-[var(--app-border)] bg-white/86 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--app-ink)]">{eventItem.title}</p>
                    <p className="text-sm text-[var(--app-muted)]">
                      {formatDateTime(eventItem.startsAt, tz)} · {eventItem.hostName ?? eventItem.externalExpertName ?? 'Anfitrión por definir'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eventItem.zoomJoinUrl ? (
                      isGroupSessionPast(eventItem) ? (
                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                          Finalizada
                        </span>
                      ) : (
                        <a href={eventItem.zoomJoinUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                          Enlace Zoom
                        </a>
                      )
                    ) : null}
                    {(currentRole === 'lider' || currentRole === 'mentor') && (
                      eventItem.participationStatus === 'joined' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 size={12} />
                          Inscrito
                        </span>
                      ) : (
                        <button type="button" className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)] disabled:opacity-50" onClick={() => void handleParticipate(eventItem, 'joined')} disabled={currentRole === 'lider' && isOpenLeader}>
                          Participar
                        </button>
                      )
                    )}
                    {(currentRole === 'admin' || currentRole === 'gestor') && (
                      <>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)]"
                          onClick={() => void handleInviteByRoles(eventItem)}
                        >
                          Invitar líderes
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--app-border)] bg-white p-1.5 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                          title="Editar sesión"
                          onClick={() => handleEditGroupSession(eventItem)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 bg-white p-1.5 text-rose-400 hover:text-rose-600"
                          title="Eliminar sesión"
                          onClick={() => void handleDeleteGroupSession(eventItem)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  Intención: {eventItem.intentCount} · Participación confirmada: {eventItem.participantCount}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
      )}

      {(currentRole === 'admin' || currentRole === 'gestor') && (
        <section className="app-panel p-5 sm:p-6">
          <p className="app-section-kicker">Publicar grabación</p>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateRecording}>
            <select
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2"
              value={groupRecordingForm.eventId}
              onChange={(event) => setGroupRecordingForm((prev) => ({ ...prev, eventId: event.target.value }))}
              required
            >
              <option value="">Selecciona sesión grupal</option>
              {groupSessions.map((item) => (
                <option key={item.eventId} value={item.eventId}>
                  {item.title} · {formatDateTime(item.startsAt, tz)}
                </option>
              ))}
            </select>
            <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" placeholder="Título de grabación" value={groupRecordingForm.title} onChange={(event) => setGroupRecordingForm((prev) => ({ ...prev, title: event.target.value }))} required />
            <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" placeholder="Duración (min)" value={groupRecordingForm.durationMinutes} onChange={(event) => setGroupRecordingForm((prev) => ({ ...prev, durationMinutes: event.target.value }))} />
            <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2" placeholder="URL de grabación" value={groupRecordingForm.recordingUrl} onChange={(event) => setGroupRecordingForm((prev) => ({ ...prev, recordingUrl: event.target.value }))} required />
            <textarea className="min-h-[90px] rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2" placeholder="Descripción" value={groupRecordingForm.description} onChange={(event) => setGroupRecordingForm((prev) => ({ ...prev, description: event.target.value }))} />
            <button type="submit" className="rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 md:col-span-2" disabled={submittingGroupRecording}>Publicar grabación</button>
          </form>
        </section>
      )}

      {!isOpenLeader && (
      <section className="app-panel p-5 sm:p-6">
        <p className="app-section-kicker">Grabaciones de sesiones pasadas</p>

        {groupRecordings.length > 0 && (() => {
          const uniqueTopics = Array.from(new Set(groupRecordings.map((r) => r.eventTitle))).sort();
          const q = recordingSearch.toLowerCase().trim();
          const filtered = groupRecordings.filter((r) => {
            const matchesTopic = !recordingTopicFilter || r.eventTitle === recordingTopicFilter;
            const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.eventTitle.toLowerCase().includes(q);
            return matchesTopic && matchesSearch;
          });

          return (
            <div className="mt-4 space-y-4">
              {/* Search + topic filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                  <input
                    className="w-full rounded-[14px] border border-[var(--app-border)] bg-white py-2.5 pl-9 pr-4 text-sm"
                    placeholder="Buscar grabación…"
                    value={recordingSearch}
                    onChange={(e) => setRecordingSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={clsx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', !recordingTopicFilter ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-[var(--app-border)] text-[var(--app-muted)]')}
                    onClick={() => setRecordingTopicFilter(null)}
                  >
                    Todos
                  </button>
                  {uniqueTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className={clsx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', recordingTopicFilter === topic ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-[var(--app-border)] text-[var(--app-muted)]')}
                      onClick={() => setRecordingTopicFilter((prev) => prev === topic ? null : topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards grid */}
              {filtered.length === 0 ? (
                <EmptyState message="Ninguna grabación coincide con tu búsqueda." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((recording) => (
                    <article key={recording.recordingId} className="flex flex-col overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-white">
                      {/* Cover */}
                      <a href={recording.recordingUrl} target="_blank" rel="noreferrer" className="group relative block aspect-video w-full overflow-hidden bg-[var(--app-surface-muted)]">
                        {recording.bannerImageUrl ? (
                          <img
                            src={recording.bannerImageUrl}
                            alt={recording.title}
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--brand-surface-strong) 0%, color-mix(in srgb, var(--brand-accent) 22%, white) 100%)",
                            }}
                          >
                            <Play size={32} className="text-[var(--brand-primary)]/60" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition group-hover:opacity-100">
                            <Play size={18} className="translate-x-0.5 text-[var(--brand-primary)]" />
                          </div>
                        </div>
                        {recording.durationMinutes > 0 && (
                          <span className="absolute bottom-2 right-2 rounded-[8px] bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {recording.durationMinutes} min
                          </span>
                        )}
                      </a>

                      {/* Body */}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div>
                          <p className="font-bold leading-snug text-[var(--app-ink)]">{recording.title}</p>
                          <p className="mt-0.5 text-sm text-[var(--app-muted)]">
                            {recording.eventTitle}
                            {recording.hostName ? ` · ${recording.hostName}` : ''}
                          </p>
                        </div>

                        {/* Reactions */}
                        <div className="flex flex-wrap gap-1.5">
                          {(['like', 'celebrate', 'insightful', 'love'] as GroupSessionReaction[]).map((reaction) => (
                            <button
                              key={reaction}
                              type="button"
                              className={clsx(
                                'rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                recording.myReaction === reaction
                                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]'
                                  : 'border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
                              )}
                              onClick={() => void handleReactRecording(recording, reaction)}
                            >
                              {reaction === 'like' ? (
                                <ThumbsUp size={12} className="inline-block" />
                              ) : reaction === 'celebrate' ? (
                                <PartyPopper size={12} className="inline-block" />
                              ) : reaction === 'insightful' ? (
                                <Lightbulb size={12} className="inline-block" />
                              ) : (
                                <Heart size={12} className="inline-block" />
                              )}{' '}
                              {recording.reactionTotals[reaction]}
                            </button>
                          ))}
                        </div>

                        {/* Comment input */}
                        <div className="mt-auto flex gap-2">
                          <input
                            className="flex-1 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs"
                            placeholder="Agregar comentario…"
                            value={recordingCommentDrafts[recording.recordingId] ?? ''}
                            onChange={(e) => setRecordingCommentDrafts((prev) => ({ ...prev, [recording.recordingId]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') void handleCommentRecording(recording); }}
                          />
                          <button
                            type="button"
                            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold"
                            onClick={() => void handleCommentRecording(recording)}
                          >
                            Enviar
                          </button>
                        </div>

                        {recording.comments.length > 0 && (
                          <div className="space-y-1.5">
                            {recording.comments.slice(0, 3).map((comment) => (
                              <p key={comment.commentId} className="rounded-[10px] bg-[var(--app-surface-muted)] px-3 py-2 text-xs text-[var(--app-muted)]">
                                <span className="font-semibold text-[var(--app-ink)]">{comment.authorName}:</span> {comment.commentText}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {groupRecordings.length === 0 && (
          <div className="mt-4">
            <EmptyState message="Aún no hay grabaciones publicadas." />
          </div>
        )}
      </section>
      )}

      {selectedGroupSession && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelectedGroupSession(null)}
        >
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-t-[2rem] bg-white sm:max-w-lg sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedGroupSession.bannerImageUrl ? (
              <div className="relative h-40 w-full overflow-hidden rounded-t-[2rem] sm:rounded-t-[2rem]">
                <img src={selectedGroupSession.bannerImageUrl} alt="Banner" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-[var(--app-ink)]">{selectedGroupSession.title}</p>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    {formatDateTime(selectedGroupSession.startsAt, tz)}
                    {' · '}
                    {selectedGroupSession.hostName ?? selectedGroupSession.externalExpertName ?? 'Anfitrión por definir'}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)]"
                  onClick={() => setSelectedGroupSession(null)}
                >
                  <X size={16} />
                </button>
              </div>

              {selectedGroupSession.externalExpertBio && (
                <p className="mt-3 text-sm text-[var(--app-muted)]">{selectedGroupSession.externalExpertBio}</p>
              )}

              {selectedGroupSession.description && (
                <div
                  className="prose prose-sm mt-4 max-w-none text-sm"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: selectedGroupSession.description }}
                />
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {selectedGroupSession.zoomJoinUrl && (
                  isGroupSessionPast(selectedGroupSession) ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--app-muted)]">
                      <Video size={14} />
                      Sesión finalizada
                    </span>
                  ) : (
                    <a
                      href={selectedGroupSession.zoomJoinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#2D8CFF] px-4 py-2 text-sm font-bold text-white"
                    >
                      <Video size={14} />
                      Entrar a Zoom
                    </a>
                  )
                )}
                {(currentRole === 'lider' || currentRole === 'mentor') && (
                  selectedGroupSession.participationStatus === 'joined' ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 size={14} />
                      Ya estás inscrito
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      disabled={(currentRole === 'lider' && isOpenLeader) || participatingInId === selectedGroupSession.eventId}
                      onClick={() => void handleParticipate(selectedGroupSession, 'joined')}
                    >
                      {participatingInId === selectedGroupSession.eventId ? 'Confirmando…' : 'Asistir'}
                    </button>
                  )
                )}
                {(currentRole === 'admin' || currentRole === 'gestor') && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-ink)]"
                      onClick={() => { handleEditGroupSession(selectedGroupSession); setSelectedGroupSession(null); }}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500"
                      onClick={() => { void handleDeleteGroupSession(selectedGroupSession); setSelectedGroupSession(null); }}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {cancellingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCancellingSession(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-[var(--app-surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)]"
              onClick={() => setCancellingSession(null)}
            >
              <X size={16} />
            </button>
            <div className="mb-6">
              <p className="text-lg font-extrabold text-[var(--app-ink)]">Cancelar mentoría</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">{cancellingSession.title}</p>
            </div>
            <form className="space-y-4" onSubmit={handleCancelSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-[var(--app-muted)]">
                  Motivo de cancelación *
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm"
                  placeholder="Explica brevemente el motivo de la cancelación..."
                  required
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-[var(--app-muted)]">
                  Proponer nuevo horario *
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm"
                  required
                  value={cancelForm.proposedStartsAt}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, proposedStartsAt: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-[14px] border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)]"
                  onClick={() => setCancellingSession(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!cancelForm.reason.trim() || !cancelForm.proposedStartsAt}
                  className="flex-1 rounded-[14px] bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  Confirmar cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmedProgramBooking && (() => {
        const booking = confirmedProgramBooking;
        const gcalStart = new Date(booking.startsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const gcalEnd = new Date(booking.endsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title)}&dates=${gcalStart}/${gcalEnd}${booking.meetingUrl ? `&location=${encodeURIComponent(booking.meetingUrl)}` : ''}`;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmedProgramBooking(null)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-[var(--app-surface)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)]"
                onClick={() => setConfirmedProgramBooking(null)}
              >
                <X size={16} />
              </button>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 size={36} className="text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[var(--app-ink)]">¡Mentoría agendada!</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--app-ink)]">{booking.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--app-muted)]">{booking.mentorName}</p>
                  <p className="mt-0.5 text-sm text-[var(--app-muted)]">{formatDateTime(booking.startsAt, tz)}</p>
                </div>
                <p className="text-sm text-[var(--app-muted)]">
                  Recibirás un correo de confirmación con los detalles y el enlace de acceso.
                </p>
                <div className="flex w-full flex-col gap-2">
                  {booking.meetingUrl ? (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D8CFF] px-6 py-2.5 text-sm font-bold text-white"
                    >
                      <Video size={14} />
                      Unirse a la sesión
                    </a>
                  ) : (
                    <p className="text-xs text-[var(--app-muted)]">El enlace de conexión estará disponible pronto.</p>
                  )}
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--app-border)] px-6 py-2.5 text-sm font-semibold text-[var(--app-ink)]"
                  >
                    <CalendarDays size={14} />
                    Agregar a Google Calendar
                  </a>
                </div>
                <button
                  type="button"
                  className="mt-1 rounded-full border border-[var(--app-border)] px-6 py-2 text-sm font-semibold text-[var(--app-muted)]"
                  onClick={() => setConfirmedProgramBooking(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmedSession(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-[var(--app-surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)]"
              onClick={() => setConfirmedSession(null)}
            >
              <X size={16} />
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[var(--app-ink)]">¡Participación confirmada!</p>
                <p className="mt-1 text-sm font-semibold text-[var(--app-muted)]">{confirmedSession.title}</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">{formatDateTime(confirmedSession.startsAt, tz)}</p>
              </div>
              <p className="text-sm text-[var(--app-muted)]">
                Recibirás un correo de confirmación con los detalles de la sesión.
              </p>
              {confirmedSession.zoomJoinUrl && (
                <a
                  href={confirmedSession.zoomJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2D8CFF] px-6 py-2.5 text-sm font-bold text-white"
                >
                  <Video size={14} />
                  Unirse a Zoom
                </a>
              )}
              <button
                type="button"
                className="mt-1 rounded-full border border-[var(--app-border)] px-6 py-2 text-sm font-semibold text-[var(--app-ink)]"
                onClick={() => setConfirmedSession(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Mentorías"
          subtitle="Estamos preparando la agenda, las mentorías incluidas y el catálogo de Advisers disponibles."
        />
        <div className="app-panel p-6 text-sm text-[var(--app-muted)]">Cargando mentorías...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <PageTitle title="Mentorías" subtitle="No fue posible cargar el módulo en este momento." />
        <EmptyState message="No pudimos preparar la experiencia de mentorías. Intenta recargar la vista." />
      </div>
    );
  }

  if (currentRole !== 'lider') {
    if (activeSection === 'grupales') {
      return (
        <div className="space-y-8">
        <PageTitle
          title="Mentorías"
          subtitle="Sesiones grupales: agenda, participación, grabaciones y colaboración por rol."
        />
          {sectionTabs}
          {groupSection}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <PageTitle
          title="Mentorías"
          subtitle="Gestiona sesiones, revisa la semana activa y mantén visibilidad sobre la operación del acompañamiento."
        />
        {sectionTabs}

        <StatGrid stats={opsStats} />

        {can('mentorias', 'create') && (
          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Asistente · Crear sesión operativa</p>
            </div>
            <p className="mt-1 text-xs text-[var(--app-muted)]">Paso {opsWizardStep} de 3</p>
            <form className="mt-5 grid gap-3 md:grid-cols-6" onSubmit={handleOpsCreate}>
              <input
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2"
                placeholder="Título"
                value={opsForm.title}
                onChange={(event) => setOpsForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                type="datetime-local"
                value={opsForm.startsAt}
                onChange={(event) => setOpsForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                required
              />
              <input
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                type="datetime-local"
                value={opsForm.endsAt}
                onChange={(event) => setOpsForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                required
              />
              <select
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                value={opsForm.sessionType}
                onChange={(event) =>
                  setOpsForm((prev) => ({ ...prev, sessionType: event.target.value as MentorshipSessionType }))
                }
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
              </select>
              <button
                className="rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                type="submit"
                disabled={submittingOps || opsWizardStep !== 3}
              >
                {opsWizardStep === 3 ? 'Crear sesión' : 'Completa el asistente para continuar'}
              </button>
              <input
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-6"
                placeholder="URL de reunión (opcional)"
                value={opsForm.meetingUrl}
                onChange={(event) => setOpsForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
              />
              <div className="md:col-span-6 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  disabled={opsWizardStep === 1}
                  onClick={() => setOpsWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  disabled={opsWizardStep === 3}
                  onClick={() => setOpsWizardStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))}
                >
                  Siguiente
                </button>
              </div>
            </form>
          </section>
        )}

        {(currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor') && (() => {
          const HOUR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
            const totalMinutes = 7 * 60 + i * 30;
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const hh = h.toString().padStart(2, '0');
            const mm = m === 0 ? '00' : '30';
            const period = h < 12 ? 'am' : 'pm';
            const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return { value: `${hh}:${mm}`, label: `${displayH}:${mm} ${period}` };
          });
          const WEEKDAYS = [
            { value: 1, label: 'Lun' },
            { value: 2, label: 'Mar' },
            { value: 3, label: 'Mié' },
            { value: 4, label: 'Jue' },
            { value: 5, label: 'Vie' },
            { value: 6, label: 'Sáb' },
            { value: 7, label: 'Dom' },
          ];
          const activeMentorId = availabilitySlotForm.mentorUserId;
          const activeMentorSlots = overview.mentorCatalog.find(m => m.mentorUserId === activeMentorId)?.availability ?? [];
          const slotDate = availabilitySlotForm.startsAt.split('T')[0] ?? '';
          const slotTime = availabilitySlotForm.startsAt.includes('T') ? availabilitySlotForm.startsAt.split('T')[1] : '09:00';
          return (
            <section className="app-panel p-5 sm:p-6">
              <p className="app-section-kicker mb-4">Agenda del Adviser</p>

              {currentRole !== 'mentor' && (
                <select
                  className="mb-5 w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  value={activeMentorId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAvailabilitySlotForm((prev) => ({ ...prev, mentorUserId: id }));
                    setAvailabilityBulkForm((prev) => ({ ...prev, mentorUserId: id }));
                  }}
                >
                  <option value="">Selecciona un Adviser</option>
                  {overview.mentorCatalog.map((mentor) => (
                    <option key={mentor.mentorUserId} value={mentor.mentorUserId}>
                      {mentor.name} · {mentor.specialty}
                    </option>
                  ))}
                </select>
              )}

              <div className="mb-5 flex gap-1 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
                {(['single', 'bulk'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={clsx(
                      'flex-1 rounded-[12px] py-2 text-sm font-semibold transition',
                      availabilityTab === tab
                        ? 'bg-white text-[var(--app-ink)] shadow-sm'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                    )}
                    onClick={() => setAvailabilityTab(tab)}
                  >
                    {tab === 'single' ? 'Franja única' : 'Carga semanal'}
                  </button>
                ))}
              </div>

              {availabilityTab === 'single' && (
                <form className="space-y-4" onSubmit={handleUpsertAvailabilitySlot}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Fecha</label>
                      <input
                        type="date"
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={slotDate}
                        onChange={(e) => setAvailabilitySlotForm((prev) => ({ ...prev, startsAt: `${e.target.value}T${slotTime}` }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Hora inicio</label>
                      <select
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={slotTime}
                        onChange={(e) => setAvailabilitySlotForm((prev) => ({ ...prev, startsAt: `${slotDate || new Date().toISOString().split('T')[0]}T${e.target.value}` }))}
                      >
                        {HOUR_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {slotDate && (
                    <p className="text-xs text-[var(--app-muted)]">
                      Franja de 90 min: {formatDateTime(toIso(availabilitySlotForm.startsAt), tz)} – {formatTime(new Date(new Date(toIso(availabilitySlotForm.startsAt)).getTime() + 90 * 60000).toISOString(), tz)}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="rounded-[14px] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    disabled={!activeMentorId || !slotDate}
                  >
                    Agregar franja
                  </button>
                </form>
              )}

              {availabilityTab === 'bulk' && (
                <form className="space-y-4" onSubmit={handleBulkAvailability}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Fecha inicio</label>
                      <input
                        type="date"
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={availabilityBulkForm.fromDate}
                        onChange={(e) => setAvailabilityBulkForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Fecha fin</label>
                      <input
                        type="date"
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={availabilityBulkForm.toDate}
                        onChange={(e) => setAvailabilityBulkForm((prev) => ({ ...prev, toDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Hora inicio</label>
                      <select
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={HOUR_OPTIONS.find(o => o.value.startsWith(availabilityBulkForm.startHour.padStart(2,'0')))?.value ?? '09:00'}
                        onChange={(e) => setAvailabilityBulkForm((prev) => ({ ...prev, startHour: String(parseInt(e.target.value, 10)) }))}
                      >
                        {HOUR_OPTIONS.filter(o => o.value.endsWith(':00')).map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--app-muted)]">Sesiones por día</label>
                      <select
                        className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                        value={availabilityBulkForm.numberOfSlots}
                        onChange={(e) => setAvailabilityBulkForm((prev) => ({ ...prev, numberOfSlots: e.target.value }))}
                      >
                        <option value="1">1 sesión</option>
                        <option value="2">2 sesiones consecutivas</option>
                        <option value="3">3 sesiones consecutivas</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[var(--app-muted)]">Días de la semana</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(({ value, label }) => {
                        const selected = availabilityBulkForm.weekdays.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            className={clsx(
                              'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                              selected
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                : 'border-[var(--app-border)] text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
                            )}
                            onClick={() =>
                              setAvailabilityBulkForm((prev) => ({
                                ...prev,
                                weekdays: selected
                                  ? prev.weekdays.filter((d) => d !== value)
                                  : [...prev.weekdays, value].sort((a, b) => a - b),
                              }))
                            }
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-[14px] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    disabled={!activeMentorId || !availabilityBulkForm.fromDate || !availabilityBulkForm.toDate || availabilityBulkForm.weekdays.length === 0}
                  >
                    Crear agenda semanal
                  </button>
                </form>
              )}

              {activeMentorId && activeMentorSlots.length > 0 && (
                <div className="mt-5 border-t border-[var(--app-border)] pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                    Próximos horarios ({activeMentorSlots.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeMentorSlots.map((slot) => (
                      <div
                        key={slot.startsAt}
                        className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-[var(--app-ink)]"
                      >
                        <span>{formatDateTime(slot.startsAt, tz)}</span>
                        <button
                          type="button"
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-rose-100 hover:text-rose-600 transition"
                          onClick={() => void handleDeleteAvailabilitySlot(activeMentorId, slot.startsAt)}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeMentorId && activeMentorSlots.length === 0 && (
                <p className="mt-4 text-sm text-[var(--app-muted)]">No hay horarios próximos registrados.</p>
              )}
            </section>
          );
        })()}

        {(currentRole === 'admin' || currentRole === 'gestor') && (
          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="app-section-kicker">Recordatorio programa (1h antes)</p>
              <button type="button" className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold" onClick={() => void handleDispatchProgramReminder()}>
                Disparar ahora
              </button>
            </div>
          </section>
        )}

        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Calendario semanal</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-[var(--app-border)] bg-white p-2 text-[var(--app-ink)]"
                type="button"
                onClick={() => setSelectedWeekStart((prev) => addDays(prev, -7))}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="rounded-full border border-[var(--app-border)] bg-white p-2 text-[var(--app-ink)]"
                type="button"
                onClick={() => setSelectedWeekStart(startOfWeek(new Date()))}
              >
                <CalendarDays size={16} />
              </button>
              <button
                className="rounded-full border border-[var(--app-border)] bg-white p-2 text-[var(--app-ink)]"
                type="button"
                onClick={() => setSelectedWeekStart((prev) => addDays(prev, 7))}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-7">
            {days.map((day) => {
              const dayItems = weekSessions.filter((session) => {
                const date = new Date(session.startsAt);
                return (
                  date.getFullYear() === day.getFullYear() &&
                  date.getMonth() === day.getMonth() &&
                  date.getDate() === day.getDate()
                );
              });

              return (
                <div key={day.toISOString()} className="rounded-[18px] border border-[var(--app-border)] bg-white/86 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    {formatWeekday(day)}
                  </p>
                  <div className="mt-3 space-y-2">
                    {dayItems.length === 0 ? (
                      <p className="text-xs text-[var(--app-muted)]">Sin sesiones</p>
                    ) : (
                      dayItems.map((session) => (
                        <div key={session.sessionId} className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
                          <p className="text-xs font-bold text-[var(--app-ink)]">{session.title}</p>
                          <p className="mt-1 text-[11px] text-[var(--app-muted)]">{formatTime(session.startsAt, tz)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-[var(--app-border)] bg-[rgba(248,250,252,0.82)] text-[var(--app-muted)]">
                <tr className="text-left">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Adviser</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overview.sessions.map((session) => (
                  <tr key={session.sessionId} className="border-t border-[var(--app-border)]">
                    <td className="px-4 py-3 font-semibold text-[var(--app-ink)]">{session.title}</td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">{sessionOriginLabel(session)}</td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">{session.mentorName}</td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">{formatDateTime(session.startsAt, tz)}</td>
                    <td className="px-4 py-3">
                      {can('mentorias', 'update') ? (
                        <select
                          className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-xs"
                          value={session.status}
                          onChange={(event) =>
                            void handleStatusChange(session, event.target.value as MentorshipStatus)
                          }
                        >
                          <option value="scheduled">scheduled</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="pending_rating">pending_rating</option>
                          <option value="pending_approval">pending_approval</option>
                          <option value="no_show">no_show</option>
                        </select>
                      ) : (
                        <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', SESSION_STATUS_META[session.status].tone)}>
                          {SESSION_STATUS_META[session.status].label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {can('mentorias', 'delete') && (
                        <button
                          className="rounded-[12px] border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600"
                          type="button"
                          onClick={() => void handleDeleteSession(session)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  if (activeSection === 'grupales') {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Mentorías"
          subtitle="Sesiones grupales para líderes con suscripción: participa en vivo y consulta grabaciones."
        />
        {sectionTabs}
        {groupSection}
      </div>
    );
  }

  if (activeSection === 'comprar') {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Mentorías"
          subtitle="Reserva sesiones individuales con nuestros Advisers especializados."
        />
        {sectionTabs}

        {overview.additionalOrders.length > 0 && (
          <section className="app-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Mis sesiones adicionales</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.additionalOrders.map((order: AdditionalMentorshipOrderRecord) => (
                <article key={order.orderId} className="rounded-[18px] border border-[var(--app-border)] bg-white/84 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[var(--app-ink)]">{order.title}</p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        {order.mentorName} · {formatDateTime(order.scheduledStartsAt, tz)}
                      </p>
                      {order.topic && <p className="mt-1 text-xs text-[var(--app-muted)]">{order.topic}</p>}
                    </div>
                    <span className={clsx('shrink-0 rounded-full px-3 py-1 text-xs font-bold', ORDER_STATUS_META[order.status].tone)}>
                      {ORDER_STATUS_META[order.status].label}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {overview.mentorCatalog.length === 0 ? (
          <section className="app-panel p-5 sm:p-6">
            <EmptyState message="Aún no hay Advisers disponibles para reserva. Pronto encontrarás aquí los especialistas del programa." />
          </section>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {overview.mentorCatalog.map((mentor) => {
              const isActive = activeAdviserId === mentor.mentorUserId;
              const primaryOffer = mentor.offers[0];

              return (
                <article key={mentor.mentorUserId} className="app-panel flex flex-col p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-chip)] text-xl font-black text-[var(--brand-primary)]">
                      {mentor.avatarUrl ? (
                        <img src={mentor.avatarUrl} alt={mentor.name} className="h-full w-full object-cover" />
                      ) : (
                        mentor.avatarInitial
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-[var(--app-ink)]">{mentor.name}</p>
                      <p className="mt-0.5 text-sm text-[var(--app-muted)]">{mentor.specialty}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--app-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Star size={11} className="text-[var(--brand-accent,#f6b74c)]" />
                          {mentor.ratingAvg.toFixed(1)}
                          {mentor.ratingCount > 0 && <span>({mentor.ratingCount})</span>}
                        </span>
                        <span>·</span>
                        <span className="uppercase tracking-[0.12em]">{mentor.sector}</span>
                      </div>
                    </div>
                  </div>

                  {primaryOffer && (
                    <div className="mt-4 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--app-ink)]">{primaryOffer.title}</p>
                      {primaryOffer.description && (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{primaryOffer.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                          {primaryOffer.durationMinutes} min
                        </span>
                        <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                          {formatCurrency(primaryOffer.priceAmount, primaryOffer.currencyCode)}
                        </span>
                      </div>
                    </div>
                  )}

                  {mentor.availability.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">Próximos espacios</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.availability.slice(0, 3).map((slot) => (
                          <button
                            key={slot.startsAt}
                            type="button"
                            className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                            onClick={() => {
                              setAdditionalForm((prev) => ({
                                ...prev,
                                offerId: primaryOffer?.offerId ?? prev.offerId,
                                startsAt: toDatetimeLocalInput(slot.startsAt),
                              }));
                              setActiveAdviserId(mentor.mentorUserId);
                            }}
                          >
                            {formatDateTime(slot.startsAt, tz)}
                          </button>
                        ))}
                        {mentor.availability.length > 3 && (
                          <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)]">
                            +{mentor.availability.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {mentor.availability.length === 0 && (
                    <p className="mt-4 text-xs text-[var(--app-muted)]">Disponibilidad por coordinar directamente.</p>
                  )}

                  <div className="mt-auto pt-5">
                    {!isActive ? (
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        type="button"
                        disabled={!primaryOffer}
                        onClick={() => {
                          if (!primaryOffer) return;
                          setAdditionalForm((prev) => ({ ...prev, offerId: primaryOffer.offerId }));
                          setActiveAdviserId(mentor.mentorUserId);
                        }}
                      >
                        <ShoppingBag size={15} />
                        Reservar sesión
                      </button>
                    ) : (
                      <form className="space-y-3 border-t border-[var(--app-border)] pt-4" onSubmit={handleAdditionalPurchase}>
                        {mentor.offers.length > 1 && (
                          <select
                            className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                            value={additionalForm.offerId}
                            onChange={(e) => setAdditionalForm((prev) => ({ ...prev, offerId: e.target.value }))}
                            required
                          >
                            <option value="">Selecciona una oferta</option>
                            {mentor.offers.map((offer) => (
                              <option key={offer.offerId} value={offer.offerId}>
                                {offer.title} · {offer.durationMinutes} min · {formatCurrency(offer.priceAmount, offer.currencyCode)}
                              </option>
                            ))}
                          </select>
                        )}
                        {mentor.availability.length === 0 ? (
                          <p className="rounded-[14px] border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)]">
                            Este adviser no tiene horarios disponibles en este momento.
                          </p>
                        ) : (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">Horarios disponibles</p>
                            <div className="flex flex-wrap gap-2">
                              {mentor.availability.map((slot) => {
                                const val = toDatetimeLocalInput(slot.startsAt);
                                return (
                                  <button
                                    key={slot.startsAt}
                                    type="button"
                                    className={clsx(
                                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                      additionalForm.startsAt === val
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                        : 'border-[var(--app-border)] text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
                                    )}
                                    onClick={() => setAdditionalForm((prev) => ({ ...prev, startsAt: val }))}
                                  >
                                    {formatDateTime(slot.startsAt, tz)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <input
                          className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                          placeholder="Tema o reto que quieres trabajar"
                          value={additionalForm.topic}
                          onChange={(e) => setAdditionalForm((prev) => ({ ...prev, topic: e.target.value }))}
                        />
                        <textarea
                          className="min-h-[80px] w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                          placeholder="Notas adicionales para orientar la sesión."
                          value={additionalForm.note}
                          onChange={(e) => setAdditionalForm((prev) => ({ ...prev, note: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-[12px] border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)]"
                            onClick={() => {
                              setActiveAdviserId(null);
                              setAdditionalForm((prev) => ({ ...prev, offerId: '' }));
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 rounded-[12px] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                            disabled={submittingAdditional || !additionalForm.offerId}
                          >
                            {submittingAdditional ? 'Procesando…' : 'Confirmar reserva'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="Mentorías"
        subtitle={
          isOpenLeader
            ? 'Puedes comprar sesiones adicionales con Advisers disponibles. Las mentorías incluidas se activan cuando compras el programa 4Shine.'
            : 'Agenda las sesiones incluidas del programa, compra sesiones adicionales con Advisers disponibles y visualiza tu semana completa de acompañamiento.'
        }
      />
      {sectionTabs}

      {isOpenLeader && (
        <div
          className="flex items-start gap-4 rounded-[1.3rem] px-5 py-4"
          style={{
            background: "var(--brand-surface-strong)",
            border: "1px solid color-mix(in srgb, var(--brand-primary) 12%, transparent)",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-surface-strong) 0%, color-mix(in srgb, var(--brand-accent) 22%, white) 100%)",
            }}
          >
            <Lightbulb size={20} className="text-[var(--brand-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-[var(--brand-primary)]">Sesiones adicionales disponibles para tu cuenta</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--app-muted)]">
              Puedes reservar sesiones adicionales con los Advisers disponibles. Las mentorías incluidas del journey se activan con el programa 4Shine.
            </p>
          </div>
          <a
            href="https://www.4shine.co/planes-precios"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-90"
            style={{ background: "var(--brand-primary)", color: "var(--brand-on-dark)" }}
          >
            Ver programa
          </a>
        </div>
      )}

      {nextSessions.length > 0 && (
        <section className="app-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-[var(--brand-primary)]" />
            <p className="app-section-kicker">Próximas sesiones</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nextSessions.map((session) => (
              <article
                key={session.sessionId}
                className="rounded-[18px] border border-[var(--app-border)] bg-white/84 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[var(--app-ink)]">{session.title}</p>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      {session.mentorName} · {formatDateTime(session.startsAt, tz)}
                    </p>
                  </div>
                  <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', SESSION_STATUS_META[session.status].tone)}>
                    {SESSION_STATUS_META[session.status].label}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <StatGrid stats={leaderStats} />

      <section className="app-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Mentorías del programa</p>
        </div>

        {overview.programEntitlements.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              message={
                isOpenLeader
                  ? 'Esta cuenta no tiene mentorías incluidas activas. Puedes activar el programa 4Shine para desbloquearlas.'
                  : 'No encontramos derechos de mentoría configurados para este líder todavía.'
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {overview.programEntitlements.map((item, idx) => {
              const isFormOpen = programForm.entitlementId === item.entitlementId;
              const isCompleted = item.status === 'completed';
              const isScheduled = item.status === 'scheduled';
              const isLocked = item.status === 'locked';

              if (isCompleted) {
                return (
                  <div key={item.entitlementId} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-emerald-800">{item.title}</p>
                      {item.mentorName && item.scheduledStartsAt && (
                        <p className="truncate text-xs text-emerald-700">
                          {item.mentorName} · {formatDateTime(item.scheduledStartsAt, tz)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                      Completada
                    </span>
                  </div>
                );
              }

              if (isScheduled) {
                return (
                  <div key={item.entitlementId} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50/70 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-amber-900">{item.title}</p>
                      {item.mentorName && item.scheduledStartsAt && (
                        <p className="truncate text-xs text-amber-700">
                          {item.mentorName} · {formatDateTime(item.scheduledStartsAt, tz)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                      Programada
                    </span>
                    {item.scheduledEndsAt && isGroupSessionPast({ endsAt: item.scheduledEndsAt }) ? (
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('mentorias-grabaciones')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        <Play size={12} /> Ver grabación
                      </button>
                    ) : item.scheduledMeetingUrl ? (
                      <a
                        href={item.scheduledMeetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2D8CFF] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        <Video size={12} /> Unirse
                      </a>
                    ) : null}
                  </div>
                );
              }

              if (isLocked) {
                return (
                  <div key={item.entitlementId} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 opacity-70">
                    <Lock size={14} className="shrink-0 text-[var(--app-muted)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--app-ink)]">{item.title}</p>
                      <p className="truncate text-xs text-[var(--app-muted)]">
                        {item.scheduleBlockedReason ?? 'Se habilita 10 días después de la mentoría anterior.'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                      Bloqueada
                    </span>
                  </div>
                );
              }

              return (
                <div key={item.entitlementId} className="rounded-[14px] border border-[var(--brand-primary)]/25 bg-white">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--app-ink)]">{item.title}</p>
                      <p className="truncate text-xs text-[var(--app-muted)]">
                        {phaseLabel(item.phaseCode)} · {item.defaultDurationMinutes} min
                      </p>
                    </div>
                    <span className={clsx('shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em]', PROGRAM_STATUS_META[item.status].tone)}>
                      {PROGRAM_STATUS_META[item.status].label}
                    </span>
                    {!isFormOpen && (
                      <button
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                        type="button"
                        onClick={() => setProgramForm((prev) => ({ ...prev, entitlementId: item.entitlementId }))}
                      >
                        Programar <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                  {isFormOpen && (
                    <form className="space-y-3 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4" onSubmit={handleProgramSchedule}>
                      {overview.mentorCatalog.length === 0 && (
                        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Necesitamos activar al menos un Adviser para poder reservar esta mentoría.
                        </div>
                      )}
                      <select
                        className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                        value={programForm.mentorUserId}
                        onChange={(e) => setProgramForm((prev) => ({ ...prev, mentorUserId: e.target.value, startsAt: '' }))}
                        required
                      >
                        <option value="">Selecciona un Adviser</option>
                        {overview.mentorCatalog.map((mentor) => (
                          <option key={mentor.mentorUserId} value={mentor.mentorUserId}>
                            {mentor.name} · {mentor.specialty}
                          </option>
                        ))}
                      </select>
                      {programForm.mentorUserId && (() => {
                        const selectedAdviser = overview.mentorCatalog.find(m => m.mentorUserId === programForm.mentorUserId);
                        if (selectedAdviser) {
                          return (
                            <div className="flex items-center gap-3 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-chip)] text-base font-black text-[var(--brand-primary)]">
                                {selectedAdviser.avatarUrl ? (
                                  <img src={selectedAdviser.avatarUrl} alt={selectedAdviser.name} className="h-full w-full object-cover" />
                                ) : (
                                  selectedAdviser.avatarInitial
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--app-ink)]">{selectedAdviser.name}</p>
                                <p className="text-xs text-[var(--app-muted)]">{selectedAdviser.specialty}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {programForm.mentorUserId && (() => {
                        const slots = overview.mentorCatalog.find(m => m.mentorUserId === programForm.mentorUserId)?.availability ?? [];
                        return slots.length === 0 ? (
                          <p className="rounded-[14px] border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)]">
                            Este adviser no tiene horarios disponibles en este momento.
                          </p>
                        ) : (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">Horarios disponibles</p>
                            <div className="flex flex-wrap gap-2">
                              {slots.map((slot) => {
                                const val = toDatetimeLocalInput(slot.startsAt);
                                return (
                                  <button
                                    key={slot.startsAt}
                                    type="button"
                                    className={clsx(
                                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                      programForm.startsAt === val
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                        : 'border-[var(--app-border)] text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
                                    )}
                                    onClick={() => setProgramForm((prev) => ({ ...prev, startsAt: val }))}
                                  >
                                    {formatDateTime(slot.startsAt, tz)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                      <textarea
                        className="min-h-[100px] w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                        placeholder="Contexto o foco que quieres trabajar en esta sesión."
                        value={programForm.note}
                        onChange={(e) => setProgramForm((prev) => ({ ...prev, note: e.target.value }))}
                      />
                      <div className="flex gap-3">
                        <button
                          className="rounded-[14px] border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)]"
                          type="button"
                          onClick={() => setProgramForm((prev) => ({ ...prev, entitlementId: '' }))}
                        >
                          Cancelar
                        </button>
                        <button
                          className="flex-1 rounded-[14px] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                          type="submit"
                          disabled={submittingProgram || !programForm.mentorUserId || !programForm.startsAt || overview.mentorCatalog.length === 0}
                        >
                          {submittingProgram ? 'Guardando…' : 'Confirmar mentoría'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="mentorias-grabaciones" className="app-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Video size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Grabaciones de mentorías</p>
        </div>
        {(() => {
          const recordings = overview.programEntitlements.filter(
            (item) => item.status === 'completed' && item.scheduledRecordingUrl,
          );
          return recordings.length === 0 ? (
            <div className="mt-5">
              <EmptyState message="Las grabaciones de tus mentorías aparecerán aquí automáticamente al finalizar cada sesión." />
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {recordings.map((item) => (
                <div key={item.entitlementId} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--app-ink)]">{item.title}</p>
                    <p className="truncate text-xs text-[var(--app-muted)]">
                      {item.mentorName ?? 'Adviser'}
                      {item.scheduledStartsAt ? ` · ${formatDateTime(item.scheduledStartsAt, tz)}` : ''}
                    </p>
                  </div>
                  <a
                    href={item.scheduledRecordingUrl ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <Play size={12} /> Ver grabación
                  </a>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-4">
        <div>
          <p className="font-bold text-[var(--app-ink)]">¿Necesitas más acompañamiento?</p>
          <p className="mt-0.5 text-sm text-[var(--app-muted)]">
            Explora los Advisers disponibles y reserva sesiones individuales adicionales.
          </p>
        </div>
        <Link
          href="/dashboard/mentorias/comprar"
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
        >
          <ShoppingBag size={14} />
          Comprar sesiones
        </Link>
      </div>

      <section className="app-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Sesiones programadas</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.sessions.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState message="Todavía no hay sesiones en agenda para este líder." />
            </div>
          ) : (
            overview.sessions.map((session) => (
              <article
                key={session.sessionId}
                className="rounded-[20px] border border-[var(--app-border)] bg-white/86 px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[var(--app-ink)]">{session.title}</p>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      {session.mentorName} · {formatDateTime(session.startsAt, tz)}
                    </p>
                  </div>
                  <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', SESSION_STATUS_META[session.status].tone)}>
                    {SESSION_STATUS_META[session.status].label}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                    {sessionOriginLabel(session)}
                  </span>
                  {session.meetingUrl ? (
                    <a
                      className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]"
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Entrar a reunión
                    </a>
                  ) : (
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                      Link pendiente
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default function MentoriasPage() {
  return <MentoriasView />;
}
