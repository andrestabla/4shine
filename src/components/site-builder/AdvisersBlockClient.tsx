'use client';

import React from 'react';
import { Linkedin } from 'lucide-react';

interface PublicAdviser {
  userId: string;
  name: string;
  photoUrl: string;
  initial: string;
  profession: string;
  jobRole: string;
  bio: string;
  linkedinUrl: string;
}

interface AdvisersBlockClientProps {
  columnsClass: string;
  photoClass: string;
  showBio: boolean;
  showLinkedIn: boolean;
  limit: number;
  headingColor: string;
  textColor: string;
  mutedColor: string;
  isDark: boolean;
}

/**
 * Grilla de perfiles públicos de advisers activos. Carga los datos desde el
 * endpoint público para que el bloque siempre refleje los advisers vigentes,
 * tanto en el sitio como en la vista previa del editor.
 */
export function AdvisersBlockClient({
  columnsClass,
  photoClass,
  showBio,
  showLinkedIn,
  limit,
  headingColor,
  textColor,
  mutedColor,
  isDark,
}: AdvisersBlockClientProps) {
  const [advisers, setAdvisers] = React.useState<PublicAdviser[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/public/site/advisers', { cache: 'no-store' });
        const json = (await res.json()) as { ok: boolean; data?: PublicAdviser[] };
        if (!cancelled) {
          if (json.ok && Array.isArray(json.data)) setAdvisers(json.data);
          else setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (advisers === null) {
    return (
      <div className={`grid gap-10 ${columnsClass}`} aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className={`h-24 w-24 ${photoClass}`} style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)' }} />
            <div className="mt-4 h-4 w-32 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)' }} />
            <div className="mt-2 h-3 w-24 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,27,42,0.05)' }} />
          </div>
        ))}
      </div>
    );
  }

  const visible = advisers.slice(0, limit > 0 ? limit : advisers.length);

  if (visible.length === 0) {
    return (
      <p className="text-sm" style={{ color: mutedColor }}>
        Aún no hay advisers activos para mostrar.
      </p>
    );
  }

  return (
    <div className={`grid gap-10 ${columnsClass}`}>
      {visible.map((adviser) => {
        const role = adviser.profession || adviser.jobRole;
        return (
          <div key={adviser.userId} className="flex flex-col items-start">
            {adviser.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adviser.photoUrl} alt={adviser.name} className={`h-24 w-24 object-cover ${photoClass}`} />
            ) : (
              <div
                className={`flex h-24 w-24 items-center justify-center text-3xl font-black text-white ${photoClass}`}
                style={{ background: 'var(--brand-primary)' }}
              >
                {adviser.initial}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <p className="text-base font-black" style={{ color: headingColor }}>
                {adviser.name}
              </p>
              {showLinkedIn && adviser.linkedinUrl && (
                <a
                  href={adviser.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`LinkedIn de ${adviser.name}`}
                  className="transition hover:opacity-70"
                  style={{ color: 'var(--brand-accent-strong)' }}
                >
                  <Linkedin size={15} />
                </a>
              )}
            </div>
            {role && (
              <p className="mt-0.5 text-sm font-semibold" style={{ color: textColor }}>
                {role}
              </p>
            )}
            {showBio && adviser.bio && (
              <p className="mt-2 max-w-[42ch] text-sm leading-relaxed" style={{ color: mutedColor }}>
                {adviser.bio.length > 220 ? `${adviser.bio.slice(0, 220).trimEnd()}…` : adviser.bio}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
