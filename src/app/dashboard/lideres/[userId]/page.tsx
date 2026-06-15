'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    Compass,
    ExternalLink,
    Loader2,
    Megaphone,
    Network,
    PlayCircle,
    Sparkles,
    Users
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import { getLeader360, type Leader360Snapshot } from '@/features/lideres/client';

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
    const { currentRole } = useUser();
    const isElevated = currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor';

    const [snapshot, setSnapshot] = React.useState<Leader360Snapshot | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!userId) return;
        let active = true;
        setLoading(true);
        setError(null);
        getLeader360(userId)
            .then((data) => {
                if (!active) return;
                setSnapshot(data);
            })
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
    }, [userId]);

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
        </div>
    );
}
