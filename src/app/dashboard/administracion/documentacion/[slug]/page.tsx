'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { DocBlocks } from '@/components/dashboard/documentacion/DocBlocks';
import { resolveDocIcon } from '@/components/dashboard/documentacion/docIcons';
import { DOC_SECTIONS, getDocSection } from '@/features/documentacion/content';

export default function DocumentacionSectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const section = slug ? getDocSection(slug) : undefined;

  if (!section) {
    notFound();
  }

  const Icon = resolveDocIcon(section.icon);
  const currentIndex = DOC_SECTIONS.findIndex((s) => s.slug === section.slug);
  const next = DOC_SECTIONS[currentIndex + 1] ?? null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
          <Icon size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--app-ink)]">
            {section.label}
          </h1>
          <PageTitle title={section.label} subtitle={section.tagline} />
        </div>
      </div>

      <div className="app-panel p-5 md:p-6">
        <DocBlocks blocks={section.blocks} />
      </div>

      {section.roles && section.roles.length > 0 && (
        <div className="app-panel p-5 md:p-6 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--app-ink)]">
              Qué puede hacer cada rol
            </h2>
            <p className="mt-1 text-xs leading-[1.6] text-[var(--app-muted)]">
              Refleja la matriz de permisos por defecto, editable en{' '}
              <span className="font-medium text-[var(--app-ink)]">
                Administración → Roles
              </span>
              .
            </p>
          </div>
          <div className="overflow-x-auto rounded-[0.9rem] border border-[var(--app-border)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)]">
                  <th className="px-4 py-2.5 font-semibold text-[var(--app-ink)]">
                    Rol
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-[var(--app-ink)]">
                    Qué puede hacer
                  </th>
                </tr>
              </thead>
              <tbody>
                {section.roles.map((row) => (
                  <tr
                    key={row.role}
                    className="border-t border-[var(--app-border)] align-top"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[var(--app-ink)]">
                      {row.role}
                    </td>
                    <td className="px-4 py-2.5 leading-[1.55] text-[var(--app-muted)]">
                      {row.can}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {next && (
        <Link
          href={`/dashboard/administracion/documentacion/${next.slug}`}
          className="app-list-card flex items-center justify-between gap-4 p-4"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
              Siguiente
            </p>
            <p className="font-semibold text-[var(--app-ink)]">{next.label}</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-[var(--app-ink)]" />
        </Link>
      )}
    </div>
  );
}
