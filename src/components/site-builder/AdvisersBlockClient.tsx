'use client';

import React from 'react';
import { Briefcase, ChevronLeft, ChevronRight, Globe, Linkedin, MapPin, Twitter } from 'lucide-react';

interface PublicAdviser {
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

export interface AdvisersDisplayOptions {
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

function useAdvisers(): { advisers: PublicAdviser[] | null; failed: boolean } {
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

  return { advisers, failed };
}

function AdviserLinks({ adviser, options }: { adviser: PublicAdviser; options: AdvisersDisplayOptions }) {
  const links: { href: string; title: string; Icon: typeof Linkedin }[] = [];
  if (options.showLinkedIn && adviser.linkedinUrl) links.push({ href: adviser.linkedinUrl, title: 'LinkedIn', Icon: Linkedin });
  if (options.showWebsite && adviser.websiteUrl) links.push({ href: adviser.websiteUrl, title: 'Sitio web', Icon: Globe });
  if (options.showWebsite && adviser.twitterUrl) links.push({ href: adviser.twitterUrl, title: 'Twitter / X', Icon: Twitter });
  if (links.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-2">
      {links.map(({ href, title, Icon }) => (
        <a
          key={title}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${title} de ${adviser.name}`}
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

function AdviserPhoto({ adviser, options, size = 'h-24 w-24', textSize = 'text-3xl' }: { adviser: PublicAdviser; options: AdvisersDisplayOptions; size?: string; textSize?: string }) {
  if (adviser.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={adviser.photoUrl} alt={adviser.name} className={`${size} object-cover ${options.photoClass}`} />;
  }
  return (
    <div
      className={`flex ${size} items-center justify-center ${textSize} font-black text-white ${options.photoClass}`}
      style={{ background: 'var(--brand-primary)' }}
    >
      {adviser.initial}
    </div>
  );
}

function AdviserDetails({ adviser, options }: { adviser: PublicAdviser; options: AdvisersDisplayOptions }) {
  const role = adviser.profession || adviser.jobRole;
  const place = [adviser.location, adviser.country].filter(Boolean).join(', ');
  const experienceText = adviser.experience || '';
  return (
    <>
      {role && (
        <p className="mt-0.5 text-sm font-semibold" style={{ color: options.textColor }}>
          {role}
          {adviser.industry ? ` · ${adviser.industry}` : ''}
        </p>
      )}
      {options.showLocation && place && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: options.mutedColor }}>
          <MapPin size={12} />
          {place}
        </p>
      )}
      {options.showExperience && adviser.yearsExperience && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: options.mutedColor }}>
          <Briefcase size={12} />
          {adviser.yearsExperience} de experiencia
        </p>
      )}
      {options.showBio && (adviser.bio || experienceText) && (
        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed" style={{ color: options.mutedColor }}>
          {(() => {
            const text = adviser.bio || experienceText;
            return text.length > 240 ? `${text.slice(0, 240).trimEnd()}…` : text;
          })()}
        </p>
      )}
      {options.showTopics && adviser.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {adviser.topics.slice(0, 6).map((topic) => (
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

function AdviserProfile({ adviser, options }: { adviser: PublicAdviser; options: AdvisersDisplayOptions }) {
  return (
    <div className="flex flex-col items-start">
      <AdviserPhoto adviser={adviser} options={options} />
      <div className="mt-4 flex items-center gap-2">
        <p className="text-base font-black" style={{ color: options.headingColor }}>
          {adviser.name}
        </p>
        <AdviserLinks adviser={adviser} options={options} />
      </div>
      <AdviserDetails adviser={adviser} options={options} />
    </div>
  );
}

function AdviserCard({ adviser, options }: { adviser: PublicAdviser; options: AdvisersDisplayOptions }) {
  return (
    <div
      className="h-full rounded-3xl border p-6"
      style={{
        borderColor: options.isDark ? 'rgba(255,255,255,0.14)' : 'var(--brand-border)',
        background: options.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
      }}
    >
      <AdviserProfile adviser={adviser} options={options} />
    </div>
  );
}

/**
 * Grilla / tarjetas / acordeón / slider de perfiles públicos de advisers
 * activos. Carga los datos desde el endpoint público para reflejar siempre
 * los advisers vigentes, tanto en el sitio como en el preview del editor.
 */
export function AdvisersBlockClient(options: AdvisersDisplayOptions) {
  const { advisers, failed } = useAdvisers();
  const sliderRef = React.useRef<HTMLDivElement>(null);

  if (failed) return null;

  if (advisers === null) {
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

  let visible = advisers;
  if (options.mode === 'selected' && options.selectedIds.length > 0) {
    const byId = new Map(advisers.map((a) => [a.userId, a]));
    visible = options.selectedIds.map((id) => byId.get(id)).filter((a): a is PublicAdviser => Boolean(a));
  }
  if (options.limit > 0) visible = visible.slice(0, options.limit);

  if (visible.length === 0) {
    return (
      <p className="text-sm" style={{ color: options.mutedColor }}>
        Aún no hay advisers activos para mostrar.
      </p>
    );
  }

  if (options.layout === 'accordion') {
    return (
      <div className="space-y-3">
        {visible.map((adviser) => (
          <details
            key={adviser.userId}
            className="group rounded-2xl border px-5 py-4"
            style={{
              borderColor: options.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
              background: options.isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <AdviserPhoto adviser={adviser} options={options} size="h-12 w-12" textSize="text-lg" />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: options.headingColor }}>
                    {adviser.name}
                  </span>
                  <AdviserLinks adviser={adviser} options={options} />
                </span>
                {(adviser.profession || adviser.jobRole) && (
                  <span className="block truncate text-sm font-semibold" style={{ color: options.textColor }}>
                    {adviser.profession || adviser.jobRole}
                  </span>
                )}
              </span>
              <span className="text-xl transition group-open:rotate-45" style={{ color: 'var(--brand-accent-strong)' }}>
                +
              </span>
            </summary>
            <div className="pl-16 pt-2">
              <AdviserDetails adviser={adviser} options={{ ...options, showBio: true }} />
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
          {visible.map((adviser) => (
            <div key={adviser.userId} className="w-[300px] shrink-0 snap-start">
              <AdviserCard adviser={adviser} options={options} />
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
        {visible.map((adviser) => (
          <AdviserCard key={adviser.userId} adviser={adviser} options={options} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-10 ${options.columnsClass}`}>
      {visible.map((adviser) => (
        <AdviserProfile key={adviser.userId} adviser={adviser} options={options} />
      ))}
    </div>
  );
}
