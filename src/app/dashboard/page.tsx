"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Map as MapIcon,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useBranding } from "@/context/BrandingContext";
import { getMentorshipOverview, type GroupSessionEventRecord } from "@/features/mentorias/client";
import { getMyDashboard, type DashboardSummary } from "@/features/dashboard/client";
import { buildGreeting, buildNextSteps, type NextStep } from "@/features/dashboard/next-steps";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid, type StatItem } from "@/components/dashboard/StatGrid";
import type { UserStats } from "@/server/bootstrap/types";

const STEP_ICONS: Record<NextStep["icon"], React.ComponentType<{ size?: number; className?: string }>> = {
  compass: Compass,
  map: MapIcon,
  video: Video,
  users: Users,
  book: BookOpen,
  shield: ShieldCheck,
  settings: Settings,
  sparkles: Sparkles,
};

type RoleSummary = {
  roleTag: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

type ShortcutItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  visible: boolean;
};

function buildRoleSummary(
  role: string,
  isOpenLeader: boolean,
): RoleSummary {
  if (role === "admin") {
    return {
      roleTag: "Vista Administrador",
      title: "Control central de operación",
      description:
        "Supervisa usuarios, marca, integraciones y rendimiento del ecosistema desde una vista simple y accionable.",
      primaryCta: { href: "/dashboard/usuarios", label: "Gestionar usuarios" },
      secondaryCta: {
        href: "/dashboard/administracion/integraciones",
        label: "Revisar integraciones",
      },
    };
  }

  if (role === "gestor") {
    return {
      roleTag: "Vista Gestor",
      title: "Orquesta el programa sin fricción",
      description:
        "Da seguimiento a mentorías, contenidos y operaciones clave del programa con foco en continuidad.",
      primaryCta: { href: "/dashboard/mentorias", label: "Gestionar mentorías" },
      secondaryCta: { href: "/dashboard/contenido", label: "Gestionar contenido" },
    };
  }

  if (role === "mentor") {
    return {
      roleTag: "Vista Advisor",
      title: "Acompañamiento experto con contexto",
      description:
        "Consulta sesiones, líderes asignados y mensajes para mantener un acompañamiento consistente.",
      primaryCta: { href: "/dashboard/mentorias", label: "Ver agenda" },
      secondaryCta: { href: "/dashboard/mensajes", label: "Abrir mensajes" },
    };
  }

  if (role === "invitado") {
    return {
      roleTag: "Vista Invitado",
      title: "Acceso de descubrimiento",
      description:
        "Completa tu diagnóstico y conoce tu punto de partida antes de activar una experiencia completa.",
      primaryCta: {
        href: "/dashboard/descubrimiento",
        label: "Ir a descubrimiento",
      },
    };
  }

  if (isOpenLeader) {
    return {
      roleTag: "Líder sin suscripción",
      title: "Empieza en modo free y escala cuando quieras",
      description:
        "Accede a contenido abierto y compra diagnóstico o mentorías puntuales según tu momento.",
      primaryCta: {
        href: "/dashboard/aprendizaje",
        label: "Explorar contenido free",
      },
      secondaryCta: { href: "/dashboard/mentorias", label: "Comprar mentorías" },
    };
  }

  return {
    roleTag: "Líder con suscripción",
    title: "Tu ruta estratégica ya está activa",
    description:
      "Continúa tu avance en trayectoria, mentorías y networking desde un panel claro de prioridades.",
    primaryCta: { href: "/dashboard/trayectoria", label: "Continuar trayectoria" },
    secondaryCta: { href: "/dashboard/mentorias", label: "Ver mentorías" },
  };
}

