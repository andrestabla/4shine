import { MarketingShell } from '@/components/marketing/MarketingShell';

const steps = [
  {
    title: 'Diagnóstico ejecutivo',
    detail: 'Identificamos tu punto de partida por pilar para priorizar brechas y fortalezas accionables.',
  },
  {
    title: 'Ruta guiada con workbooks',
    detail: 'Cada semana trabajas con ejercicios prácticos, contenido exclusivo y foco en ejecución real.',
  },
  {
    title: 'Mentorías especializadas',
    detail: 'Sesiones individuales y grupales con Advisers para acelerar decisiones y consolidar hábitos.',
  },
  {
    title: 'Networking y oportunidades',
    detail: 'Conecta con líderes del programa, comparte aprendizajes y potencia colaboraciones estratégicas.',
  },
];

export default function MetodologiaPage() {
  return (
    <MarketingShell
      title="¿Qué es 4Shine? Metodología del programa"
      subtitle="4Shine es un programa de transformación de liderazgo que integra diagnóstico, formación aplicada, mentoría experta y comunidad ejecutiva para generar resultados sostenibles."
    >
      <section className="mx-auto w-full max-w-[1240px] px-6 pb-16 md:px-10 lg:px-14">
        <div className="rounded-3xl border border-[#d8cfee] bg-[#1f1232] p-8 text-white md:p-11">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7c5f8]">Video corto recomendado</p>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">Conoce el recorrido 4Shine en menos de 2 minutos</h2>
          <p className="mt-4 max-w-[66ch] text-[#dfd6ef]">Puedes insertar aquí tu video explicativo institucional para presentar propósito, metodología y experiencia del programa.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-[#d8cfee] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7e62a8]">Paso {index + 1}</p>
              <h3 className="mt-2 text-2xl font-black text-[#301b48]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5f4c78]">{step.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-[#dbcff0] bg-[#efe9f9] p-8 md:p-10">
          <h3 className="text-3xl font-black text-[#2f1a47]">Experiencias exitosas de transformación</h3>
          <p className="mt-4 max-w-[68ch] text-[#5f4c78]">Bloque preparado para testimonios, casos y métricas de impacto (antes/después) por tipo de líder y sector.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
