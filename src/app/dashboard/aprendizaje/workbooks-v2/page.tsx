import Link from 'next/link'
import { ArrowRight, BookOpenText, Sparkles } from 'lucide-react'
import { WORKBOOKS_V2_CATALOG } from '@/lib/workbooks-v2-catalog'

export const revalidate = 0

export default function WorkbooksV2Page() {
    return (
        <div className="min-h-screen bg-[#f4f7fb] text-[#0f172a] px-3 sm:px-6 py-6 sm:py-10 md:px-10 md:py-12 overflow-x-hidden">
            <div className="max-w-[1280px] mx-auto space-y-6 sm:space-y-10">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 md:p-10 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-[0.14em] sm:tracking-[0.18em] uppercase text-blue-700">
                        <Sparkles size={14} />
                        Workbooks v2
                    </div>
                    <h1 className="mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                        Biblioteca digital e interactiva 4Shine
                    </h1>
                    <p className="mt-3 sm:mt-4 max-w-3xl text-sm md:text-base text-slate-600 leading-relaxed">
                        Este módulo centraliza las nuevas versiones 100% digitales de los cuadernillos.
                        Cada workbook tendrá navegación interactiva y versión descargable.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {WORKBOOKS_V2_CATALOG.map((workbook) => (
                        <article
                            key={workbook.id}
                            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
                                    <BookOpenText size={14} />
                                    {workbook.code}
                                </div>
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                                    {workbook.statusLabel}
                                </span>
                            </div>

                            <h2 className="mt-4 sm:mt-5 text-xl sm:text-2xl font-extrabold leading-tight text-slate-900">
                                {workbook.title}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Pilar: <span className="text-slate-800 font-semibold">{workbook.pillar}</span>
                            </p>
                            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                                {workbook.summary}
                            </p>

                            <div className="mt-6">
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <span>Progreso digital</span>
                                    <span>{workbook.progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-500"
                                        style={{ width: `${workbook.progress}%` }}
                                    />
                                </div>
                            </div>

                            <Link
                                href={`/dashboard/aprendizaje/workbooks-v2/${workbook.slug}`}
                                className="mt-6 sm:mt-7 inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors"
                            >
                                {workbook.isImplemented ? 'Abrir versión digital' : 'Ver estado del workbook'}
                                <ArrowRight size={16} />
                            </Link>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    )
}
