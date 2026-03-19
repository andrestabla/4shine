import { notFound } from 'next/navigation'
import { WB1Step1Digital } from '@/components/workbooks-v2/WB1Step1Digital'
import { WB2Digital } from '@/components/workbooks-v2/WB2Digital'
import { WB3Digital } from '@/components/workbooks-v2/WB3Digital'
import { WB4Digital } from '@/components/workbooks-v2/WB4Digital'
import { WB5Digital } from '@/components/workbooks-v2/WB5Digital'
import { WB6Digital } from '@/components/workbooks-v2/WB6Digital'
import { WB7Digital } from '@/components/workbooks-v2/WB7Digital'
import { WB8Digital } from '@/components/workbooks-v2/WB8Digital'
import { WB9Digital } from '@/components/workbooks-v2/WB9Digital'
import { WB10Digital } from '@/components/workbooks-v2/WB10Digital'
import { WorkbookDigitalRuntimeShell } from '@/components/workbooks-v2/WorkbookDigitalRuntimeShell'
import Link from 'next/link'
import { ArrowLeft, Clock3, Sparkles } from 'lucide-react'
import { WORKBOOKS_V2_CATALOG } from '@/lib/workbooks-v2-catalog'

export const revalidate = 0

export default async function WorkbookV2Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const workbook = WORKBOOKS_V2_CATALOG.find((item) => item.slug === slug)

    if (!workbook) {
        notFound()
    }

    if (slug === 'wb1') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB1Step1Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb2') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB2Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb3') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB3Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb4') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB4Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb5') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB5Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb6') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB6Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb7') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB7Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb8') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB8Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb9') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB9Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    if (slug === 'wb10') {
        return (
            <WorkbookDigitalRuntimeShell slug={slug}>
                <WB10Digital />
            </WorkbookDigitalRuntimeShell>
        )
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-[#0f172a] px-4 py-8 md:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <Link
                    href="/dashboard/aprendizaje/workbooks-v2"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft size={16} />
                    Volver al catálogo digital
                </Link>

                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        <Clock3 size={14} />
                        En construcción
                    </div>

                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                        {workbook.code} · {workbook.title}
                    </h1>
                    <p className="mt-3 text-sm text-slate-500">
                        Pilar: <span className="font-semibold text-slate-700">{workbook.pillar}</span>
                    </p>
                    <p className="mt-6 text-base leading-relaxed text-slate-600">
                        Este workbook sí existe en el catálogo del proyecto origen, pero todavía no tiene el componente digital operativo
                        dentro de esta integración. Dejé el registro y la navegación preparados para conectarlo cuando el archivo final esté listo.
                    </p>

                    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Sparkles size={16} />
                            Estado actual
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{workbook.summary}</p>
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                                <span>Progreso digital identificado</span>
                                <span>{workbook.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                                    style={{ width: `${workbook.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
