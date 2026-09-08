'use client';

import React from 'react';
import { Share2, Link2, Check, Lock } from 'lucide-react';
import type { CommunityPostRecord } from '@/features/networking/client';
import { buildPostShareLinks, buildWhatsAppShareUrl } from '@/features/networking/share';

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  // lucide no trae la marca de WhatsApp; glifo mínimo para no cargar otra librería.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35a9.9 9.9 0 0 0 4.88 1.25h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.9 9.9 0 0 0 12.04 2Zm0 1.82c2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.38 5.75c0 4.5-3.65 8.14-8.14 8.14a8.2 8.2 0 0 1-4.15-1.14l-.3-.18-3.07.8.82-2.99-.19-.31a8.1 8.1 0 0 1-1.25-4.32c0-4.49 3.65-8.14 8.14-8.14Zm-2.6 4.3c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66 0 .98.71 1.92.81 2.06.1.13 1.39 2.22 3.42 3.02 1.7.67 2.05.54 2.42.5.37-.03 1.2-.49 1.37-.96.17-.47.17-.88.12-.96-.05-.08-.18-.13-.38-.23-.2-.1-1.2-.59-1.38-.66-.18-.07-.32-.1-.45.1-.13.2-.52.65-.64.79-.12.13-.23.15-.43.05-.2-.1-.85-.31-1.62-1-.6-.53-1-1.19-1.12-1.39-.12-.2-.01-.3.09-.4.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.06-.13.03-.25-.02-.35-.05-.1-.45-1.09-.62-1.49-.16-.39-.33-.34-.45-.34h-.39Z" />
    </svg>
  );
}

/**
 * Menú "Compartir" de una publicación.
 *
 * Ofrece el enlace público cuando la comunidad es abierta y el enlace interno
 * (dashboard) siempre. En comunidades cerradas solo hay enlace interno y se
 * dice explícitamente que el receptor necesita sesión y membresía.
 */
export function PostShareMenu({
  post,
  onNotify,
}: {
  post: CommunityPostRecord;
  onNotify: (message: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState<'public' | 'internal' | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const links = React.useMemo(() => buildPostShareLinks(post), [post]);

  const copy = async (url: string, which: 'public' | 'internal') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
      onNotify('Enlace copiado al portapapeles.');
    } catch {
      onNotify('No se pudo copiar el enlace. Cópialo manualmente: ' + url);
    }
    setOpen(false);
  };

  const shareWhatsApp = () => {
    window.open(buildWhatsAppShareUrl(post, links.preferred), '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]';

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
          open ? 'text-[var(--brand-primary)]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
        }`}
      >
        <Share2 size={13} />
        Compartir
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-20 mb-1 w-64 overflow-hidden rounded-xl border border-[var(--app-border)] bg-white py-1 shadow-lg"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={() => void shareWhatsApp()}>
            <WhatsAppIcon />
            Compartir por WhatsApp
          </button>

          {links.public ? (
            <>
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => void copy(links.public as string, 'public')}
              >
                {copied === 'public' ? <Check size={14} /> : <Link2 size={14} />}
                Copiar enlace público
              </button>
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => void copy(links.internal, 'internal')}
              >
                {copied === 'internal' ? <Check size={14} /> : <Lock size={14} />}
                Copiar enlace interno
              </button>
              <p className="border-t border-[var(--app-border)] px-3 py-2 text-[10px] leading-snug text-[var(--app-muted)]">
                El enlace público abre la publicación sin iniciar sesión. El interno lleva a la comunidad dentro de la plataforma.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => void copy(links.internal, 'internal')}
              >
                {copied === 'internal' ? <Check size={14} /> : <Link2 size={14} />}
                Copiar enlace
              </button>
              <p className="border-t border-[var(--app-border)] px-3 py-2 text-[10px] leading-snug text-[var(--app-muted)]">
                Esta comunidad es cerrada: quien reciba el enlace necesita iniciar sesión y ser miembro.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
