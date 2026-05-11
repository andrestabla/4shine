"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AccessOfferPanel } from "@/components/access/AccessOfferPanel";
import { useUser } from "@/context/UserContext";
import { filterCommercialProducts } from "@/features/access/catalog";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid, type StatItem } from "@/components/dashboard/StatGrid";
import type { UserStats } from "@/server/bootstrap/types";

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

const ROLE_LABEL: Record<string, string> = {
  lider: "Líder",
  mentor: "Adviser",
  gestor: "Gestor",
  admin: "Administrador",
  invitado: "Invitado",
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
      roleTag: "Vista Adviser",
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
      { label: "Horas", value: userStats.hours ?? 0, hint: "Acumuladas" },
      { label: "Rating", value: userStats.rating ?? 0, hint: "Promedio" },
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

export default function DashboardHomePage() {
  const { currentUser, currentRole, bootstrapData, can, viewerAccess } = useUser();

  if (!currentUser || !currentRole || !bootstrapData) return null;

  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const isOpenLeader = currentRole === "lider" && viewerAccess?.viewerTier === "open_leader";

  const roleSummary = buildRoleSummary(currentRole, isOpenLeader);

  const newsUpdates = bootstrapData.newsUpdates;
  const quote = bootstrapData.quotes[0];
  const mentorshipCount = bootstrapData.mentorships.length;
  const learningCount = bootstrapData.learningContent.length;
  const menteesCount = bootstrapData.mentees.length;

  const roleStats = buildRoleStats({
    role: currentRole,
    isOpenLeader,
    learningCount,
    mentorshipCount,
    newsCount: newsUpdates.length,
    userStats: currentUser.stats,
    menteesCount,
  });

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

  const commercialOffers = filterCommercialProducts(viewerAccess?.catalog, {
    groups: ["program", "discovery", "mentoring_pack"],
  });

  // ── Free leader view ─────────────────────────────────────────────────────
  if (isOpenLeader) {
    const FREE_MODULES = [
      {
        href: "/dashboard/aprendizaje",
        icon: BookOpen,
        label: "Aprendizaje",
        desc: "Biblioteca de recursos, videos y cursos etiquetados como free.",
        available: true,
      },
      {
        href: "/dashboard/descubrimiento",
        icon: Compass,
        label: "Descubrimiento",
        desc: "Diagnóstico de liderazgo en 4 pilares con informe IA. Compra individual.",
        available: true,
        badge: "$50 USD",
      },
      {
        href: "/dashboard/mentorias",
        icon: CalendarDays,
        label: "Mentorías",
        desc: "Sesiones individuales con Advisers. Paquetes desde $50 USD.",
        available: true,
        badge: "Desde $50",
      },
    ];

    const LOCKED_MODULES = [
      {
        icon: Sparkles,
        label: "Trayectoria",
        desc: "Ruta de 24 semanas con 5 hitos, workbooks y seguimiento integral.",
      },
      {
        icon: Users,
        label: "Networking",
        desc: "Comunidad de líderes, perfiles, conexiones y convocatorias.",
      },
      {
        icon: MessageSquare,
        label: "Mensajes",
        desc: "Conversaciones directas con Advisers y equipo del programa.",
      },
    ];

    return (
      <div className="space-y-6">

        {/* Hero */}
        <section className="app-hero-surface relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 78% 18%, white 0%, transparent 55%)" }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-white/80">
                Acceso Free
              </div>
              <h1 className="mt-4 text-[2.4rem] font-black leading-[0.95] tracking-tight text-white sm:text-[2.8rem]">
                Hola, {firstName}
              </h1>
              <p className="mt-3 max-w-md text-[0.97rem] leading-relaxed text-white/74">
                Tu cuenta está activa. Explora contenido libre, activa el diagnóstico
                o compra mentorías cuando lo necesites.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard/aprendizaje" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#4f2360] transition hover:-translate-y-0.5 hover:bg-white/96">
                  Explorar contenido <ArrowRight size={15} />
                </Link>
                <Link href="/dashboard/descubrimiento" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                  Activar diagnóstico · $50
                </Link>
              </div>
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2.5 sm:w-52 sm:grid-cols-1">
              {[
                { v: learningCount > 0 ? learningCount : "∞", l: "Recursos libres" },
                { v: "3", l: "Módulos accesibles" },
                { v: "$50", l: "Diagnóstico" },
                { v: "$3,000", l: "Programa completo" },
              ].map((s) => (
                <div key={s.l} className="rounded-[0.9rem] border border-white/14 bg-white/10 px-3.5 py-2.5">
                  <p className="text-lg font-black leading-none text-white">{s.v}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/55">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available modules */}
        <section className="app-panel-strong overflow-hidden p-5 sm:p-6">
          <p className="app-section-kicker">Disponible ahora</p>
          <h2 className="mt-1.5 text-xl font-extrabold text-[var(--app-ink)]">Lo que puedes hacer hoy</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {FREE_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.label}
                  href={mod.href}
                  className="group flex flex-col gap-3 rounded-[1.2rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-[0.9rem] bg-[var(--app-chip)] p-2.5 text-[#4f2360]">
                      <Icon size={18} />
                    </div>
                    {mod.badge && (
                      <span className="rounded-full border border-[var(--app-chip-border)] bg-[var(--app-chip)] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#4f2360]">
                        {mod.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--app-ink)]">{mod.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{mod.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-[#7c5f93] opacity-0 transition group-hover:opacity-100">
                    Abrir <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Locked modules + upgrade */}
        <section className="app-panel-strong overflow-hidden p-5 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
            <div>
              <p className="app-section-kicker">Con suscripción</p>
              <h2 className="mt-1.5 text-xl font-extrabold text-[var(--app-ink)]">Módulos que se desbloquean</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {LOCKED_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.label} className="flex flex-col gap-2.5 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 opacity-60">
                      <div className="rounded-[0.9rem] bg-white p-2.5 text-[var(--app-muted)] w-fit">
                        <Icon size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--app-ink)]">{mod.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--app-muted)]">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="flex flex-col justify-center gap-3 xl:w-60">
              <div className="rounded-[1.2rem] bg-[var(--app-chip)] px-5 py-5 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-muted)]">Programa completo</p>
                <p className="mt-2 text-[2.2rem] font-black leading-none text-[var(--app-ink)]">$3,000</p>
                <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">USD · 6 meses · Todo incluido</p>
                <a
                  href="https://www.4shine.co/planes-precios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-full bg-[var(--brand-primary)] py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Ver el programa →
                </a>
              </div>
              <p className="text-center text-[11px] text-[var(--app-muted)]">
                Incluye diagnóstico, 10 mentorías, trayectoria y comunidad.
              </p>
            </div>
          </div>
        </section>

      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageTitle
        title={`Hola, ${firstName}`}
        subtitle={`Bienvenido, ${ROLE_LABEL[currentRole] ?? "Usuario"}. Panel simplificado con lo esencial para avanzar sin ruido.`}
      />

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

      {isOpenLeader ? (
        <AccessOfferPanel
          badge="Líder sin suscripción"
          title="Activa solo lo que necesitas"
          description="Mantén una entrada simple: contenido free, diagnóstico individual o paquetes de mentoría según tu momento." 
          products={commercialOffers}
          primaryAction={{ href: "/dashboard/aprendizaje", label: "Explorar contenido free" }}
          note="Puedes escalar al programa completo cuando quieras para desbloquear la ruta integral."
        />
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

          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Novedades</p>
            <div className="mt-4 space-y-3">
              {newsUpdates.slice(0, 3).map((news) => (
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
              {newsUpdates.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">No hay novedades por ahora.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
