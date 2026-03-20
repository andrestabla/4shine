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
      <p className="app-section-kicker">Experiencia</p>
      <h2
        className="app-display-title mt-2 text-[2.4rem] font-semibold leading-[0.95] md:text-[3.2rem]"
        data-display-font="true"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
