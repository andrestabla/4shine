import { notFound, redirect } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { loadServerBranding } from '@/lib/server-branding';
import { BlockRenderer } from '@/components/site-builder/BlockRenderer';
import { getPublicPageByKey } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';

export default async function AfiliadosPage() {
  const [branding, builderPage] = await Promise.all([
    loadServerBranding(),
    getPublicPageByKey('afiliados'),
  ]);
  if (builderPage && !builderPage.isVisible) notFound();
  if (builderPage?.useBuilder && builderPage.sections.length > 0) {
    // La URL pudo cambiar desde el builder: la ruta original redirige a la nueva.
    if (builderPage.slug && builderPage.slug !== 'advisors') redirect(`/${builderPage.slug}`);
    return (
      <MarketingShell>
        <BlockRenderer sections={builderPage.sections} />
      </MarketingShell>
    );
  }
  const platformName = branding.settings.platformName?.trim() || '4Shine';

  return (
    <MarketingShell
      title={`Afiliados ${platformName}`}
      subtitle="Si quieres ser parte de nuestra red de Advisors y compartir tu experiencia a través de mentorías especializadas, este será tu espacio."
    >
      <section className="mx-auto w-full max-w-[1240px] px-6 pb-16 md:px-10 lg:px-14">
        <div
          className="rounded-3xl border bg-white p-10 text-center md:p-14"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.3em]"
            style={{ color: 'var(--brand-accent-strong)' }}
          >
            Próximamente
          </p>
          <h2 className="mt-4 text-4xl font-black" style={{ color: 'var(--brand-primary)' }}>
            Convocatoria de afiliados
          </h2>
          <p
            className="mx-auto mt-4 max-w-[66ch]"
            style={{ color: 'var(--brand-ink-soft)' }}
          >
            Publicaremos requisitos, rutas de vinculación, criterios de especialidad y esquema de colaboración para Advisors del programa {platformName}.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
