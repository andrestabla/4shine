'use client';

import React from 'react';
import { Briefcase, ChevronLeft, ChevronRight, Globe, Linkedin, MapPin, Twitter } from 'lucide-react';

interface PublicAdvisor {
  userId: string;
  name: string;
  photoUrl: string;
  initial: string;
  profession: string;
  jobRole: string;
  industry: string;
  bio: string;
  location: string;
  country: string;
  yearsExperience: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  experience: string;
  topics: string[];
}

export interface AdvisorsDisplayOptions {
  layout: 'grid' | 'cards' | 'accordion' | 'slider';
  columnsClass: string;
  photoClass: string;
  mode: 'all' | 'selected';
  selectedIds: string[];
  limit: number;
  showBio: boolean;
  showLinkedIn: boolean;
  showLocation: boolean;
  showExperience: boolean;
  showTopics: boolean;
  showWebsite: boolean;
  headingColor: string;
  textColor: string;
  mutedColor: string;
  isDark: boolean;
}

function useAdvisors(): { advisors: PublicAdvisor[] | null; failed: boolean } {
  const [advisors, setAdvisors] = React.useState<PublicAdvisor[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/public/site/advisors', { cache: 'no-store' });
        const json = (await res.json()) as { ok: boolean; data?: PublicAdvisor[] };
        if (!cancelled) {
          if (json.ok && Array.isArray(json.data)) setAdvisors(json.data);
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

  return { advisors, failed };
}

function AdvisorLinks({ advisor, options }: { advisor: PublicAdvisor; options: AdvisorsDisplayOptions }) {
  const links: { href: string; title: string; Icon: typeof Linkedin }[] = [];
  if (options.showLinkedIn && advisor.linkedinUrl) links.push({ href: advisor.linkedinUrl, title: 'LinkedIn', Icon: Linkedin });
  if (options.showWebsite && advisor.websiteUrl) links.push({ href: advisor.websiteUrl, title: 'Sitio web', Icon: Globe });
  if (options.showWebsite && advisor.twitterUrl) links.push({ href: advisor.twitterUrl, title: 'Twitter / X', Icon: Twitter });
  if (links.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-2">
      {links.map(({ href, title, Icon }) => (
        <a
          key={title}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${title} de ${advisor.name}`}
          className="transition hover:opacity-70"
          style={{ color: 'var(--brand-accent-strong)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon size={15} />
        </a>
      ))}
    </span>
  );
}

function AdvisorPhoto({ advisor, options, size = 'h-24 w-24', textSize = 'text-3xl' }: { advisor: PublicAdvisor; options: AdvisorsDisplayOptions; size?: string; textSize?: string }) {
  if (advisor.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={advisor.photoUrl} alt={advisor.name} className={`${size} object-cover ${options.photoClass}`} />;
  }
  return (
    <div
      className={`flex ${size} items-center justify-center ${textSize} font-black text-white ${options.photoClass}`}
      style={{ background: 'var(--brand-primary)' }}
    >
      {advisor.initial}
    </div>
  );
}

function AdvisorDetails({ advisor, options }: { advisor: PublicAdvisor; options: AdvisorsDisplayOptions }) {
  const role = advisor.profession || advisor.jobRole;
  const place = [advisor.location, advisor.country].filter(Boolean).join(', ');
  const experienceText = advisor.experience || '';
  return (
    <>
      {role && (
        <p className="mt-0.5 text-sm font-semibold" style={{ color: options.textColor }}>
          {role}
          {advisor.industry ? ` · ${advisor.industry}` : ''}
        </p>
      )}
      {options.showLocation && place && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: options.mutedColor }}>
          <MapPin size={12} />
          {place}
        </p>
      )}
      {options.showExperience && advisor.yearsExperience && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: options.mutedColor }}>
          <Briefcase size={12} />
          {advisor.yearsExperience} de experiencia
        </p>
      )}
      {options.showBio && (advisor.bio || experienceText) && (
        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed" style={{ color: options.mutedColor }}>
          {(() => {
            const text = advisor.bio || experienceText;
            return text.length > 240 ? `${text.slice(0, 240).trimEnd()}…` : text;
          })()}
        </p>
      )}
      {options.showTopics && advisor.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {advisor.topics.slice(0, 6).map((topic) => (
            <span
              key={topic}
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                borderColor: 'color-mix(in srgb, var(--brand-accent) 45%, transparent)',
                color: options.isDark ? 'var(--brand-accent-soft)' : 'var(--brand-accent-strong)',
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function AdvisorProfile({ advisor, options }: { advisor: PublicAdvisor; options: AdvisorsDisplayOptions }) {
  return (
    <div className="flex flex-col items-start">
      <AdvisorPhoto advisor={advisor} options={options} />
      <div className="mt-4 flex items-center gap-2">
        <p className="text-base font-black" style={{ color: options.headingColor }}>
          {advisor.name}
        </p>
        <AdvisorLinks advisor={advisor} options={options} />
      </div>
      <AdvisorDetails advisor={advisor} options={options} />
    </div>
  );
}

function AdvisorCard({ advisor, options }: { advisor: PublicAdvisor; options: AdvisorsDisplayOptions }) {
  return (
    <div
      className="h-full rounded-3xl border p-6"
      style={{
        borderColor: options.isDark ? 'rgba(255,255,255,0.14)' : 'var(--brand-border)',
        background: options.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
      }}
    >
      <AdvisorProfile advisor={advisor} options={options} />
    </div>
  );
}

/**
 * Grilla / tarjetas / acordeón / slider de perfiles públicos de advisors
 * activos. Carga los datos desde el endpoint público para reflejar siempre
 * los advisors vigentes, tanto en el sitio como en el preview del editor.
 */
export function AdvisorsBlockClient(options: AdvisorsDisplayOptions) {
  const { advisors, failed } = useAdvisors();
  const sliderRef = React.useRef<HTMLDivElement>(null);

  if (failed) return null;

  if (advisors === null) {
    return (
      <div className={`grid gap-10 ${options.columnsClass}`} aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className={`h-24 w-24 ${options.photoClass}`} style={{ background: options.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)' }} />
            <div className="mt-4 h-4 w-32 rounded" style={{ background: options.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)' }} />
            <div className="mt-2 h-3 w-24 rounded" style={{ background: options.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,27,42,0.05)' }} />
          </div>
        ))}
      </div>
    );
  }

  let visible = advisors;
  if (options.mode === 'selected' && options.selectedIds.length > 0) {
    const byId = new Map(advisors.map((a) => [a.userId, a]));
    visible = options.selectedIds.map((id) => byId.get(id)).filter((a): a is PublicAdvisor => Boolean(a));
  }
  if (options.limit > 0) visible = visible.slice(0, options.limit);

  if (visible.length === 0) {
    return (
      <p className="text-sm" style={{ color: options.mutedColor }}>
        Aún no hay advisors activos para mostrar.
      </p>
    );
  }

  if (options.layout === 'accordion') {
    return (
      <div className="space-y-3">
        {visible.map((advisor) => (
          <details
            key={advisor.userId}
            className="group rounded-2xl border px-5 py-4"
            style={{
              borderColor: options.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
              background: options.isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <AdvisorPhoto advisor={advisor} options={options} size="h-12 w-12" textSize="text-lg" />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: options.headingColor }}>
                    {advisor.name}
                  </span>
                  <AdvisorLinks advisor={advisor} options={options} />
                </span>
                {(advisor.profession || advisor.jobRole) && (
                  <span className="block truncate text-sm font-semibold" style={{ color: options.textColor }}>
                    {advisor.profession || advisor.jobRole}
                  </span>
                )}
              </span>
              <span className="text-xl transition group-open:rotate-45" style={{ color: 'var(--brand-accent-strong)' }}>
                +
              </span>
            </summary>
            <div className="pl-16 pt-2">
              <AdvisorDetails advisor={advisor} options={{ ...options, showBio: true }} />
            </div>
          </details>
        ))}
      </div>
    );
  }

  if (options.layout === 'slider') {
    const scrollBy = (direction: number) => {
      const el = sliderRef.current;
      if (el) el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.7), behavior: 'smooth' });
    };
    return (
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {visible.map((advisor) => (
            <div key={advisor.userId} className="w-[300px] shrink-0 snap-start">
              <AdvisorCard advisor={advisor} options={options} />
            </div>
          ))}
        </div>
        {visible.length > 2 && (
          <div className="mt-2 flex justify-end gap-2">
            {[
              { dir: -1, Icon: ChevronLeft, label: 'Anterior' },
              { dir: 1, Icon: ChevronRight, label: 'Siguiente' },
            ].map(({ dir, Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => scrollBy(dir)}
                className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:opacity-80"
                style={{
                  borderColor: options.isDark ? 'rgba(255,255,255,0.3)' : 'var(--brand-border-strong)',
                  color: options.headingColor,
                }}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (options.layout === 'cards') {
    return (
      <div className={`grid gap-6 ${options.columnsClass}`}>
        {visible.map((advisor) => (
          <AdvisorCard key={advisor.userId} advisor={advisor} options={options} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-10 ${options.columnsClass}`}>
      {visible.map((advisor) => (
        <AdvisorProfile key={advisor.userId} advisor={advisor} options={options} />
      ))}
    </div>
  );
}
