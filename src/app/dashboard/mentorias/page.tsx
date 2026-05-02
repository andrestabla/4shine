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
  ShoppingBag,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  bulkCreateMentorAvailability,
  createAdditionalMentorshipOrder,
  createGroupSession,
  createGroupSessionRecording,
  createMentorship,
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
  endsAt: string;
  zoomJoinUrl: string;
  zoomHostUrl: string;
  hostUserId: string;
  externalExpertName: string;
  externalExpertBio: string;
  description: string;
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
  endsAt: string;
}

interface AvailabilityBulkFormState {
  mentorUserId: string;
  fromDate: string;
  toDate: string;
  startHour: string;
  weekdays: string;
  numberOfSlots: string;
}

type MentoriaSection = 'grupales' | 'programa';
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

function formatDateTime(value: string | null): string {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
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
  const [groupSessionForm, setGroupSessionForm] = React.useState<GroupSessionFormState>({
    title: '',
    startsAt: nextSlotValue(),
    endsAt: nextSlotValue(),
    zoomJoinUrl: '',
    zoomHostUrl: '',
    hostUserId: '',
    externalExpertName: '',
    externalExpertBio: '',
    description: '',
  });
  const [groupRecordingForm, setGroupRecordingForm] = React.useState<GroupRecordingFormState>({
    eventId: '',
    title: '',
    recordingUrl: '',
    durationMinutes: '',
    description: '',
  });
  const [recordingCommentDrafts, setRecordingCommentDrafts] = React.useState<Record<string, string>>({});
  const [groupAnalytics, setGroupAnalytics] = React.useState<GroupSessionAnalyticsRecord[]>([]);
  const [availabilitySlotForm, setAvailabilitySlotForm] = React.useState<AvailabilitySlotFormState>({
    mentorUserId: '',
    startsAt: nextSlotValue(),
    endsAt: nextSlotValue(),
  });
  const [availabilityBulkForm, setAvailabilityBulkForm] = React.useState<AvailabilityBulkFormState>({
    mentorUserId: '',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    startHour: '8',
    weekdays: '1,2,3,4,5',
    numberOfSlots: '3',
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
      const firstMentor = overview.mentorCatalog[0];
      setAvailabilitySlotForm((prev) => ({
        ...prev,
        mentorUserId: prev.mentorUserId || firstMentor?.mentorUserId || '',
      }));
      setAvailabilityBulkForm((prev) => ({
        ...prev,
        mentorUserId: prev.mentorUserId || firstMentor?.mentorUserId || '',
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
      await scheduleProgramMentorship({
        entitlementId: programForm.entitlementId,
        mentorUserId: programForm.mentorUserId,
        startsAt: toIso(programForm.startsAt),
        note: programForm.note.trim() || null,
      });
      setProgramForm((prev) => ({
        ...prev,
        startsAt: nextSlotValue(),
        note: '',
      }));
      await Promise.all([load(), refreshBootstrap()]);
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
    try {
      await updateMentorship(session.sessionId, {
        status,
        changeReason:
          status === 'cancelled'
            ? 'Cambio de agenda y reprogramación operativa.'
            : undefined,
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo actualizar el estado de la sesión.', error);
    }
  };

  const handleCreateGroupSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupSessionForm.title.trim() || !groupSessionForm.startsAt || !groupSessionForm.endsAt) return;

    setSubmittingGroupSession(true);
    try {
      await createGroupSession({
        title: groupSessionForm.title.trim(),
        description: groupSessionForm.description.trim() || null,
        startsAt: toIso(groupSessionForm.startsAt),
        endsAt: toIso(groupSessionForm.endsAt),
        zoomJoinUrl: groupSessionForm.zoomJoinUrl.trim() || null,
        zoomHostUrl: groupSessionForm.zoomHostUrl.trim() || null,
        hostUserId: groupSessionForm.hostUserId || null,
        externalExpertName: groupSessionForm.externalExpertName.trim() || null,
        externalExpertBio: groupSessionForm.externalExpertBio.trim() || null,
      });
      setGroupSessionForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        zoomJoinUrl: '',
        zoomHostUrl: '',
        externalExpertName: '',
        externalExpertBio: '',
      }));
      await load();
    } catch (error) {
      await showError('No se pudo crear la sesión grupal.', error);
    } finally {
      setSubmittingGroupSession(false);
    }
  };

  const handleParticipate = async (eventItem: GroupSessionEventRecord, status: GroupSessionParticipationStatus) => {
    try {
      await participateInGroupSession(eventItem.eventId, status);
      await load();
    } catch (error) {
      await showError('No se pudo actualizar tu participación.', error);
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
    if (!availabilitySlotForm.mentorUserId || !availabilitySlotForm.startsAt || !availabilitySlotForm.endsAt) return;
    try {
      await upsertMentorAvailabilitySlot({
        mentorUserId: availabilitySlotForm.mentorUserId,
        startsAt: toIso(availabilitySlotForm.startsAt),
        endsAt: toIso(availabilitySlotForm.endsAt),
      });
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
        weekdays: availabilityBulkForm.weekdays
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item) && item >= 1 && item <= 7),
        numberOfSlots: Number(availabilityBulkForm.numberOfSlots),
      });
      await load();
    } catch (error) {
      await showError('No se pudo crear la disponibilidad masiva.', error);
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
    </div>
  );

  const groupSection = (
    <div className="space-y-6">
      {currentRole === 'lider' && isOpenLeader && (
        <AccessOfferPanel
          badge="Líder sin suscripción"
          title="Activa el programa para acceder a sesiones grupales."
          description="Las sesiones grupales en vivo y sus recordatorios están disponibles para líderes con suscripción activa."
          products={mentorshipOffers}
          primaryAction={{ href: '/dashboard', label: 'Ver planes' }}
        />
      )}
      {(currentRole === 'admin' || currentRole === 'gestor') && (
        <section className="app-panel p-5 sm:p-6">
          {wizardHeader('Asistente · Crear sesión grupal', groupWizardStep)}
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateGroupSession}>
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2"
              placeholder="Título de la sesión grupal"
              value={groupSessionForm.title}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              type="datetime-local"
              value={groupSessionForm.startsAt}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              required
            />
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              type="datetime-local"
              value={groupSessionForm.endsAt}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              required
            />
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              placeholder="URL Zoom participantes"
              value={groupSessionForm.zoomJoinUrl}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, zoomJoinUrl: event.target.value }))}
            />
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              placeholder="URL Zoom anfitrión"
              value={groupSessionForm.zoomHostUrl}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, zoomHostUrl: event.target.value }))}
            />
            <select
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              value={groupSessionForm.hostUserId}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, hostUserId: event.target.value }))}
            >
              <option value="">Adviser anfitrión (opcional)</option>
              {mentorCatalog.map((mentor) => (
                <option key={mentor.mentorUserId} value={mentor.mentorUserId}>
                  {mentor.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
              placeholder="Experto externo (opcional)"
              value={groupSessionForm.externalExpertName}
              onChange={(event) =>
                setGroupSessionForm((prev) => ({ ...prev, externalExpertName: event.target.value }))
              }
            />
            <textarea
              className="min-h-[96px] rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm md:col-span-2"
              placeholder="Descripción de la sesión"
              value={groupSessionForm.description}
              onChange={(event) => setGroupSessionForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <button
              type="submit"
              className="rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 md:col-span-2"
              disabled={submittingGroupSession || groupWizardStep !== 3}
            >
              {groupWizardStep === 3 ? 'Crear evento grupal' : 'Completa el asistente para continuar'}
            </button>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                disabled={groupWizardStep === 1}
                onClick={() => setGroupWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
              >
                Atrás
              </button>
              <button
                type="button"
                className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                disabled={groupWizardStep === 3}
                onClick={() => setGroupWizardStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))}
              >
                Siguiente
              </button>
            </div>
          </form>
        </section>
      )}

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
              {formatDateTime(upcomingGroupSession.startsAt)} ·{' '}
              {upcomingGroupSession.hostName ?? upcomingGroupSession.externalExpertName ?? 'Anfitrión por definir'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {upcomingGroupSession.zoomJoinUrl ? (
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
                <button
                  type="button"
                  className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)] disabled:opacity-50"
                  onClick={() => void handleParticipate(upcomingGroupSession, 'joined')}
                  disabled={currentRole === 'lider' && isOpenLeader}
                >
                  Confirmar participación
                </button>
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
                  <p key={item.eventId} className="mt-1 truncate rounded bg-[var(--app-surface-muted)] px-1 py-0.5 text-[10px] font-semibold text-[var(--app-ink)]">
                    {formatTime(item.startsAt)} {item.title}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </section>

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
                    <td className="py-2 pr-3 text-[var(--app-muted)]">{formatDateTime(row.startsAt)}</td>
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
                      {formatDateTime(eventItem.startsAt)} · {eventItem.hostName ?? eventItem.externalExpertName ?? 'Anfitrión por definir'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eventItem.zoomJoinUrl ? (
                      <a href={eventItem.zoomJoinUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                        Enlace Zoom
                      </a>
                    ) : null}
                    {(currentRole === 'lider' || currentRole === 'mentor') && (
                      <button type="button" className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)] disabled:opacity-50" onClick={() => void handleParticipate(eventItem, 'joined')} disabled={currentRole === 'lider' && isOpenLeader}>
                        Participar
                      </button>
                    )}
                    {(currentRole === 'admin' || currentRole === 'gestor') && (
                      <button
                        type="button"
                        className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)]"
                        onClick={() => void handleInviteByRoles(eventItem)}
                      >
                        Invitar líderes
                      </button>
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
                  {item.title} · {formatDateTime(item.startsAt)}
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

      <section className="app-panel p-5 sm:p-6">
        <p className="app-section-kicker">Grabaciones de sesiones pasadas</p>
        <div className="mt-4 space-y-4">
          {groupRecordings.length === 0 ? (
            <EmptyState message="Aún no hay grabaciones publicadas." />
          ) : (
            groupRecordings.map((recording) => (
              <article key={recording.recordingId} className="rounded-[16px] border border-[var(--app-border)] bg-white p-4">
                <p className="font-bold text-[var(--app-ink)]">{recording.title}</p>
                <p className="text-sm text-[var(--app-muted)]">{recording.eventTitle} · {recording.hostName ?? 'Experto invitado'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={recording.recordingUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">Ver grabación</a>
                  {(['like', 'celebrate', 'insightful', 'love'] as GroupSessionReaction[]).map((reaction) => (
                    <button key={reaction} type="button" className={clsx('rounded-full border px-3 py-1 text-xs font-semibold', recording.myReaction === reaction ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-[var(--app-border)] text-[var(--app-muted)]')} onClick={() => void handleReactRecording(recording, reaction)}>
                      {reaction} · {recording.reactionTotals[reaction]}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input className="flex-1 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs" placeholder="Agregar comentario" value={recordingCommentDrafts[recording.recordingId] ?? ''} onChange={(event) => setRecordingCommentDrafts((prev) => ({ ...prev, [recording.recordingId]: event.target.value }))} />
                  <button type="button" className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold" onClick={() => void handleCommentRecording(recording)}>Comentar</button>
                </div>
                {recording.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {recording.comments.slice(0, 3).map((comment) => (
                      <p key={comment.commentId} className="rounded-[10px] bg-[var(--app-surface-muted)] px-3 py-2 text-xs text-[var(--app-muted)]">
                        <span className="font-semibold text-[var(--app-ink)]">{comment.authorName}:</span> {comment.commentText}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
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

        {(currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor') && (
          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Disponibilidad Adviser (90 min)</p>
            <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleUpsertAvailabilitySlot}>
              <select
                className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                value={availabilitySlotForm.mentorUserId}
                onChange={(event) => setAvailabilitySlotForm((prev) => ({ ...prev, mentorUserId: event.target.value }))}
                required
              >
                <option value="">Selecciona Adviser</option>
                {overview.mentorCatalog.map((mentor) => (
                  <option key={mentor.mentorUserId} value={mentor.mentorUserId}>{mentor.name}</option>
                ))}
              </select>
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" type="datetime-local" value={availabilitySlotForm.startsAt} onChange={(event) => setAvailabilitySlotForm((prev) => ({ ...prev, startsAt: event.target.value }))} required />
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" type="datetime-local" value={availabilitySlotForm.endsAt} onChange={(event) => setAvailabilitySlotForm((prev) => ({ ...prev, endsAt: event.target.value }))} required />
              <button className="rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white" type="submit">Guardar franja</button>
            </form>

            <form className="mt-4 grid gap-3 md:grid-cols-6" onSubmit={handleBulkAvailability}>
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" type="date" value={availabilityBulkForm.fromDate} onChange={(event) => setAvailabilityBulkForm((prev) => ({ ...prev, fromDate: event.target.value }))} />
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" type="date" value={availabilityBulkForm.toDate} onChange={(event) => setAvailabilityBulkForm((prev) => ({ ...prev, toDate: event.target.value }))} />
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" placeholder="Hora inicio (0-23)" value={availabilityBulkForm.startHour} onChange={(event) => setAvailabilityBulkForm((prev) => ({ ...prev, startHour: event.target.value }))} />
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" placeholder="Días 1-7 (ej 1,2,3,4,5)" value={availabilityBulkForm.weekdays} onChange={(event) => setAvailabilityBulkForm((prev) => ({ ...prev, weekdays: event.target.value }))} />
              <input className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm" placeholder="Slots por día" value={availabilityBulkForm.numberOfSlots} onChange={(event) => setAvailabilityBulkForm((prev) => ({ ...prev, numberOfSlots: event.target.value }))} />
              <button className="rounded-[16px] border border-[var(--app-border)] px-4 py-3 text-sm font-semibold text-[var(--app-ink)]" type="submit">Carga masiva</button>
            </form>
          </section>
        )}

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
                          <p className="mt-1 text-[11px] text-[var(--app-muted)]">{formatTime(session.startsAt)}</p>
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
                    <td className="px-4 py-3 text-[var(--app-muted)]">{formatDateTime(session.startsAt)}</td>
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
        <AccessOfferPanel
          badge="Líder sin suscripción"
          title="Activa mentorías del programa o compra sesiones puntuales."
          description="Tu cuenta puede reservar sesiones adicionales con los Advisers disponibles. Si quieres las mentorías incluidas del journey, necesitas activar el programa 4Shine."
          products={mentorshipOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver opciones del programa',
          }}
          note="Los packs adicionales te permiten coordinar sesiones puntuales. El programa suma además mentorías incluidas alineadas al journey y a la Trayectoria."
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="rounded-[28px] border border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(88,45,115,0.96),rgba(148,87,136,0.92),rgba(244,191,232,0.78))] px-6 py-6 text-white shadow-[0_30px_60px_rgba(63,35,84,0.18)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70">Acompañamiento ejecutivo</p>
          <h2
            className="mt-3 text-[2.2rem] font-semibold leading-[0.95] text-white md:text-[3rem]"
            data-display-font="true"
          >
            {leaderName}, tu ruta de mentorías vive aquí.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/84 md:text-base">
            {isOpenLeader
              ? 'Desde aquí puedes comprar sesiones adicionales con los Advisers disponibles. Cuando actives el programa 4Shine, también aparecerán tus mentorías incluidas del journey.'
              : 'Tienes sesiones incluidas por pertenecer al programa y también puedes activar espacios adicionales con los Advisers disponibles cuando necesites profundizar un reto puntual.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-white/88">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
              {isOpenLeader
                ? 'Programa requerido para incluidas'
                : `${overview.programEntitlements.filter((item) => item.canSchedule).length} incluidas por agendar`}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
              {overview.additionalOrders.filter((item) => item.status !== 'cancelled').length} adicionales registradas
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
              {nextSessions.length} próximas sesiones visibles
            </span>
          </div>
        </section>

        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[var(--brand-primary)]" />
            <p className="app-section-kicker">Próximas sesiones</p>
          </div>
          <div className="mt-5 space-y-3">
            {nextSessions.length === 0 ? (
              <EmptyState message="Aún no tienes mentorías próximas en agenda." />
            ) : (
              nextSessions.map((session) => (
                <article
                  key={session.sessionId}
                  className="rounded-[18px] border border-[var(--app-border)] bg-white/84 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[var(--app-ink)]">{session.title}</p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        {session.mentorName} · {formatDateTime(session.startsAt)}
                      </p>
                    </div>
                    <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', SESSION_STATUS_META[session.status].tone)}>
                      {SESSION_STATUS_META[session.status].label}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <StatGrid stats={leaderStats} />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-[var(--brand-primary)]" />
            <p className="app-section-kicker">Mentorías incluidas</p>
          </div>
          <div className="mt-5 grid gap-4">
            {overview.programEntitlements.length === 0 ? (
              <EmptyState
                message={
                  isOpenLeader
                    ? 'Esta cuenta no tiene mentorías incluidas activas. Puedes comprar sesiones adicionales o activar el programa 4Shine para desbloquearlas.'
                    : 'No encontramos derechos de mentoría configurados para este líder todavía.'
                }
              />
            ) : (
              overview.programEntitlements.map((item) => (
                <article
                  key={item.entitlementId}
                  className={clsx(
                    'rounded-[22px] border px-5 py-5',
                    item.status === 'completed' && 'border-emerald-200 bg-emerald-50/80',
                    item.status === 'scheduled' && 'border-amber-200 bg-amber-50/80',
                    item.status === 'available' && 'border-[var(--app-border)] bg-white/86',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                        Semana sugerida {item.suggestedWeek} · {phaseLabel(item.phaseCode)}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-[var(--app-ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em]',
                        PROGRAM_STATUS_META[item.status].tone,
                      )}
                    >
                      {PROGRAM_STATUS_META[item.status].label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.workbookCode && (
                      <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                        Vinculada a {item.workbookCode.toUpperCase()}
                      </span>
                    )}
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                      {item.defaultDurationMinutes} min
                    </span>
                  </div>

                  {(item.scheduledStartsAt || item.mentorName) && (
                    <div className="mt-4 rounded-[18px] border border-[var(--app-border)] bg-white/88 px-4 py-4 text-sm text-[var(--app-muted)]">
                      <p>
                        <span className="font-semibold text-[var(--app-ink)]">Adviser actual:</span>{' '}
                        {item.mentorName ?? 'Por asignar'}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-[var(--app-ink)]">Fecha:</span>{' '}
                        {formatDateTime(item.scheduledStartsAt)}
                      </p>
                    </div>
                  )}

                  {item.status !== 'completed' && (
                    <button
                      className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-primary)]"
                      type="button"
                      disabled={!item.canSchedule}
                      onClick={() =>
                        setProgramForm((prev) => ({
                          ...prev,
                          entitlementId: item.entitlementId,
                        }))
                      }
                    >
                      {item.status === 'scheduled' ? 'Reagendar incluida' : item.canSchedule ? 'Programar incluida' : 'Bloqueada por secuencia/semana'}
                      <ArrowRight size={16} />
                    </button>
                  )}
                  {!item.canSchedule && item.scheduleBlockedReason && (
                    <p className="mt-2 text-xs text-[var(--app-muted)]">{item.scheduleBlockedReason}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Asistente · Programar incluida</p>
            </div>
            {isOpenLeader && (
              <div className="mt-5 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                Las mentorías incluidas no están disponibles para esta cuenta todavía. Puedes activar el programa 4Shine o reservar sesiones adicionales en la sección de compra.
              </div>
            )}
            {overview.mentorCatalog.length === 0 && (
              <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Tus mentorías incluidas ya están cargadas. Para poder reservarlas necesitamos activar al menos un Adviser en la base de datos.
              </div>
            )}
            {!isOpenLeader && (
              <form className="mt-5 space-y-3" onSubmit={handleProgramSchedule}>
                <p className="text-xs text-[var(--app-muted)]">Paso {programWizardStep} de 3</p>
                <select
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  value={programForm.entitlementId}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, entitlementId: event.target.value }))}
                  required
                >
                  <option value="">Selecciona una mentoría incluida</option>
                  {overview.programEntitlements
                    .filter((item) => item.status !== 'completed' && item.canSchedule)
                    .map((item) => (
                      <option key={item.entitlementId} value={item.entitlementId}>
                        {item.title}
                      </option>
                    ))}
                </select>

                <select
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  value={programForm.mentorUserId}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, mentorUserId: event.target.value }))}
                  required
                >
                  <option value="">Selecciona un Adviser</option>
                  {overview.mentorCatalog.map((mentor) => (
                    <option key={mentor.mentorUserId} value={mentor.mentorUserId}>
                      {mentor.name} · {mentor.specialty}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  type="datetime-local"
                  value={programForm.startsAt}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                  required
                />

                <textarea
                  className="min-h-[120px] w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                  placeholder="Contexto para el Adviser o foco que quieres trabajar."
                  value={programForm.note}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, note: event.target.value }))}
                />

                {selectedEntitlement && (
                  <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                    <p className="font-semibold text-[var(--app-ink)]">{selectedEntitlement.title}</p>
                    <p className="mt-1">Duración sugerida: {selectedEntitlement.defaultDurationMinutes} minutos.</p>
                  </div>
                )}

                <button
                  className="w-full rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  type="submit"
                  disabled={
                    submittingProgram ||
                    programWizardStep !== 3 ||
                    !programForm.entitlementId ||
                    !programForm.mentorUserId ||
                    overview.mentorCatalog.length === 0
                  }
                >
                  {programWizardStep === 3 ? 'Programar mentoría incluida' : 'Completa el asistente para continuar'}
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={programWizardStep === 1}
                    onClick={() => setProgramWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={programWizardStep === 3}
                    onClick={() => setProgramWizardStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))}
                  >
                    Siguiente
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Semana activa</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--app-muted)]">
                {selectedWeekStart.toLocaleDateString('es-CO', { dateStyle: 'medium' })} -{' '}
                {addDays(selectedWeekStart, 6).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
              </p>
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

            <div className="mt-5 grid gap-3">
              {weekSessions.length === 0 ? (
                <EmptyState message="No tienes mentorías programadas en esta semana." />
              ) : (
                days.map((day) => {
                  const daySessions = weekSessions.filter((session) => {
                    const sessionDate = new Date(session.startsAt);
                    return (
                      sessionDate.getFullYear() === day.getFullYear() &&
                      sessionDate.getMonth() === day.getMonth() &&
                      sessionDate.getDate() === day.getDate()
                    );
                  });

                  return (
                    <div
                      key={day.toISOString()}
                      className="rounded-[18px] border border-[var(--app-border)] bg-white/86 px-4 py-4"
                    >
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                        {formatWeekday(day)}
                      </p>
                      <div className="mt-3 space-y-3">
                        {daySessions.length === 0 ? (
                          <p className="text-sm text-[var(--app-muted)]">Sin sesiones programadas.</p>
                        ) : (
                          daySessions.map((session) => (
                            <article
                              key={session.sessionId}
                              className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-[var(--app-ink)]">{session.title}</p>
                                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                                    {session.mentorName} · {formatTime(session.startsAt)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                                    {sessionOriginLabel(session)}
                                  </span>
                                  <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', SESSION_STATUS_META[session.status].tone)}>
                                    {SESSION_STATUS_META[session.status].label}
                                  </span>
                                </div>
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={16} className="text-[var(--brand-primary)]" />
            <p className="app-section-kicker">Advisers disponibles</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {overview.mentorCatalog.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState message="Aún no hay Advisers visibles para compra adicional." />
              </div>
            ) : (
              overview.mentorCatalog.map((mentor) => {
                const primaryOffer = mentor.offers[0];

                return (
                  <article
                    key={mentor.mentorUserId}
                    className="rounded-[22px] border border-[var(--app-border)] bg-white/86 px-5 py-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-chip)] text-sm font-black text-[var(--brand-primary)]">
                        {mentor.avatarInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-black text-[var(--app-ink)]">{mentor.name}</p>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-muted)]">
                            <Star size={12} className="text-[var(--brand-accent,#f6b74c)]" />
                            {mentor.ratingAvg.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--app-muted)]">{mentor.specialty}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--app-muted)]">{mentor.sector}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {mentor.availability.slice(0, 3).map((slot) => (
                        <button
                          key={slot.startsAt}
                          className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]"
                          type="button"
                          onClick={() =>
                            setAdditionalForm((prev) => ({
                              ...prev,
                              offerId: primaryOffer?.offerId ?? prev.offerId,
                              startsAt: toDatetimeLocalInput(slot.startsAt),
                            }))
                          }
                        >
                          {formatDateTime(slot.startsAt)}
                        </button>
                      ))}
                      {mentor.availability.length === 0 && (
                        <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                          Disponibilidad por coordinar
                        </span>
                      )}
                    </div>

                    {primaryOffer ? (
                      <div className="mt-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                        <p className="font-semibold text-[var(--app-ink)]">{primaryOffer.title}</p>
                        <p className="mt-1 text-sm text-[var(--app-muted)]">{primaryOffer.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--app-muted)]">
                          <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                            {primaryOffer.durationMinutes} min
                          </span>
                          <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                            {formatCurrency(primaryOffer.priceAmount, primaryOffer.currencyCode)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[18px] border border-dashed border-[var(--app-border)] px-4 py-4 text-sm text-[var(--app-muted)]">
                        Este Adviser aún no tiene una oferta activa cargada.
                      </div>
                    )}

                    <button
                      className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-primary)] disabled:opacity-50"
                      type="button"
                      disabled={!primaryOffer}
                      onClick={() =>
                        primaryOffer &&
                        setAdditionalForm((prev) => ({
                          ...prev,
                          offerId: primaryOffer.offerId,
                        }))
                      }
                    >
                      Comprar sesión adicional
                      <ShoppingBag size={16} />
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CircleDollarSign size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Asistente · Comprar sesión adicional</p>
            </div>
            {overview.mentorCatalog.length === 0 && (
              <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                La compra de sesiones adicionales quedará activa cuando existan Advisers disponibles en la plataforma.
              </div>
            )}
            <form className="mt-5 space-y-3" onSubmit={handleAdditionalPurchase}>
              <p className="text-xs text-[var(--app-muted)]">Paso {additionalWizardStep} de 3</p>
              <select
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                value={additionalForm.offerId}
                onChange={(event) => setAdditionalForm((prev) => ({ ...prev, offerId: event.target.value }))}
                required
              >
                <option value="">Selecciona una oferta</option>
                {overview.mentorCatalog.flatMap((mentor) =>
                  mentor.offers.map((offer) => (
                    <option key={offer.offerId} value={offer.offerId}>
                      {mentor.name} · {offer.title}
                    </option>
                  )),
                )}
              </select>

              <input
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                type="datetime-local"
                value={additionalForm.startsAt}
                onChange={(event) => setAdditionalForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                required
              />

              <input
                className="w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                placeholder="Tema o reto que quieres trabajar"
                value={additionalForm.topic}
                onChange={(event) => setAdditionalForm((prev) => ({ ...prev, topic: event.target.value }))}
              />

              <textarea
                className="min-h-[120px] w-full rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm"
                placeholder="Notas para orientar la compra y la sesión."
                value={additionalForm.note}
                onChange={(event) => setAdditionalForm((prev) => ({ ...prev, note: event.target.value }))}
              />

              {selectedOffer && (
                <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                  <p className="font-semibold text-[var(--app-ink)]">
                    {selectedOffer.mentor.name} · {selectedOffer.offer.title}
                  </p>
                  <p className="mt-1">
                    {selectedOffer.offer.durationMinutes} min ·{' '}
                    {formatCurrency(selectedOffer.offer.priceAmount, selectedOffer.offer.currencyCode)}
                  </p>
                </div>
              )}

              <button
                className="w-full rounded-[16px] bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                type="submit"
                disabled={
                  submittingAdditional ||
                  additionalWizardStep !== 3 ||
                  !additionalForm.offerId ||
                  overview.mentorCatalog.length === 0
                }
              >
                {additionalWizardStep === 3 ? 'Comprar y reservar sesión' : 'Completa el asistente para continuar'}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  disabled={additionalWizardStep === 1}
                  onClick={() =>
                    setAdditionalWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))
                  }
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  disabled={additionalWizardStep === 3}
                  onClick={() =>
                    setAdditionalWizardStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))
                  }
                >
                  Siguiente
                </button>
              </div>

              <p className="text-xs leading-relaxed text-[var(--app-muted)]">
                La compra adicional queda registrada en plataforma con estado comercial para seguimiento y puede conectarse luego a checkout real sin perder la trazabilidad.
              </p>
            </form>
          </section>

          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Sesiones adicionales</p>
            </div>
            <div className="mt-5 space-y-3">
              {overview.additionalOrders.length === 0 ? (
                <EmptyState message="Todavía no has comprado sesiones adicionales." />
              ) : (
                overview.additionalOrders.map((order: AdditionalMentorshipOrderRecord) => (
                  <article
                    key={order.orderId}
                    className="rounded-[18px] border border-[var(--app-border)] bg-white/86 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[var(--app-ink)]">{order.title}</p>
                        <p className="mt-1 text-sm text-[var(--app-muted)]">
                          {order.mentorName} · {formatDateTime(order.scheduledStartsAt)}
                        </p>
                        {order.topic && (
                          <p className="mt-1 text-sm text-[var(--app-muted)]">{order.topic}</p>
                        )}
                      </div>
                      <span className={clsx('rounded-full px-3 py-1 text-xs font-bold', ORDER_STATUS_META[order.status].tone)}>
                        {ORDER_STATUS_META[order.status].label}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--app-muted)]">
                      <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                        {formatCurrency(order.priceAmount, order.currencyCode)}
                      </span>
                      {order.offerTitle && (
                        <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                          {order.offerTitle}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
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
                      {session.mentorName} · {formatDateTime(session.startsAt)}
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
