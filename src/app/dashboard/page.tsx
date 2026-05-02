"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Compass,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { AccessOfferPanel } from "@/components/access/AccessOfferPanel";
import { useUser } from "@/context/UserContext";
import { filterCommercialProducts } from "@/features/access/catalog";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid } from "@/components/dashboard/StatGrid";

export default function DashboardHomePage() {
  const { currentUser, currentRole, bootstrapData, can, viewerAccess } =
    useUser();

  if (!currentUser || !currentRole || !bootstrapData) return null;

  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const isOpenLeader =
    currentRole === "lider" && viewerAccess?.viewerTier === "open_leader";
  const quote = bootstrapData.quotes[0];
  const newsUpdates = bootstrapData.newsUpdates;
  const mentees = bootstrapData.mentees;
  const mentorships = bootstrapData.mentorships;
  const learningContent = bootstrapData.learningContent;

  const roleStats = {
    lider: [
      {
        label: "Progreso",
        value: `${currentUser.stats.progress ?? 0}%`,
        hint: "Ruta personal",
      },
      {
        label: "Tests",
        value: currentUser.stats.tests ?? 0,
        hint: "Completados",
      },
      {
        label: "Conexiones",
        value: currentUser.stats.connections ?? 0,
        hint: "Networking activo",
      },
      { label: "Recursos", value: learningContent.length, hint: "Disponibles" },
    ],
    mentor: [
      {
        label: "Mentees",
        value: currentUser.stats.students ?? mentees.length,
        hint: "Activos",
      },
      {
        label: "Horas",
        value: currentUser.stats.hours ?? 0,
        hint: "Mentoría acumulada",
      },
      {
        label: "Rating",
        value: currentUser.stats.rating ?? 0,
        hint: "Promedio",
      },
      { label: "Sesiones", value: mentorships.length, hint: "Totales" },
    ],
    gestor: [
      {
        label: "Contenido",
        value: currentUser.stats.managedContent ?? learningContent.length,
        hint: "Gestionado",
      },
      {
        label: "Pendientes",
        value: currentUser.stats.pendingReviews ?? 0,
        hint: "Por revisar",
      },
      {
        label: "Satisfacción",
        value: currentUser.stats.programSatisfaction ?? "N/A",
        hint: "Programa",
      },
      { label: "Mentorías", value: mentorships.length, hint: "En seguimiento" },
    ],
    admin: [
      {
        label: "Usuarios",
        value: currentUser.stats.totalUsers ?? mentees.length,
        hint: "Activos",
      },
      {
        label: "Cohortes",
        value: currentUser.stats.activeCohorts ?? 0,
        hint: "En curso",
      },
      {
        label: "Uptime",
        value: currentUser.stats.uptime ?? "N/A",
        hint: "Plataforma",
      },
      { label: "Noticias", value: newsUpdates.length, hint: "Publicadas" },
    ],
    invitado: [
      {
        label: "Acceso",
        value: "Temporal",
        hint: "Invitación",
      },
      {
        label: "Módulo",
        value: "Descubrimiento",
        hint: "Habilitado",
      },
      {
        label: "Progreso",
        value: `${currentUser.stats.progress ?? 0}%`,
        hint: "Diagnóstico",
      },
      {
        label: "Estado",
        value: "Activo",
        hint: "Sesión vigente",
      },
    ],
  }[currentRole];

  const quickActions = [
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
      description: "Recursos, SCORM y workbooks.",
      icon: BookOpen,
      visible: can("aprendizaje", "view"),
    },
    {
      href: "/dashboard/mentorias",
      label: "Mentorías",
      description: "Agenda y seguimiento.",
      icon: CalendarDays,
      visible: can("mentorias", "view"),
    },
    {
      href: "/dashboard/networking",
      label: "Networking",
      description: "Conecta con tu red.",
      icon: Users,
      visible: can("networking", "view"),
    },
    {
      href: "/dashboard/mensajes",
      label: "Mensajes",
      description: "Conversaciones activas.",
      icon: MessageSquare,
      visible: can("mensajes", "view"),
    },
  ].filter((action) => action.visible);

  const executiveSummary = [
    `${learningContent.length} recursos disponibles para seguir avanzando.`,
    `${mentorships.length} sesiones registradas en tu ecosistema.`,
    `${newsUpdates.length} novedades recientes publicadas en plataforma.`,
  ];

  if (isOpenLeader) {
    const commercialOffers = filterCommercialProducts(viewerAccess?.catalog, {
      groups: ["program", "discovery", "mentoring_pack"],
    });

    return (
      <div className="space-y-8">
        <PageTitle
          title={`Hola, ${firstName}`}
          subtitle="Tu cuenta ya está activa. Desde aquí puedes empezar con recursos free o activar una experiencia 4Shine más completa."
        />

        <StatGrid
          stats={[
            {
              label: "Acceso actual",
              value: "Free",
              hint:
                learningContent.length > 0
                  ? `${learningContent.length} recursos abiertos en Aprendizaje.`
                  : "Empieza con contenido abierto en Aprendizaje.",
            },
            {
              label: "Diagnóstico",
              value: viewerAccess?.hasDiscoveryPurchase ? "Activo" : "50 USD",
              hint: viewerAccess?.hasDiscoveryPurchase
                ? "La prueba ya está disponible para esta cuenta."
                : "Compra individual para conocer tu punto de partida.",
            },
            {
              label: "Mentorías",
              value: "50-200 USD",
              hint: "Sesiones adicionales con Advisers disponibles.",
            },
            {
              label: "Programa 4Shine",
              value: "2.000 USD",
              hint: "Ruta completa con acompañamiento y módulos integrales.",
            },
          ]}
        />

        <AccessOfferPanel
          badge="Líder sin suscripción"
          title="Elige el nivel de acceso que mejor acompaña tu momento."
          description="Activa el programa completo, compra solo Descubrimiento o reserva mentorías adicionales. La experiencia sigue clara y simple: empiezas con contenido free y escalas cuando lo necesites."
          products={commercialOffers}
          primaryAction={{
            href: "/dashboard/aprendizaje",
            label: "Explorar contenido free",
          }}
          note="El programa 4Shine desbloquea Trayectoria, Descubrimiento, biblioteca completa, workbooks únicos por usuario, mentorías incluidas y acceso a los módulos de comunidad."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Link
            href="/dashboard/aprendizaje"
            className="app-panel block p-5 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="font-extrabold text-[var(--app-ink)]">
                  Aprendizaje free
                </p>
                <p className="text-sm text-[var(--app-muted)]">
                  Accede a recursos públicos etiquetados como free.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/mentorias"
            className="app-panel block p-5 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="font-extrabold text-[var(--app-ink)]">
                  Mentorías adicionales
                </p>
                <p className="text-sm text-[var(--app-muted)]">
                  Reserva sesiones puntuales con el catálogo de Advisers.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title={`Hola, ${firstName}`}
        subtitle="Nos alegra tenerte aquí. Esta vista reúne tu progreso, accesos clave y señales importantes del programa."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
        <section className="app-hero-surface relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              Espacio ejecutivo
            </p>
            <h3
              className="app-display-title mt-3 text-4xl font-semibold leading-[0.92] text-white md:text-[3.6rem]"
              data-display-font="true"
            >
              Liderazgo con claridad, foco y continuidad.
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/82 md:text-base">
              Revisa lo importante, vuelve rápido a tu ruta y mantén el avance
              del programa desde una experiencia más clara y editorial.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {executiveSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-[999px] border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold text-white/92"
                >
                  {item}
                </span>
              ))}
            </div>

            <Link
              href={quickActions[0]?.href ?? "/dashboard/aprendizaje"}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#4f2360] transition hover:-translate-y-0.5"
            >
              Ir a tu siguiente paso
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <aside className="app-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--app-muted)]" />
            <p className="app-section-kicker">Accesos rápidos</p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="app-list-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                    <action.icon size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-[var(--app-ink)]">
                      {action.label}
                    </p>
                    <p className="text-xs text-[var(--app-muted)]">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <StatGrid stats={roleStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-section-kicker">Novedades</p>
              <h3
                className="app-display-title mt-2 text-3xl font-semibold"
                data-display-font="true"
              >
                Lo que merece tu atención
              </h3>
            </div>
            <span className="app-chip">
              {newsUpdates.length} actualizaciones
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {newsUpdates.slice(0, 4).map((news, index) => (
              <article
                key={news.id}
                className={`rounded-[22px] border border-[var(--app-border)] p-5 shadow-[0_16px_36px_rgba(55,32,80,0.05)] ${
                  index === 0
                    ? "bg-[linear-gradient(135deg,rgba(80,40,94,0.96),rgba(109,60,128,0.9))] text-white"
                    : "bg-white/76 text-[var(--app-ink)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${
                      index === 0
                        ? "bg-white/12 text-white/80"
                        : "bg-[var(--app-chip)] text-[var(--app-muted)]"
                    }`}
                  >
                    {news.category}
                  </span>
                  <span
                    className={
                      index === 0
                        ? "text-xs text-white/68"
                        : "text-xs text-[var(--app-muted)]"
                    }
                  >
                    {news.date}
                  </span>
                </div>
                <h4
                  className={`mt-4 text-xl font-extrabold leading-tight ${index === 0 ? "text-white" : "text-[var(--app-ink)]"}`}
                >
                  {news.title}
                </h4>
                <p
                  className={`mt-3 text-sm leading-relaxed ${index === 0 ? "text-white/78" : "text-[var(--app-muted)]"}`}
                >
                  {news.summary}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Mensaje</p>
            <blockquote
              className="app-display-title mt-3 text-[2rem] font-semibold leading-tight"
              data-display-font="true"
            >
              “{quote?.text ?? "Sigue adelante."}”
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-[var(--app-muted)]">
              {quote?.author ?? "4Shine"}
            </p>
          </section>

          <section className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">En síntesis</p>
            <div className="mt-4 space-y-3">
              {executiveSummary.map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-[var(--app-border)] bg-white/74 px-4 py-3 text-sm text-[var(--app-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
