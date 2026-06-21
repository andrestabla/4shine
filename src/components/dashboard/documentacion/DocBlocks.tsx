import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import type { DocBlock } from '@/features/documentacion/content';

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => (
        <DocBlockItem key={index} block={block} />
      ))}
    </div>
  );
}

function DocBlockItem({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="text-sm leading-[1.7] text-[var(--app-muted)] md:text-[0.95rem]">
          {block.text}
        </p>
      );

    case 'subheading':
      return (
        <h3 className="pt-1 text-base font-semibold text-[var(--app-ink)]">
          {block.text}
        </h3>
      );

    case 'bullets':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-[1.6] text-[var(--app-muted)]"
            >
              <span
                aria-hidden
                className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-ink)]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className="space-y-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm leading-[1.6] text-[var(--app-muted)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--app-ink)] text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      );

    case 'table':
      return (
        <div className="overflow-x-auto rounded-[0.9rem] border border-[var(--app-border)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)]">
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 font-semibold text-[var(--app-ink)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-t border-[var(--app-border)] align-top"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={
                        ci === 0
                          ? 'px-4 py-2.5 font-medium text-[var(--app-ink)]'
                          : 'px-4 py-2.5 leading-[1.55] text-[var(--app-muted)]'
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'code':
      return (
        <pre className="overflow-x-auto rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-ink)] px-4 py-3.5 text-[0.8rem] leading-[1.55] text-white">
          <code>{block.code}</code>
        </pre>
      );

    case 'diagram':
      return (
        <figure className="space-y-2">
          <div
            className="overflow-x-auto rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
            // Contenido estático autorado en content.ts (sin entrada de usuario).
            dangerouslySetInnerHTML={{ __html: block.svg }}
          />
          {block.title && (
            <figcaption className="text-xs text-[var(--app-muted)]">
              {block.title}
            </figcaption>
          )}
        </figure>
      );

    case 'callout': {
      const isWarn = block.tone === 'warn';
      const Icon = isWarn ? AlertTriangle : Info;
      return (
        <div
          className={
            isWarn
              ? 'flex gap-3 rounded-[0.9rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900'
              : 'flex gap-3 rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]'
          }
        >
          <Icon
            size={16}
            className={
              isWarn
                ? 'mt-0.5 shrink-0 text-amber-600'
                : 'mt-0.5 shrink-0 text-[var(--app-ink)]'
            }
          />
          <div>
            {block.title && (
              <p
                className={
                  isWarn
                    ? 'mb-0.5 font-semibold'
                    : 'mb-0.5 font-semibold text-[var(--app-ink)]'
                }
              >
                {block.title}
              </p>
            )}
            <p className="leading-[1.6]">{block.text}</p>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
