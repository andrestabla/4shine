'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CalendarPlus,
    CheckCircle2,
    Compass,
    ExternalLink,
    Loader2,
    Megaphone,
    Network,
    PlayCircle,
    Sparkles,
    Users,
    X
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
    getLeader360,
    scheduleLeaderMentorship,
    listAdvisersForSelect,
    type Leader360Snapshot,
    type AdviserOption,
} from '@/features/lideres/client';

function formatDate(value: string | null) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return value;
    }
}

function formatDateTime(value: string | null) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return value;
    }
}

function pillarLabel(code: string | null) {
    if (!code) return '—';
    return code.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
}

function SectionCard({
    title,
    icon: Icon,
    description,
    children,
    cta
}: {
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    description?: string;
    children: React.ReactNode;
    cta?: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[var(--brand-accent)]/15 p-2 text-[var(--brand-primary)]">
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--app-ink)]">{title}</h3>
                        {description && (
                            <p className="mt-1 text-xs text-[var(--app-muted)]">{description}</p>
                        )}
                    </div>
                </div>
                {cta}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">{label}</p>
            <p className="mt-1 text-xl font-extrabold text-[var(--brand-primary)]">{value}</p>
            {hint && <p className="mt-1 text-xs text-[var(--app-muted)]">{hint}</p>}
        </div>
    );
}