function buildRoleStats(params: {
  role: string;
  isOpenLeader: boolean;
  learningCount: number;
  mentorshipCount: number;
  newsCount: number;
  userStats: UserStats;
  menteesCount: number;
}): StatItem[] {
  const {
    role,
    isOpenLeader,
    learningCount,
    mentorshipCount,
    newsCount,
    userStats,
    menteesCount,
  } = params;

  if (role === "admin") {
    return [
      { label: "Usuarios activos", value: userStats.totalUsers ?? menteesCount, hint: "Base operativa" },
      { label: "Cohortes", value: userStats.activeCohorts ?? 0, hint: "En curso" },
      { label: "Integridad", value: userStats.uptime ?? "N/A", hint: "Estado plataforma" },
      { label: "Novedades", value: newsCount, hint: "Publicadas" },
    ];
  }

  if (role === "gestor") {
    return [
      { label: "Contenido", value: userStats.managedContent ?? learningCount, hint: "En gestión" },
      { label: "Pendientes", value: userStats.pendingReviews ?? 0, hint: "Por revisar" },
      { label: "Mentorías", value: mentorshipCount, hint: "Con seguimiento" },
      { label: "Satisfacción", value: userStats.programSatisfaction ?? "N/A", hint: "Percepción" },
    ];
  }

  if (role === "mentor") {
    return [
      { label: "Líderes", value: userStats.students ?? menteesCount, hint: "Asignados" },
      { label: "Sesiones", value: mentorshipCount, hint: "Totales" },
      { label: "Horas", value: userStats.hours || "—", hint: "Acumuladas" },
      { label: "Rating", value: userStats.rating || "—", hint: userStats.rating ? "Promedio" : "Tras tus sesiones" },
    ];
  }

  if (role === "invitado") {
    return [
      { label: "Acceso", value: "Temporal", hint: "Solo descubrimiento" },
      { label: "Estado", value: "Activo", hint: "Sesión vigente" },
      { label: "Progreso", value: `${userStats.progress ?? 0}%`, hint: "Diagnóstico" },
      { label: "Recursos", value: learningCount, hint: "Disponibles" },
    ];
  }

  if (isOpenLeader) {
    return [
      { label: "Acceso", value: "Free", hint: "Líder sin suscripción" },
      { label: "Recursos", value: learningCount, hint: "Contenido abierto" },
      { label: "Mentorías", value: "On demand", hint: "Compra puntual" },
      { label: "Diagnóstico", value: "Opcional", hint: "Compra individual" },
    ];
  }

  return [
    { label: "Progreso", value: `${userStats.progress ?? 0}%`, hint: "Ruta personal" },
    { label: "Tests", value: userStats.tests ?? 0, hint: "Completados" },
    { label: "Conexiones", value: userStats.connections ?? 0, hint: "Networking" },
    { label: "Mentorías", value: mentorshipCount, hint: "Sesiones" },
  ];
}

function formatUpcomingDate(isoString: string, timezone?: string): string {
  return new Date(isoString).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || undefined,
  });
}

