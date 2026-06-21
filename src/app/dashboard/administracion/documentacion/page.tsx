'use client';

import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { FileCode2 } from 'lucide-react';
import { DOC_SECTIONS } from '@/features/documentacion/content';
import { resolveDocIcon } from '@/components/dashboard/documentacion/docIcons';

const GROUPS: { key: 'arquitectura' | 'modulo'; title: string; description: string }[] = [
  {
    key: 'arquitectura',
    title: 'Arquitectura y fundamentos',
    description:
      'Cómo está construida la plataforma: stack, base de datos, autenticación, lógica de módulos e integraciones.',
  },
  {
    key: 'modulo',
    title: 'Módulos del sistema',
    description:
      'Una sección por cada módulo, explicando qué hace, dónde vive y cómo funciona por dentro.',
  },
];

export default function DocumentacionTecnicaPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Documentación técnica"
        subtitle="Referencia interna sobre cómo está construida la plataforma y cómo funciona cada módulo. Pensada para el equipo técnico y administradores."
      />

      {GROUPS.map((group) => {
        const sections = DOC_SECTIONS.filter((s) => s.category === group.key);
        return (
          <section key={group.key} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--app-ink)]">
                {group.title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-[1.6] text-[var(--app-muted)]">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => {
                const Icon = resolveDocIcon(section.icon);
                return (
                  <Link
                    key={section.slug}
                    href={`/dashboard/administracion/documentacion/${section.slug}`}
                    className="app-list-card block p-5"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-semibold text-[var(--app-ink)]">
                      {section.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                      {section.tagline}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex items-start gap-3 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]">
        <FileCode2 size={15} className="mt-0.5 shrink-0 text-[var(--app-ink)]" />
        <p>
          Esta documentación es estática y se mantiene en el código
          (<code className="mx-1">src/features/documentacion/content.ts</code>).
          Al evolucionar la plataforma, actualízala ahí para que siga reflejando
          la realidad.
        </p>
      </div>
    </div>
  );
}
