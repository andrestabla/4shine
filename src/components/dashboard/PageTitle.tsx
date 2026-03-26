import React from "react";

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <p className="app-section-kicker">4Shine platform</p>
      <h2
        className="app-display-title mt-2 max-w-4xl text-[2.05rem] font-semibold leading-[0.98] md:text-[2.85rem]"
        data-display-font="true"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-3xl text-sm leading-[1.7] text-[var(--app-muted)] md:text-[0.98rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