export default function Leader360Page() {
    const params = useParams<{ userId: string }>();
    const userId = params?.userId ?? '';
    const { currentRole, can } = useUser();
    const { alert } = useAppDialog();
    const isElevated = currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor';
    const canSchedule = can('mentorias', 'create');

    const [snapshot, setSnapshot] = React.useState<Leader360Snapshot | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadSnapshot = React.useCallback(async () => {
        if (!userId) return;
        const data = await getLeader360(userId);
        setSnapshot(data);
    }, [userId]);

    React.useEffect(() => {
        if (!userId) return;
        let active = true;
        setLoading(true);
        setError(null);
        loadSnapshot()
            .catch((err) => {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil 360.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [userId, loadSnapshot]);

    // Agendar mentoría 1:1 con el líder, directo desde la vista 360.
    const [scheduleOpen, setScheduleOpen] = React.useState(false);
    const [scheduling, setScheduling] = React.useState(false);
    const [advisers, setAdvisers] = React.useState<AdviserOption[]>([]);
    const [scheduleForm, setScheduleForm] = React.useState({
        mode: 'program' as 'program' | 'manual',
        mentorUserId: '',
        date: '',
        time: '',
        duration: 60,
        title: '',
        meetingUrl: '',
    });

    const programNext = snapshot?.mentorship.programNext ?? null;
    const canConsumeProgram = Boolean(programNext?.schedulable);

    const openSchedule = () => {
        // Por defecto descuenta del programa si hay una mentoría incluida disponible.
        setScheduleForm((p) => ({ ...p, mode: canConsumeProgram ? 'program' : 'manual' }));
        setScheduleOpen(true);
        if (advisers.length === 0) {
            void listAdvisersForSelect()
                .then(setAdvisers)
                .catch(() => setAdvisers([]));
        }
    };

    const submitSchedule = async () => {
        if (!snapshot) return;
        if (!scheduleForm.mentorUserId) {
            await alert({ title: 'Falta el adviser', message: 'Selecciona quién dará la mentoría.', tone: 'warning' });
            return;
        }
        if (!scheduleForm.date || !scheduleForm.time) {
            await alert({ title: 'Faltan datos', message: 'Elige fecha y hora para la sesión.', tone: 'warning' });
            return;
        }
        const startsAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
        if (Number.isNaN(startsAt.getTime())) {
            await alert({ title: 'Fecha inválida', message: 'Revisa la fecha y hora.', tone: 'warning' });
            return;
        }
        setScheduling(true);
        try {
            await scheduleLeaderMentorship(userId, {
                mode: scheduleForm.mode,
                mentorUserId: scheduleForm.mentorUserId,
                startsAt: startsAt.toISOString(),
                durationMinutes: scheduleForm.duration,
                title: scheduleForm.title.trim() || `Mentoría 1:1 con ${snapshot.profile.displayName}`,
                meetingUrl: scheduleForm.meetingUrl.trim() || null,
                entitlementId: scheduleForm.mode === 'program' ? programNext?.entitlementId ?? null : null,
            });
            setScheduleOpen(false);
            setScheduleForm({ mode: 'program', mentorUserId: '', date: '', time: '', duration: 60, title: '', meetingUrl: '' });
            await loadSnapshot();
            await alert({
                title: 'Sesión agendada',
                message:
                    scheduleForm.mode === 'program'
                        ? 'La mentoría quedó agendada y se descontó del paquete incluido.'
                        : 'La mentoría 1:1 adicional quedó agendada con el líder.',
                tone: 'success',
            });
        } catch (err) {
            await alert({
                title: 'No se pudo agendar',
                message: err instanceof Error ? err.message : 'Inténtalo nuevamente.',
                tone: 'error',
            });
        } finally {
            setScheduling(false);
        }
    };

    if (!isElevated) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                Esta vista 360 está disponible para administradores, gestores y advisers.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="animate-spin text-[var(--brand-primary)]" size={28} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                {error}
            </div>
        );
    }

    if (!snapshot) return null;

    const {
        profile,
        workbooks,
        diagnostic,
        mentorship,
        content,
        networking,
        convocatorias,
        workshops
    } = snapshot;

    const workbookAvg =
        workbooks.length === 0
            ? 0
            : Math.round(
                  workbooks.reduce((sum, wb) => sum + wb.completionPercent, 0) / workbooks.length
              );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/dashboard/lideres"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
                >
                    <ArrowLeft size={14} /> Volver a líderes
                </Link>
            </div>

            <PageTitle
                title={profile.displayName}
                subtitle={`${profile.email}${profile.organizationName ? ` · ${profile.organizationName}` : ''}`}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Workbooks" value={`${workbookAvg}%`} hint={`${workbooks.length} asignados`} />
                <Stat
                    label="Diagnóstico"
                    value={`${Math.round(diagnostic.completionPercent)}%`}
                    hint={diagnostic.status ?? 'No iniciado'}
                />
                <Stat
                    label="Mentorías"
                    value={`${mentorship.attendedSessions}/${mentorship.totalSessions}`}
                    hint="Asistidas / total"
                />
                <Stat label="Contenido" value={`${content.totalCompleted}`} hint={`${content.totalSeen} vistos`} />
            </div>

            <SectionCard
                title="Workbooks 4Shine"
                icon={BookOpen}
                description="Progreso y acceso directo a cada workbook del líder."
            >
                {workbooks.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">El líder aún no tiene workbooks asignados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="app-table text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th>WB</th>
                                    <th>Título</th>
                                    <th>Pilar</th>
                                    <th>Progreso</th>
                                    <th>Estado</th>
                                    <th>Última actualización</th>
                                    <th aria-label="Acceso" />
                                </tr>
                            </thead>
                            <tbody>
                                {workbooks.map((wb) => (
                                    <tr key={wb.workbookId}>
                                        <td className="font-semibold text-[var(--brand-primary)]">{wb.templateCode}</td>
                                        <td>{wb.title}</td>
                                        <td className="text-[var(--app-muted)]">{pillarLabel(wb.pillarCode)}</td>
                                        <td>{Math.round(wb.completionPercent)}%</td>
                                        <td>
                                            {wb.isHidden ? (
                                                <span className="text-xs font-semibold text-amber-700">Oculto</span>
                                            ) : !wb.isEnabled ? (
                                                <span className="text-xs font-semibold text-rose-700">Deshabilitado</span>
                                            ) : (
                                                <span className="text-xs font-semibold text-emerald-700">Activo</span>
                                            )}
                                        </td>
                                        <td className="text-[var(--app-muted)]">{formatDate(wb.updatedAt)}</td>
                                        <td>
                                            <Link
                                                href={wb.deepLink}
                                                className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/20"
                                            >
                                                Abrir <ExternalLink size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Resultados diagnóstico"
                icon={Compass}
                description="Estado del diagnóstico 4Shine y puntajes por pilar."
                cta={
                    <Link
                        href={diagnostic.deepLink}
                        target={diagnostic.deepLink.startsWith("/descubrimiento/share/") ? "_blank" : undefined}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        {diagnostic.deepLink.startsWith("/descubrimiento/share/")
                            ? "Ver informe del líder"
                            : "Ir a Descubrimiento"}{" "}
                        <ExternalLink size={12} />
                    </Link>
                }
            >
                {!diagnostic.sessionId ? (
                    <p className="text-sm text-[var(--app-muted)]">El líder aún no ha iniciado su diagnóstico.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="font-semibold">Estado: </span>
                                {diagnostic.status}
                            </p>
                            <p>
                                <span className="font-semibold">Completado: </span>
                                {formatDateTime(diagnostic.completedAt)}
                            </p>
                            <p>
                                <span className="font-semibold">Compartido: </span>
                                {formatDateTime(diagnostic.sharedAt)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                Puntajes por pilar
                            </p>
                            {diagnostic.pillarScores.length === 0 ? (
                                <p className="text-sm text-[var(--app-muted)]">Sin scores aún.</p>
                            ) : (
                                <div className="space-y-2">
                                    {diagnostic.pillarScores.map((pillar) => (
                                        <div key={pillar.pillarCode}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold">
                                                    {pillar.pillarLabel ?? pillarLabel(pillar.pillarCode)}
                                                </span>
                                                <span>{Math.round(pillar.score)}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full bg-[var(--brand-primary)]"
                                                    style={{ width: `${Math.min(100, Math.max(0, pillar.score))}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Mentorías asignadas y sesiones"
                icon={Calendar}
                description="Asignaciones activas, próximas sesiones y sesiones pasadas."
                cta={
                    canSchedule ? (
                        <button
                            type="button"
                            onClick={openSchedule}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                        >
                            <CalendarPlus size={14} /> Agendar 1:1
                        </button>
                    ) : undefined
                }
            >
                {mentorship.assignments.length === 0 && mentorship.totalSessions === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">Sin mentorías registradas.</p>
                ) : (
                    <div className="space-y-4">
                        {mentorship.assignments.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                    Asignaciones
                                </p>
                                <ul className="mt-2 space-y-2 text-sm">
                                    {mentorship.assignments.map((a) => (
                                        <li
                                            key={a.assignmentId}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-semibold">{a.mentorName}</span>
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        a.status === 'active'
                                                            ? 'text-emerald-700'
                                                            : a.status === 'paused'
                                                              ? 'text-amber-700'
                                                              : 'text-slate-500'
                                                    }`}
                                                >
                                                    {a.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--app-muted)]">
                                                Asignado: {formatDate(a.assignedAt)}
                                                {a.endedAt ? ` · Finalizado: ${formatDate(a.endedAt)}` : ''}
                                            </div>
                                            {a.notes && (
                                                <p className="mt-1 text-xs italic text-[var(--app-muted)]">{a.notes}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {mentorship.upcomingSessions.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                    Próximas sesiones
                                </p>
                                <ul className="mt-2 space-y-2 text-sm">
                                    {mentorship.upcomingSessions.map((s) => (
                                        <li
                                            key={s.sessionId}
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                                        >
                                            <div className="font-semibold">{s.title}</div>
                                            <div className="text-xs text-[var(--app-muted)]">
                                                {s.sessionType} · con {s.mentorName} · {formatDateTime(s.startsAt)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {mentorship.pastSessions.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                    Sesiones pasadas
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-[var(--app-muted)]">
                                    {mentorship.pastSessions.map((s) => (
                                        <li key={s.sessionId} className="flex items-center justify-between">
                                            <span>
                                                {formatDate(s.startsAt)} · {s.title}{' '}
                                                <span className="text-slate-400">({s.mentorName})</span>
                                            </span>
                                            <span
                                                className={`font-semibold ${
                                                    s.attended === true
                                                        ? 'text-emerald-700'
                                                        : s.attended === false
                                                          ? 'text-rose-700'
                                                          : 'text-slate-500'
                                                }`}
                                            >
                                                {s.attended === true
                                                    ? 'Asistió'
                                                    : s.attended === false
                                                      ? 'No asistió'
                                                      : s.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Contenidos y cursos"
                icon={PlayCircle}
                description={`${content.totalSeen} vistos · ${content.totalCompleted} completados.`}
            >
                {content.items.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">Sin actividad de contenido aún.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="app-table text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Categoría</th>
                                    <th>Avance</th>
                                    <th>Última vista</th>
                                </tr>
                            </thead>
                            <tbody>
                                {content.items.slice(0, 30).map((item) => (
                                    <tr key={item.contentId}>
                                        <td>
                                            {item.progressPercent >= 100 && (
                                                <CheckCircle2 size={14} className="mr-1 inline text-emerald-600" />
                                            )}
                                            {item.title}
                                        </td>
                                        <td className="text-[var(--app-muted)]">{item.contentType}</td>
                                        <td className="text-[var(--app-muted)]">{item.category}</td>
                                        <td>{Math.round(item.progressPercent)}%</td>
                                        <td className="text-[var(--app-muted)]">{formatDate(item.lastViewedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {content.items.length > 30 && (
                            <p className="mt-2 text-xs text-[var(--app-muted)]">
                                Mostrando 30 de {content.items.length} contenidos.
                            </p>
                        )}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Networking"
                icon={Network}
                description={`${networking.connectedCount} conexiones activas · ${networking.communityCount} comunidades.`}
            >
                {networking.recentConnections.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">Sin conexiones registradas.</p>
                ) : (
                    <ul className="grid gap-2 md:grid-cols-2">
                        {networking.recentConnections.map((connection) => (
                            <li
                                key={connection.connectionId}
                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-semibold">{connection.counterpartName}</p>
                                    <p className="text-xs text-[var(--app-muted)]">{connection.counterpartRole ?? '—'}</p>
                                </div>
                                <span
                                    className={`text-xs font-semibold ${
                                        connection.status === 'connected'
                                            ? 'text-emerald-700'
                                            : connection.status === 'pending'
                                              ? 'text-amber-700'
                                              : 'text-slate-500'
                                    }`}
                                >
                                    {connection.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard
                title="Convocatorias aplicadas"
                icon={Megaphone}
                description={convocatorias.note}
            >
                {convocatorias.items.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">No ha aplicado a convocatorias todavía.</p>
                ) : (
                    <ul className="space-y-2">
                        {convocatorias.items.map((item) => (
                            <li
                                key={item.convocatoriaId}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-xs text-[var(--app-muted)]">
                                        Aplicó el {formatDate(item.appliedAt)} · estado convocatoria: {item.status}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/convocatorias/${item.convocatoriaId}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    Abrir <ExternalLink size={12} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <SectionCard
                title="Workshops"
                icon={Users}
                description={`${workshops.totalRegistered} inscritos · ${workshops.totalAttended} asistidos. ${workshops.note}`}
            >
                {workshops.items.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">No se ha registrado en ningún workshop.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="app-table text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th>Workshop</th>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Estado asistencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workshops.items.map((item) => (
                                    <tr key={item.workshopId}>
                                        <td>{item.title}</td>
                                        <td className="text-[var(--app-muted)]">{item.workshopType}</td>
                                        <td className="text-[var(--app-muted)]">{formatDateTime(item.startsAt)}</td>
                                        <td>
                                            <span
                                                className={`text-xs font-semibold ${
                                                    item.attendanceStatus === 'attended'
                                                        ? 'text-emerald-700'
                                                        : item.attendanceStatus === 'registered'
                                                          ? 'text-[var(--brand-primary)]'
                                                          : item.attendanceStatus === 'no_show'
                                                            ? 'text-rose-700'
                                                            : 'text-slate-500'
                                                }`}
                                            >
                                                {item.attendanceStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            <div className="rounded-3xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 p-4 text-xs text-[var(--brand-primary)]">
                <Sparkles size={14} className="mr-1 inline" />
                Esta vista 360 se actualiza cada vez que abres la página. Los enlaces a cada WB ya abren la edición del workbook del líder seleccionado para admin/gestor/adviser.
            </div>

            {scheduleOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(22,10,38,0.55)] p-4 backdrop-blur-sm">
                    <div className="w-[min(94vw,460px)] rounded-[20px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-[var(--app-ink)]">Agendar mentoría 1:1</h3>
                                <p className="mt-1 text-xs text-[var(--app-muted)]">Con {profile.displayName}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setScheduleOpen(false)}
                                className="text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {/* Tipo: incluida del programa (descuenta) vs adicional */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Tipo de sesión</label>
                                <div className="flex flex-col gap-2">
                                    <label
                                        className={`flex items-start gap-2 rounded-[12px] border p-3 text-sm ${
                                            !canConsumeProgram
                                                ? 'cursor-not-allowed border-[var(--app-border)] opacity-60'
                                                : scheduleForm.mode === 'program'
                                                  ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,white)]'
                                                  : 'border-[var(--app-border)]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="schedule-mode"
                                            className="mt-0.5 accent-[var(--brand-primary)]"
                                            checked={scheduleForm.mode === 'program'}
                                            disabled={!canConsumeProgram}
                                            onChange={() => setScheduleForm((p) => ({ ...p, mode: 'program' }))}
                                        />
                                        <span>
                                            <span className="font-bold text-[var(--app-ink)]">Incluida del programa (descuenta)</span>
                                            <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                                                {programNext
                                                    ? canConsumeProgram
                                                        ? `Consumirá ${programNext.code} «${programNext.title}» de las ${snapshot.mentorship.programIncludedTotal} incluidas.`
                                                        : `La siguiente (${programNext.code}) se habilita ${
                                                              programNext.unlockDate ? `el ${formatDate(programNext.unlockDate)}` : 'según la cadencia'
                                                          }.`
                                                    : 'Este líder no tiene mentorías del programa disponibles.'}
                                            </span>
                                        </span>
                                    </label>
                                    <label
                                        className={`flex items-start gap-2 rounded-[12px] border p-3 text-sm ${
                                            scheduleForm.mode === 'manual'
                                                ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,white)]'
                                                : 'border-[var(--app-border)]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="schedule-mode"
                                            className="mt-0.5 accent-[var(--brand-primary)]"
                                            checked={scheduleForm.mode === 'manual'}
                                            onChange={() => setScheduleForm((p) => ({ ...p, mode: 'manual' }))}
                                        />
                                        <span>
                                            <span className="font-bold text-[var(--app-ink)]">Adicional (no descuenta)</span>
                                            <span className="mt-0.5 block text-xs text-[var(--app-muted)]">Sesión extra fuera del paquete incluido.</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Adviser</label>
                                <select
                                    className="app-select"
                                    value={scheduleForm.mentorUserId}
                                    onChange={(e) => setScheduleForm((p) => ({ ...p, mentorUserId: e.target.value }))}
                                >
                                    <option value="">Selecciona un adviser…</option>
                                    {advisers.map((a) => (
                                        <option key={a.userId} value={a.userId}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Título (opcional)</label>
                                <input
                                    className="app-input"
                                    placeholder={`Mentoría 1:1 con ${profile.displayName}`}
                                    value={scheduleForm.title}
                                    onChange={(e) => setScheduleForm((p) => ({ ...p, title: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Fecha</label>
                                    <input
                                        type="date"
                                        className="app-input"
                                        value={scheduleForm.date}
                                        onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Hora</label>
                                    <input
                                        type="time"
                                        className="app-input"
                                        value={scheduleForm.time}
                                        onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Duración (min)</label>
                                    <input
                                        type="number"
                                        min={15}
                                        step={15}
                                        className="app-input"
                                        value={scheduleForm.duration}
                                        onChange={(e) => setScheduleForm((p) => ({ ...p, duration: Number(e.target.value) || 60 }))}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Enlace (opcional)</label>
                                    <input
                                        className="app-input"
                                        placeholder="https://meet…"
                                        value={scheduleForm.meetingUrl}
                                        onChange={(e) => setScheduleForm((p) => ({ ...p, meetingUrl: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setScheduleOpen(false)}
                                className="rounded-full border border-[var(--app-border)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void submitSchedule()}
                                disabled={scheduling}
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                            >
                                {scheduling ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
