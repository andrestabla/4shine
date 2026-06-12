'use client';

import Link from 'next/link';
import React from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

export function MarketingMobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = React.useState(false);

  // Cerrar al cambiar de ruta (cuando se hace click en un link)
  // Nota: como es link normal, el unmount del componente al navegar
  // ya cierra el menú automáticamente, pero por si la nav es interna:
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Portal a document.body: el header usa backdrop-blur, que crea un
          containing block y rompe el posicionamiento fixed del overlay. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative ml-auto flex h-full w-[80%] max-w-[320px] flex-col shadow-2xl"
            style={{ background: 'var(--brand-dark)' }}
          >
            <div className="flex items-center justify-end p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4 pb-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-bold text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/10 p-4">
              <Link
                href="/acceso"
                onClick={() => setOpen(false)}
                className="block w-full rounded-full px-5 py-3 text-center text-sm font-bold transition hover:opacity-90"
                style={{
                  background: 'var(--brand-accent)',
                  color: 'var(--brand-on-accent)',
                }}
              >
                Iniciar sesión
              </Link>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