export default function DashboardHomePage() {
  const { currentUser, currentRole, bootstrapData, can, viewerAccess } = useUser();
  const { tokens: brandingTokens } = useBranding();
  const tz = brandingTokens.layout.timezone || undefined;

  const [upcomingJoinedSessions, setUpcomingJoinedSessions] = React.useState<GroupSessionEventRecord[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getMyDashboard().then((data) => {
      if (!cancelled) setSummary(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (currentRole !== 'lider' && currentRole !== 'mentor') return;
    if (currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader') return;
    getMentorshipOverview()
      .then((overview) => {
        const now = new Date();
        const joined = (overview.groupSessions ?? []).filter(
          (s) => s.participationStatus === 'joined' && new Date(s.startsAt) > now,
        );
        joined.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        setUpcomingJoinedSessions(joined.slice(0, 3));
      })
      .catch(() => {/* silent */});
  }, [currentRole, viewerAccess?.viewerTier]);

  if (!currentUser || !currentRole || !bootstrapData) return null;

  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const isOpenLeader = currentRole === "lider" && viewerAccess?.viewerTier === "open_leader";

  const roleSummary = buildRoleSummary(currentRole, isOpenLeader);

  const newsUpdates = bootstrapData.newsUpdates;
  // Mensaje del día: rota a diario por la base de conocimiento (mismo mensaje
  // durante el día, distinto cada día), recorriendo todas las citas activas.
  const quotes = bootstrapData.quotes;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const quote = quotes.length > 0 ? quotes[dayIndex % quotes.length] : undefined;
  const mentorshipCount = bootstrapData.mentorships.length;

  // Próximas mentorías programadas — alimentan también el bloque de Novedades
  // tanto para el líder (muestra el advisor) como para el advisor (muestra el mentee).
  const upcomingMentorshipsNovedades = React.useMemo(() => {
    const isAdvisor = currentRole === 'mentor';
    const now = new Date();
    return bootstrapData.mentorships
      .filter((m) => m.status === 'scheduled')
      .filter((m) => {
        try {
          // m.date puede venir como ISO o como "DD MMM YYYY"; intentamos parse.
          const parsed = new Date(`${m.date} ${m.time || ''}`.trim());
          if (!Number.isNaN(parsed.getTime())) return parsed.getTime() > now.getTime();
          return new Date(m.date).getTime() > now.getTime();
        } catch {
          return true;
        }
      })
      .slice(0, 2)
      .map((m) => ({
        id: `mentoria-${m.id}`,
        category: 'Próxima mentoría',
        title: isAdvisor
          ? `${m.title} · con ${m.mentee ?? 'el líder'}`
          : `${m.title} · con ${m.mentor}`,
        date: `${m.date}${m.time ? ` · ${m.time}` : ''}`,
        href: '/dashboard/mentorias',
      }));
  }, [bootstrapData.mentorships, currentRole]);
  const learningCount = bootstrapData.learningContent.length;
  const menteesCount = bootstrapData.mentees.length;

  const roleStats: StatItem[] =
    currentRole === "lider" && !isOpenLeader && summary
      ? [
          { label: "Progreso", value: `${summary.routePercent}%`, hint: "Ruta personal" },
          {
            label: "Diagnóstico",
            value: summary.discovery.done ? "Completo" : `${summary.discovery.completionPercent}%`,
            hint: "Descubrimiento",
          },
          { label: "Conexiones", value: summary.networking.connected, hint: "Networking" },
          { label: "Mentorías", value: summary.mentorias.completed, hint: "Completadas" },
        ]
      : buildRoleStats({
          role: currentRole,
          isOpenLeader,
          learningCount,
          mentorshipCount,
          newsCount: newsUpdates.length,
          userStats: currentUser.stats,
          menteesCount,
        });

  const nextSteps = summary ? buildNextSteps(summary, currentRole, can) : [];
  const stepsTitle = summary?.firstTime ? "Primeros pasos" : "Continúa donde quedaste";
  const greeting = buildGreeting(summary, currentRole, firstName, nextSteps);

  const shortcuts: ShortcutItem[] = [
    {
      href: "/dashboard/trayectoria",
      label: "Trayectoria",
      description: "Avance general y próximos hitos.",
      icon: Sparkles,
      visible: can("trayectoria", "view"),
    },
    {
      href: "/dashboard/descubrimiento",
      label: "Descubrimiento",
      description: "Diagnóstico y lectura ejecutiva.",
      icon: Compass,
      visible: can("descubrimiento", "view"),
    },
    {
      href: "/dashboard/aprendizaje",
      label: "Aprendizaje",
      description: "Contenido y workbooks.",
      icon: BookOpen,
      visible: can("aprendizaje", "view"),
    },
    {
      href: "/dashboard/mentorias",
      label: "Mentorías",
      description: "Sesiones grupales y del programa.",
      icon: CalendarDays,
      visible: can("mentorias", "view"),
    },
    {
      href: "/dashboard/networking",
      label: "Networking",
      description: "Comunidad y conexiones.",
      icon: Users,
      visible: can("networking", "view"),
    },
    {
      href: "/dashboard/mensajes",
      label: "Mensajes",
      description: "Conversaciones y seguimiento.",
      icon: MessageSquare,
      visible: can("mensajes", "view"),
    },
    {
      href: "/dashboard/usuarios",
      label: "Usuarios",
      description: "Gestión de cuentas y roles.",
      icon: ShieldCheck,
      visible: can("usuarios", "view"),
    },
    {
      href: "/dashboard/administracion",
      label: "Administración",
      description: "Integraciones, marca y operación.",
      icon: Settings,
      visible: can("usuarios", "manage"),
    },
  ].filter((item) => item.visible);

  // ── Free leader view ─────────────────────────────────────────────────────
  if (isOpenLeader) {
    const FREE_SHORTCUTS = [
      { href: "/dashboard/aprendizaje", icon: BookOpen, label: "Aprendizaje", color: "#5b3fa5" },
      { href: "/dashboard/descubrimiento", icon: Compass, label: "Descubrimiento", color: "#9b3f8a" },
      { href: "/dashboard/mentorias", icon: CalendarDays, label: "Mentorías", color: "#3f7ea5" },
    ];

    return (
      <div className="space-y-4">

        {/* Promo banner */}
        <section
          className="relative overflow-hidden rounded-[1.5rem] px-7 py-7 sm:px-9 sm:py-8"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 55%, var(--brand-accent)) 45%, var(--brand-accent) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(35%, -35%)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/4 h-28 w-28 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translateY(40%)" }}
          />
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/70">
              Bienvenido, {firstName}
            </p>
            <h1 className="mt-2 text-[1.85rem] font-black leading-tight text-white sm:text-[2.1rem]">
              Tu liderazgo<br />empieza aquí.
            </h1>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/78">
              Accede a recursos gratuitos, activa tu diagnóstico o agenda una mentoría cuando lo necesites.
            </p>
            <Link
              href="/dashboard/aprendizaje"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5"
              style={{ color: "var(--brand-primary)" }}
            >
              Explorar recursos <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Quick access */}
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Acceso rápido</p>
          <div className="grid grid-cols-3 gap-3">
            {FREE_SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2.5 rounded-[1.3rem] border border-[var(--app-border)] bg-white px-3 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[0.9rem]"
                    style={{ backgroundColor: `${item.color}18` }}
                  >
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <p className="text-center text-[0.78rem] font-bold leading-snug text-[var(--app-ink)]">
                    {item.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Locked modules */}
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Con suscripción</p>
              <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">Módulos que se desbloquean</h2>
            </div>
            <Link
              href="/dashboard/suscripcion"
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: "var(--brand-primary)" }}
            >
              Ver planes y precios
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { icon: Sparkles, label: "Trayectoria", desc: "24 semanas · 5 hitos · workbooks guiados" },
              { icon: Users, label: "Networking", desc: "Comunidad de líderes · perfiles · conexiones" },
              { icon: MessageSquare, label: "Mensajes", desc: "Conversaciones directas con tu Advisor" },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.label}
                  className="flex items-center gap-3.5 rounded-[1rem] bg-[var(--app-surface-muted)] px-4 py-3.5 opacity-55"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.75rem] bg-white text-[var(--app-muted)]">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--app-ink)]">{mod.label}</p>
                    <p className="text-[11px] leading-snug text-[var(--app-muted)]">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/dashboard/suscripcion"
            className="mt-4 flex items-center justify-between rounded-[1rem] border border-dashed px-4 py-3.5 transition hover:-translate-y-0.5"
            style={{
              borderColor: "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
              background: "var(--brand-surface)",
            }}
          >
            <div>
              <p className="text-sm font-extrabold" style={{ color: "var(--brand-primary)" }}>
                Activa tu plan para desbloquearlo todo
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                Diagnóstico, mentorías, journey de 24 semanas y comunidad.
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0" style={{ color: "var(--brand-primary)" }} />
          </Link>
        </section>

      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageTitle title={greeting.title} subtitle={greeting.subtitle} />

      <section className="app-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="app-section-kicker">{roleSummary.roleTag}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--app-ink)] md:text-4xl">
              {roleSummary.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
              {roleSummary.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={roleSummary.primaryCta.href}
              className="app-button-primary"
            >
              {roleSummary.primaryCta.label}
              <ArrowRight size={16} />
            </Link>
            {roleSummary.secondaryCta ? (
              <Link
                href={roleSummary.secondaryCta.href}
                className="app-button-secondary"
              >
                {roleSummary.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <StatGrid stats={roleStats} />

      {nextSteps.length > 0 && (
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-section-kicker">Tu siguiente movimiento</p>
              <h3 className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">{stepsTitle}</h3>
            </div>
            <span className="app-chip">{nextSteps.length}</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nextSteps.map((step, index) => {
              const Icon = STEP_ICONS[step.icon];
              const isPrimary = index === 0;
              return (
                <Link
                  key={step.key}
                  href={step.href}
                  className={`group flex items-start gap-3 rounded-[1.1rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                    isPrimary
                      ? "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/5"
                      : "border-[var(--app-border)] bg-white"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] ${
                      isPrimary ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-chip)] text-[#4f2360]"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[var(--app-ink)]">{step.title}</p>
                      <ArrowRight size={15} className="shrink-0 text-[var(--app-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{step.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isOpenLeader ? (
        <section
          className="app-panel overflow-hidden"
        >
          <div
            className="px-6 py-8 sm:px-10 sm:py-10 text-white"
            style={{
              background:
                "linear-gradient(140deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 70%, #1e293b) 100%)",
            }}
          >
            <div className="flex items-center gap-2 text-white/75">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.28em]">
                Líder sin suscripción
              </span>
            </div>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Activa tu plan para desbloquear todo el journey 4Shine
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
              Tu cuenta tiene acceso a Descubrimiento. El resto del programa
              (Trayectoria, Workbooks, Mentorías, Convocatorias, Networking,
              Workshops y Mensajes) se desbloquea al activar tu plan.
            </p>
            <Link
              href="/dashboard/suscripcion"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--brand-primary)] shadow-sm transition hover:-translate-y-0.5"
            >
              Ver planes y precios
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-section-kicker">Accesos necesarios</p>
              <h3 className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">Atajos por rol</h3>
            </div>
            <span className="app-chip">{shortcuts.length} accesos</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shortcuts.map((item) => (
              <Link key={item.href} href={item.href} className="app-list-card">
                <div className="flex items-center gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--app-chip)] p-2.5 text-[#4f2360]">
                    <item.icon size={17} />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--app-ink)]">{item.label}</p>
                    <p className="text-xs text-[var(--app-muted)]">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Mensaje del día</p>
            <blockquote className="mt-3 text-xl font-semibold leading-tight text-[var(--app-ink)]">
              “{quote?.text ?? "Sigue avanzando con enfoque."}”
            </blockquote>
            <p className="mt-3 text-sm font-semibold text-[var(--app-muted)]">
              {quote?.author ?? "4Shine"}
            </p>
          </section>

          {upcomingJoinedSessions.length > 0 && (
            <section className="app-panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="app-section-kicker">Próximas sesiones</p>
                <Link href="/dashboard/mentorias" className="text-[11px] font-semibold text-[var(--brand-primary)]">
                  Ver todas
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingJoinedSessions.map((session) => (
                  <article
                    key={session.eventId}
                    className="rounded-[14px] border border-green-100 bg-green-50/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--app-ink)]">{session.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                          {formatUpcomingDate(session.startsAt, tz)}
                        </p>
                      </div>
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-600" />
                    </div>
                    {session.zoomJoinUrl && (
                      <a
                        href={session.zoomJoinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#2D8CFF] px-3 py-1 text-[11px] font-bold text-white"
                      >
                        <Video size={11} />
                        Unirse a Zoom
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Novedades</p>
            <div className="mt-4 space-y-3">
              {upcomingMentorshipsNovedades.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-[14px] border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 px-4 py-3 transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                    {item.category}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--app-ink)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">{item.date}</p>
                </Link>
              ))}
              {newsUpdates.slice(0, Math.max(1, 3 - upcomingMentorshipsNovedades.length)).map((news) => (
                <article
                  key={news.id}
                  className="rounded-[14px] border border-[var(--app-border)] bg-white/75 px-4 py-3"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                    {news.category}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--app-ink)]">{news.title}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">{news.date}</p>
                </article>
              ))}
              {newsUpdates.length === 0 && upcomingMentorshipsNovedades.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">No hay novedades por ahora.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
