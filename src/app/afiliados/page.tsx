import { MarketingShell } from '@/components/marketing/MarketingShell';
import { loadServerBranding } from '@/lib/server-branding';

export default async function AfiliadosPage() {
  const branding = await loadServerBranding();
  const platformName = branding.settings.platformName?.trim() || '4Shine';

  return (
    <MarketingShell
      title={`Afiliados ${platformName}`}
      subtitle="Si quieres ser parte de nuestra red de Advisers y compartir tu experiencia a través de mentorías especializadas, este será tu espacio."
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
            Publicaremos requisitos, rutas de vinculación, criterios de especialidad y esquema de colaboración para Advisers del programa {platformName}.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
