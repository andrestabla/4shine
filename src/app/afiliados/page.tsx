import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function AfiliadosPage() {
  return (
    <MarketingShell
      title="Afiliados 4Shine"
      subtitle="Si quieres ser parte de nuestra red de Advisers y compartir tu experiencia a través de mentorías especializadas, este será tu espacio."
    >
      <section className="mx-auto w-full max-w-[1240px] px-6 pb-16 md:px-10 lg:px-14">
        <div className="rounded-3xl border border-[#d8cfee] bg-white p-10 text-center md:p-14">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d61a7]">Próximamente</p>
          <h2 className="mt-4 text-4xl font-black text-[#2f1a48]">Convocatoria de afiliados</h2>
          <p className="mx-auto mt-4 max-w-[66ch] text-[#5f4c78]">Publicaremos requisitos, rutas de vinculación, criterios de especialidad y esquema de colaboración para Advisers del programa 4Shine.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
