import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function PlanesPreciosPage() {
  return (
    <MarketingShell
      title="Planes y precios"
      subtitle="Elige el formato ideal para personas o empresas. Diseñado para combinar profundidad, ejecución y acompañamiento experto."
    >
      <section className="mx-auto w-full max-w-[1240px] px-6 pb-16 md:px-10 lg:px-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#d8cfee] bg-white p-8">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#7f63a8]">Individual</p>
            <h2 className="mt-2 text-3xl font-black text-[#301b48]">Programa 4Shine completo</h2>
            <p className="mt-2 text-sm text-[#5f4c78]">Duración: 6 meses</p>
            <p className="mt-4 text-4xl font-black text-[#2d1944]">$3000 USD</p>
            <ul className="mt-5 space-y-2 text-sm text-[#5f4c78]">
              <li>Acceso a todo el contenido exclusivo</li>
              <li>10 sesiones de mentoría con expertos</li>
              <li>Diagnóstico ejecutivo</li>
              <li>Networking y convocatorias</li>
              <li>Material de trabajo (workbooks)</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-[#d8cfee] bg-[#1f1232] p-8 text-white">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d7c5f8]">Empresarial</p>
            <h2 className="mt-2 text-3xl font-black">Programas para equipos</h2>
            <ul className="mt-5 space-y-3 text-sm text-[#e3dbf0]">
              <li>Programa 4Shine para 5 personas: <span className="font-bold text-white">$14.000 USD</span></li>
              <li>Programa 4Shine para 10 personas: <span className="font-bold text-white">$25.000 USD</span></li>
              <li>Más de 10 personas: <span className="font-bold text-white">Contactar</span></li>
            </ul>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#dbcff0] bg-[#efe9f8] p-8">
            <h3 className="text-2xl font-black text-[#2e1b46]">Bolsa de mentorías (individual)</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#5f4c78]">
              <li>5 mentorías: <span className="font-bold">$750 USD</span></li>
              <li>10 mentorías: <span className="font-bold">$1200 USD</span></li>
              <li>15 mentorías: <span className="font-bold">$1500 USD</span></li>
            </ul>
          </article>

          <article className="rounded-3xl border border-[#dbcff0] bg-[#efe9f8] p-8">
            <h3 className="text-2xl font-black text-[#2e1b46]">Bolsa de mentorías (empresarial)</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#5f4c78]">
              <li>5 mentorías</li>
              <li>10 mentorías</li>
              <li>15 mentorías</li>
              <li>Más de 15 mentorías: <span className="font-bold">Contactar</span></li>
            </ul>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
