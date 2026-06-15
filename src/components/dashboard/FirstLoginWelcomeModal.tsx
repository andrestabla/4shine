"use client";

import React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

interface Props {
  role: string | null;
  name: string;
  onStartTour: () => void;
  onSkip: () => void;
}

function roleCopy(role: string | null): { kicker: string; body: string } {
  switch (role) {
    case "mentor":
      return {
        kicker: "Bienvenido, Adviser",
        body: "Acompañas a líderes con método y contexto. Te mostramos en un recorrido rápido dónde está cada cosa para empezar con foco.",
      };
    case "gestor":
      return {
        kicker: "Bienvenido, Gestor",
        body: "Orquestas el programa de principio a fin. Demos un recorrido por el panel para que tomes el control desde ya.",
      };
    case "admin":
      return {
        kicker: "Bienvenido, Administrador",
        body: "Tienes el control central de la plataforma. Te mostramos los accesos clave en un recorrido breve.",
      };
    case "invitado":
      return {
        kicker: "Bienvenido",
        body: "Tu primer paso es el diagnóstico de Descubrimiento. Te guiamos para que lo completes y conozcas tu perfil de liderazgo.",
      };
    case "lider":
    default:
      return {
        kicker: "Bienvenido, Líder",
        body: "Tu ruta de liderazgo empieza aquí: diagnóstico, trayectoria, mentorías y networking en un solo lugar. Hagamos un recorrido rápido para que sepas por dónde empezar.",
      };
  }
}

export default function FirstLoginWelcomeModal({ role, name, onStartTour, onSkip }: Props) {
  const firstName = name?.split(" ")[0] || name || "";
  const { kicker, body } = roleCopy(role);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(22,10,38,0.6)] p-4 backdrop-blur-sm">
      <div className="relative w-[min(94vw,500px)] overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-white shadow-2xl">
        <button
          type="button"
          onClick={onSkip}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <div
          className="px-6 py-7 text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 65%, var(--brand-accent)) 100%)",
          }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} />
            {kicker}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            {firstName ? `¡Hola, ${firstName}!` : "¡Te damos la bienvenida!"}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm leading-relaxed text-[var(--app-ink)]/85">{body}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onSkip} className="app-button-secondary">
              Ahora no
            </button>
            <button type="button" onClick={onStartTour} className="app-button-primary inline-flex items-center justify-center gap-1.5">
              Comenzar recorrido
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
