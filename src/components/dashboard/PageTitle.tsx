import React from "react";

export function PageTitle({
  title: _title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      {subtitle && (
        <p className="max-w-3xl text-sm leading-[1.6] text-[var(--app-muted)] md:text-[0.95rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
