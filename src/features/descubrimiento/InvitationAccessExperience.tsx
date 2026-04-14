"use client";

import React from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { ResultsView } from "./ResultsView";
import {
  getInvitationPublicInfo,
  verifyInvitationAccess,
} from "./client";

interface InvitationAccessExperienceProps {
  inviteToken: string;
}

export function InvitationAccessExperience({
  inviteToken,
}: InvitationAccessExperienceProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [accessCode, setAccessCode] = React.useState("");
  const [maskedEmail, setMaskedEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Awaited<
    ReturnType<typeof verifyInvitationAccess>
  >["session"] | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const info = await getInvitationPublicInfo(inviteToken);
        if (!active) return;
        setMaskedEmail(info.invitedEmailMasked);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la invitacion.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [inviteToken]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessCode.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await verifyInvitationAccess({
        inviteToken,
        accessCode: accessCode.trim().toUpperCase(),
      });
      setSession(response.session);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Codigo invalido. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-8 md:px-6">
        <ResultsView
          state={{
            name: `${session.firstName} ${session.lastName}`.trim(),
            answers: session.answers,
            currentIdx: session.currentIdx,
            status: "results",
            profile: {
              firstName: session.firstName,
              lastName: session.lastName,
              country: session.country,
              jobRole: session.jobRole,
              age: session.age,
              yearsExperience: session.yearsExperience,
            },
            profileCompleted: session.profileCompleted,
          }}
          publicId={session.publicId}
          isPublic={true}
          embedded={false}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-6">
      <section className="w-full rounded-[24px] border border-[var(--app-border)] bg-white p-6 shadow-[0_20px_40px_rgba(20,17,33,0.08)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-muted)]">
          Diagnostico 4Shine
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--app-ink)]">
          Acceso con codigo unico
        </h1>
        <p className="mt-3 text-sm text-[var(--app-muted)]">
          Ingresa el codigo recibido por correo para acceder a la lectura
          ejecutiva del diagnostico.
        </p>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" />
            Cargando invitacion...
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--app-muted)]">
                Invitacion para
              </p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                <Mail size={14} />
                {maskedEmail || "Correo protegido"}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--app-ink)]">
                Codigo de acceso
              </span>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(event.target.value.toUpperCase())
                  }
                  placeholder="Ejemplo: 7KF2M9QP"
                  className="h-11 w-full rounded-[12px] border border-[var(--app-border)] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(79,35,96,0.12)]"
                />
              </div>
            </label>

            {error && (
              <p className="text-sm font-medium text-rose-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !accessCode.trim()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-6 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Validando..." : "Ingresar al diagnostico"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
