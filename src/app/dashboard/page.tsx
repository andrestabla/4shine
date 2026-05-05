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

  // ── Simplified view for free leaders ──────────────────────────────────────
  if (isOpenLeader) {
    const FREE_ACCESS = [
      { label: "Biblioteca de recursos free", desc: "Videos, podcasts y documentos abiertos sin costo" },
      { label: "Cursos disponibles", desc: "Contenido del catálogo etiquetado como free" },
      { label: "Vista de la comunidad", desc: "Acceso a la sección de networking de la plataforma" },
    ];

    const PLANS = [
      {
        kicker: "Acceso puntual",
        name: "Diagnóstico",
        price: "$50 USD",
        desc: "Realiza la prueba diagnóstica 4Shine y recibe tu lectura ejecutiva con tu punto de partida.",
        featured: false,
      },
      {
        kicker: "Sesiones adicionales",
        name: "Pack de mentorías",
        price: "Desde $750 USD",
        desc: "Sesiones individuales con Advisers disponibles. Paquetes de 5, 10 o 15 sesiones.",
        featured: false,
      },
      {
        kicker: "Programa principal",
        name: "4Shine Programa",
        price: "$3,000 USD",
        desc: "Ruta completa con suscripción: trayectoria, diagnóstico, 10 mentorías incluidas y comunidad.",
        featured: true,
      },
    ];

    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <span className="inline-block rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)]">
            Acceso Free
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--app-ink)]">
            Hola, {firstName}
          </h1>
          <p className="mt-2 text-base text-[var(--app-muted)] max-w-lg">
            Tu cuenta está activa. Accede al contenido libre de la plataforma desde hoy.
          </p>
        </div>

        <section className="app-panel p-5 sm:p-7">
          <p className="app-section-kicker">Lo que tienes hoy</p>
          <h2 className="mt-2 text-xl font-extrabold text-[var(--app-ink)]">Tu acceso actual</h2>
          <ul className="mt-5 space-y-4">
            {FREE_ACCESS.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={11} className="text-emerald-600" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--app-ink)]">{item.label}</p>
                  <p className="text-xs text-[var(--app-muted)]">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/aprendizaje" className="app-button-primary mt-6 inline-flex">
            Explorar contenido <ArrowRight size={16} />
          </Link>
        </section>

        <section className="app-panel p-5 sm:p-7">
          <p className="app-section-kicker">Escala tu experiencia</p>
          <h2 className="mt-2 text-xl font-extrabold text-[var(--app-ink)]">Elige el nivel que necesitas</h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Activa solo lo que necesitas, cuando lo necesites. Sin compromisos.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-[18px] p-5 ${
                  plan.featured
                    ? "border-2 border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                    : "border border-[var(--app-border)] bg-white"
                }`}
              >
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${plan.featured ? "text-[var(--brand-primary)]" : "text-[var(--app-muted)]"}`}>
                  {plan.kicker}
                </p>
                <p className="mt-3 text-2xl font-extrabold text-[var(--app-ink)]">{plan.price}</p>
                <p className="mt-0.5 text-base font-bold text-[var(--app-ink)]">{plan.name}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--app-muted)]">{plan.desc}</p>
                <a
                  href="https://www.4shine.co/planes-precios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 block rounded-full py-2.5 text-center text-sm font-bold transition ${
                    plan.featured
                      ? "bg-[var(--brand-primary)] text-white hover:opacity-90"
                      : "border border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  }`}
                >
                  Ver detalles →
                </a>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-[var(--app-muted)]">
            Más información en{" "}
            <a
              href="https://www.4shine.co/planes-precios"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-[var(--brand-primary)]"
            >
              4shine.co/planes-precios
            </a>
          </p>
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
