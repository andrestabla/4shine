import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { CSSProperties, ReactNode } from 'react';
import type { SiteBlock, SiteBlockProps } from '@/features/site-builder/types';

type Background = 'dark' | 'darker' | 'light' | 'surface';

interface Palette {
  sectionStyle: CSSProperties;
  isDark: boolean;
  headingColor: string;
  textColor: string;
  mutedColor: string;
}

function getPalette(background: unknown): Palette {
  const bg: Background = background === 'darker' || background === 'light' || background === 'surface' ? background : 'dark';
  switch (bg) {
    case 'darker':
      return {
        sectionStyle: { background: 'var(--brand-darker)' },
        isDark: true,
        headingColor: '#ffffff',
        textColor: 'rgba(255,255,255,0.85)',
        mutedColor: 'rgba(255,255,255,0.6)',
      };
    case 'light':
      return {
        sectionStyle: { background: '#ffffff' },
        isDark: false,
        headingColor: 'var(--brand-primary)',
        textColor: 'var(--brand-ink-soft)',
        mutedColor: 'var(--brand-ink-muted)',
      };
    case 'surface':
      return {
        sectionStyle: { background: 'var(--brand-surface)' },
        isDark: false,
        headingColor: 'var(--brand-primary)',
        textColor: 'var(--brand-ink-soft)',
        mutedColor: 'var(--brand-ink-muted)',
      };
    default:
      return {
        sectionStyle: { background: 'var(--brand-dark)' },
        isDark: true,
        headingColor: '#ffffff',
        textColor: 'rgba(255,255,255,0.85)',
        mutedColor: 'rgba(255,255,255,0.6)',
      };
  }
}

function str(props: SiteBlockProps, key: string): string {
  const value = props[key];
  return typeof value === 'string' ? value : '';
}

function bool(props: SiteBlockProps, key: string): boolean {
  return props[key] === true;
}

function num(props: SiteBlockProps, key: string, fallback: number): number {
  const value = props[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function items(props: SiteBlockProps, key = 'items'): SiteBlockProps[] {
  const value = props[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SiteBlockProps => !!item && typeof item === 'object');
}

function Container({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto w-full px-6 md:px-10 lg:px-14 ${narrow ? 'max-w-[900px]' : 'max-w-[1240px]'}`}>
      {children}
    </div>
  );
}

function Markdown({ text, color }: { text: string; color: string }) {
  if (!text.trim()) return null;
  return (
    <div className="site-md space-y-4 text-base leading-relaxed md:text-lg" style={{ color }}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

function ActionButtons({
  props,
  palette,
  center,
}: {
  props: SiteBlockProps;
  palette: Palette;
  center: boolean;
}) {
  const primaryLabel = str(props, 'primaryLabel');
  const primaryHref = str(props, 'primaryHref') || '#';
  const secondaryLabel = str(props, 'secondaryLabel');
  const secondaryHref = str(props, 'secondaryHref') || '#';
  if (!primaryLabel && !secondaryLabel) return null;

  return (
    <div className={`mt-9 flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
      {primaryLabel && (
        <Link
          href={primaryHref}
          className="rounded-full px-7 py-3 text-sm font-black transition hover:opacity-90"
          style={
            palette.isDark
              ? { background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }
              : { background: 'var(--brand-primary)', color: 'white' }
          }
        >
          {primaryLabel}
        </Link>
      )}
      {secondaryLabel && (
        <Link
          href={secondaryHref}
          className="rounded-full border px-7 py-3 text-sm font-bold transition hover:opacity-80"
          style={
            palette.isDark
              ? { borderColor: 'rgba(255,255,255,0.4)', color: 'white' }
              : { borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }
          }
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────── Blocks ─────────────────────────── */

function HeroBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'dark');
  const center = str(props, 'align') === 'center';
  const compact = bool(props, 'compact');
  const videoUrl = str(props, 'backgroundVideoUrl');
  const imageUrl = str(props, 'backgroundImageUrl');
  const hasMedia = Boolean(videoUrl || imageUrl);

  return (
    <section className="relative overflow-hidden" style={palette.sectionStyle}>
      {videoUrl ? (
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      ) : null}
      {hasMedia && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, color-mix(in srgb, var(--brand-primary) 92%, black) 10%, color-mix(in srgb, var(--brand-primary) 72%, black) 60%, color-mix(in srgb, var(--brand-primary) 55%, black) 100%)',
            opacity: 0.92,
          }}
        />
      )}
      <Container>
        <div
          className={`relative flex flex-col ${center ? 'items-center text-center' : 'items-start'} ${
            compact ? 'py-16' : 'py-24 md:py-32'
          }`}
        >
          {str(props, 'kicker') && (
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em]" style={{ color: 'var(--brand-accent-soft)' }}>
              {str(props, 'kicker')}
            </p>
          )}
          <h1
            className={`max-w-[16ch] text-5xl font-black leading-[0.95] tracking-tight md:text-6xl ${compact ? '' : 'lg:text-7xl'}`}
            style={{ color: hasMedia ? '#ffffff' : palette.headingColor }}
          >
            {str(props, 'title')}
          </h1>
          {str(props, 'subtitle') && (
            <p
              className="mt-6 max-w-[54ch] text-base leading-relaxed md:text-lg"
              style={{ color: hasMedia ? 'rgba(255,255,255,0.85)' : palette.textColor }}
            >
              {str(props, 'subtitle')}
            </p>
          )}
          <ActionButtons props={props} palette={hasMedia ? getPalette('dark') : palette} center={center} />
        </div>
      </Container>
    </section>
  );
}

function StatsBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'darker');
  const list = items(props);
  if (list.length === 0) return null;
  return (
    <section style={palette.sectionStyle}>
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {list.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center px-6 py-10 text-center ${
                i < list.length - 1 ? 'md:border-r' : ''
              }`}
              style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.1)' : 'var(--brand-border)' }}
            >
              <span className="text-4xl font-black md:text-5xl" style={{ color: 'var(--brand-accent)' }}>
                {typeof item.value === 'string' ? item.value : ''}
              </span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: palette.mutedColor }}>
                {typeof item.label === 'string' ? item.label : ''}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function RichTextBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  const center = str(props, 'align') === 'center';
  return (
    <section style={palette.sectionStyle}>
      <Container narrow>
        <div className={`py-20 ${center ? 'text-center' : ''}`}>
          {str(props, 'kicker') && (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>
              {str(props, 'kicker')}
            </p>
          )}
          {str(props, 'title') && (
            <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
              {str(props, 'title')}
            </h2>
          )}
          <div className={`mt-6 ${center ? 'mx-auto max-w-[60ch]' : 'max-w-[68ch]'}`}>
            <Markdown text={str(props, 'body')} color={palette.textColor} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ImageTextBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  const imageLeft = str(props, 'imageSide') === 'left';
  const imageUrl = str(props, 'imageUrl');
  return (
    <section style={palette.sectionStyle}>
      <Container>
        <div className="grid items-center gap-16 py-20 lg:grid-cols-2">
          <div className={imageLeft ? 'lg:order-2' : ''}>
            <h2 className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
              {str(props, 'title')}
            </h2>
            <div className="mt-6 max-w-[52ch]">
              <Markdown text={str(props, 'body')} color={palette.textColor} />
            </div>
            {str(props, 'buttonLabel') && (
              <Link
                href={str(props, 'buttonHref') || '#'}
                className="mt-8 inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold transition hover:opacity-80"
                style={
                  palette.isDark
                    ? { borderColor: 'var(--brand-accent)', color: 'var(--brand-accent)' }
                    : { borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }
                }
              >
                {str(props, 'buttonLabel')} →
              </Link>
            )}
          </div>
          {imageUrl ? (
            <div className={`relative overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] ${imageLeft ? 'lg:order-1' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={str(props, 'title')} className="h-full w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
          ) : (
            <div
              className={`flex items-center justify-center rounded-3xl border border-dashed ${imageLeft ? 'lg:order-1' : ''}`}
              style={{ aspectRatio: '4/3', borderColor: palette.isDark ? 'rgba(255,255,255,0.25)' : 'var(--brand-border-strong)', color: palette.mutedColor }}
            >
              <span className="text-sm">Agrega una imagen</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function CardsBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  const list = items(props);
  const columns = str(props, 'columns') === '2' ? 2 : str(props, 'columns') === '3' ? 3 : 4;
  const outline = str(props, 'style') === 'outline';
  const gridCols = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section style={palette.sectionStyle}>
      <Container>
        <div className="py-20">
          {(str(props, 'kicker') || str(props, 'title') || str(props, 'subtitle')) && (
            <div className="mb-14">
              {str(props, 'kicker') && (
                <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>
                  {str(props, 'kicker')}
                </p>
              )}
              {str(props, 'title') && (
                <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
                  {str(props, 'title')}
                </h2>
              )}
              {str(props, 'subtitle') && (
                <p className="mt-4 max-w-[52ch] text-base md:text-lg" style={{ color: palette.textColor }}>
                  {str(props, 'subtitle')}
                </p>
              )}
            </div>
          )}
          <div className={`grid gap-5 ${gridCols}`}>
            {list.map((item, i) => {
              const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-primary)';
              return outline ? (
                <article
                  key={i}
                  className="rounded-3xl border p-7 transition duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: palette.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
                    background: palette.isDark ? 'rgba(255,255,255,0.06)' : 'white',
                  }}
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <h3 className="mt-4 text-lg font-black tracking-tight" style={{ color: palette.headingColor }}>
                    {typeof item.title === 'string' ? item.title : ''}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-snug" style={{ color: palette.textColor }}>
                    {typeof item.description === 'string' ? item.description : ''}
                  </p>
                  {typeof item.detail === 'string' && item.detail && (
                    <p className="mt-3 text-[13px] leading-relaxed" style={{ color: palette.mutedColor }}>
                      {item.detail}
                    </p>
                  )}
                </article>
              ) : (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-3xl p-7 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,0,0,0.22)]"
                  style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, white))` }}
                >
                  <span className="pointer-events-none absolute -right-3 -top-5 select-none text-[8.5rem] font-black leading-none text-white/[0.07]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-5 text-lg font-black tracking-tight">{typeof item.title === 'string' ? item.title : ''}</h3>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/80">
                    {typeof item.description === 'string' ? item.description : ''}
                  </p>
                  {typeof item.detail === 'string' && item.detail && (
                    <p className="mt-3 text-[13px] leading-relaxed text-white/60">{item.detail}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

function TestimonialsBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'dark');
  const list = items(props);
  return (
    <section style={palette.sectionStyle}>
      <Container>
        <div className="py-20">
          {str(props, 'title') && (
            <h2 className="mb-14 max-w-[22ch] text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
              {str(props, 'title')}
            </h2>
          )}
          <div className="grid gap-10 md:grid-cols-3">
            {list.map((item, i) => {
              const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-accent)';
              const name = typeof item.name === 'string' ? item.name : '';
              return (
                <div key={i} className="border-l-2 pl-6" style={{ borderColor: color }}>
                  <p className="text-[15px] leading-relaxed" style={{ color: palette.textColor }}>
                    {typeof item.text === 'string' ? item.text : ''}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ background: color }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black" style={{ color: palette.headingColor }}>{name}</p>
                      <p className="text-xs" style={{ color: palette.mutedColor }}>
                        {typeof item.role === 'string' ? item.role : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

function PricingBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'surface');
  const list = items(props);
  const cols = list.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : list.length === 2 ? 'sm:grid-cols-2' : '';
  return (
    <section style={palette.sectionStyle}>
      <Container>
        <div className="py-20">
          <div className="mb-14 text-center">
            {str(props, 'kicker') && (
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>
                {str(props, 'kicker')}
              </p>
            )}
            {str(props, 'title') && (
              <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
                {str(props, 'title')}
              </h2>
            )}
            {str(props, 'subtitle') && (
              <p className="mx-auto mt-4 max-w-[52ch] text-base" style={{ color: palette.textColor }}>
                {str(props, 'subtitle')}
              </p>
            )}
          </div>
          <div className={`mx-auto grid max-w-[1100px] gap-6 ${cols}`}>
            {list.map((item, i) => {
              const highlighted = item.highlighted === true;
              const features =
                typeof item.features === 'string'
                  ? item.features.split('\n').map((f) => f.trim()).filter(Boolean)
                  : [];
              return (
                <article
                  key={i}
                  className="relative flex flex-col overflow-hidden rounded-3xl border"
                  style={
                    highlighted
                      ? { background: 'var(--brand-dark)', color: 'white', borderColor: 'var(--brand-primary)', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }
                      : { background: 'white', color: 'var(--brand-ink)', borderColor: 'var(--brand-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }
                  }
                >
                  {highlighted && (
                    <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(to right, var(--brand-accent), var(--brand-accent-strong))' }} />
                  )}
                  <div className="p-8">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {typeof item.label === 'string' && item.label && (
                          <span
                            className="rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider"
                            style={
                              highlighted
                                ? { background: 'color-mix(in srgb, var(--brand-accent) 20%, transparent)', color: 'var(--brand-accent)' }
                                : { background: 'var(--brand-surface-strong)', color: 'var(--brand-primary)' }
                            }
                          >
                            {item.label}
                          </span>
                        )}
                        <h3 className="mt-3 text-xl font-black">{typeof item.name === 'string' ? item.name : ''}</h3>
                      </div>
                      <div className="shrink-0 text-right">
                        {typeof item.currency === 'string' && item.currency && (
                          <span className="text-xs font-bold" style={{ color: highlighted ? 'rgba(255,255,255,0.65)' : 'var(--brand-primary)' }}>
                            {item.currency}
                          </span>
                        )}
                        <p className="text-3xl font-black leading-none" style={{ color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }}>
                          {typeof item.price === 'string' ? item.price : ''}
                        </p>
                      </div>
                    </div>
                    {typeof item.description === 'string' && item.description && (
                      <p className="mt-4 text-sm leading-relaxed" style={{ color: highlighted ? 'rgba(255,255,255,0.8)' : 'var(--brand-ink-soft)' }}>
                        {item.description}
                      </p>
                    )}
                    {features.length > 0 && (
                      <ul className="mt-6 space-y-2.5">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm">
                            <svg className="mt-0.5 shrink-0" style={{ color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ color: highlighted ? 'rgba(255,255,255,0.85)' : 'var(--brand-ink-soft)' }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {typeof item.ctaLabel === 'string' && item.ctaLabel && (
                    <div className="mt-auto px-8 pb-8">
                      <Link
                        href={typeof item.ctaHref === 'string' && item.ctaHref ? item.ctaHref : '#'}
                        className="block w-full rounded-full py-3 text-center text-sm font-extrabold transition hover:opacity-90"
                        style={
                          highlighted
                            ? { background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }
                            : { border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', background: 'transparent' }
                        }
                      >
                        {item.ctaLabel}
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FaqBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  const list = items(props);
  return (
    <section style={palette.sectionStyle}>
      <Container narrow>
        <div className="py-20">
          {str(props, 'title') && (
            <h2 className="mb-10 text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
              {str(props, 'title')}
            </h2>
          )}
          <div className="space-y-3">
            {list.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border px-6 py-4"
                style={{
                  borderColor: palette.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
                  background: palette.isDark ? 'rgba(255,255,255,0.05)' : 'white',
                }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold" style={{ color: palette.headingColor }}>
                  {typeof item.question === 'string' ? item.question : ''}
                  <span className="text-xl transition group-open:rotate-45" style={{ color: 'var(--brand-accent-strong)' }}>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: palette.textColor }}>
                  {typeof item.answer === 'string' ? item.answer : ''}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function CtaBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'dark');
  return (
    <section style={palette.sectionStyle}>
      <Container narrow>
        <div className="py-24 text-center">
          <h2 className="mx-auto max-w-[24ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
            {str(props, 'title')}
          </h2>
          {str(props, 'body') && (
            <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed md:text-lg" style={{ color: palette.textColor }}>
              {str(props, 'body')}
            </p>
          )}
          <ActionButtons props={props} palette={palette} center />
        </div>
      </Container>
    </section>
  );
}

function getEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (url.hostname.includes('vimeo.com')) {
      return `https://player.vimeo.com/video${url.pathname}`;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'surface');
  const videoUrl = str(props, 'videoUrl');
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  return (
    <section style={palette.sectionStyle}>
      <Container narrow>
        <div className="py-20">
          {str(props, 'title') && (
            <h2 className="mb-12 text-center text-4xl font-black tracking-tight md:text-5xl" style={{ color: palette.headingColor }}>
              {str(props, 'title')}
            </h2>
          )}
          <div className="relative overflow-hidden rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.22)]" style={{ background: 'var(--brand-dark)' }}>
            {embedUrl ? (
              <iframe src={embedUrl} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={str(props, 'title') || 'Video'} />
            ) : videoUrl ? (
              <video className="aspect-video w-full" controls preload="metadata">
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <p className="text-sm text-white/40">Agrega la URL de un video</p>
              </div>
            )}
          </div>
          {str(props, 'caption') && (
            <p className="mt-4 text-center text-sm" style={{ color: palette.mutedColor }}>
              {str(props, 'caption')}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}

function ImageBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  const imageUrl = str(props, 'imageUrl');
  const fullWidth = bool(props, 'fullWidth');
  const image = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={str(props, 'caption')} className={`w-full object-cover ${fullWidth ? '' : 'rounded-3xl'}`} />
  ) : (
    <div
      className="flex items-center justify-center rounded-3xl border border-dashed py-24"
      style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.25)' : 'var(--brand-border-strong)', color: palette.mutedColor }}
    >
      <span className="text-sm">Agrega una imagen</span>
    </div>
  );
  return (
    <section style={palette.sectionStyle}>
      {fullWidth ? (
        image
      ) : (
        <Container>
          <div className="py-14">{image}</div>
        </Container>
      )}
      {str(props, 'caption') && (
        <Container>
          <p className="pb-10 pt-3 text-center text-sm" style={{ color: palette.mutedColor }}>
            {str(props, 'caption')}
          </p>
        </Container>
      )}
    </section>
  );
}

function HtmlBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  return (
    <section style={palette.sectionStyle}>
      <div dangerouslySetInnerHTML={{ __html: str(props, 'html') }} />
    </section>
  );
}

function SpacerBlock({ props }: { props: SiteBlockProps }) {
  const palette = getPalette(str(props, 'background') || 'light');
  return <div style={{ ...palette.sectionStyle, height: `${num(props, 'height', 64)}px` }} aria-hidden="true" />;
}

/* ─────────────────────────── Renderer ─────────────────────────── */

export function SiteBlockView({ block }: { block: SiteBlock }) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock props={block.props} />;
    case 'stats':
      return <StatsBlock props={block.props} />;
    case 'richText':
      return <RichTextBlock props={block.props} />;
    case 'imageText':
      return <ImageTextBlock props={block.props} />;
    case 'cards':
      return <CardsBlock props={block.props} />;
    case 'testimonials':
      return <TestimonialsBlock props={block.props} />;
    case 'pricing':
      return <PricingBlock props={block.props} />;
    case 'faq':
      return <FaqBlock props={block.props} />;
    case 'cta':
      return <CtaBlock props={block.props} />;
    case 'video':
      return <VideoBlock props={block.props} />;
    case 'image':
      return <ImageBlock props={block.props} />;
    case 'html':
      return <HtmlBlock props={block.props} />;
    case 'spacer':
      return <SpacerBlock props={block.props} />;
    default:
      return null;
  }
}

export function BlockRenderer({ sections }: { sections: SiteBlock[] }) {
  return (
    <>
      {sections
        .filter((block) => block.isVisible !== false)
        .map((block) => (
          <SiteBlockView key={block.blockId} block={block} />
        ))}
    </>
  );
}
