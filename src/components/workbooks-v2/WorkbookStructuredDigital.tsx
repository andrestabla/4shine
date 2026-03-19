'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Download, Save, Sparkles } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'
import type {
    StructuredWorkbookConfig,
    StructuredWorkbookField,
    StructuredWorkbookFieldGroup,
    StructuredWorkbookSection
} from '@/lib/workbooks-v2-structured'

type StoredState = {
    values: Record<string, string>
    activePage: number
    lastSavedAt: string | null
}

type WorkbookPage = {
    id: string
    label: string
    shortLabel: string
    section: StructuredWorkbookSection | null
}

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

function buildInitialValues(config: StructuredWorkbookConfig) {
    return Object.fromEntries(
        config.sections
            .flatMap((section) => section.groups)
            .flatMap((group) => group.fields)
            .map((field) => [field.id, ''])
    )
}

function countCompletedFields(fields: StructuredWorkbookField[], values: Record<string, string>) {
    return fields.reduce((count, field) => count + (values[field.id]?.trim() ? 1 : 0), 0)
}

function renderGroupHtml(group: StructuredWorkbookFieldGroup, values: Record<string, string>) {
    const items = group.fields
        .map((field) => {
            const value = values[field.id]?.trim()
            if (!value) return ''
            return `
                <div style="margin:0 0 16px 0;padding:12px 14px;border:1px solid #dbe4ee;border-radius:14px;background:#f8fafc;">
                    <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(field.label)}</div>
                    <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(value)}</div>
                </div>
            `
        })
        .filter(Boolean)
        .join('')

    if (!items) return ''

    return `
        <section style="margin-top:20px;">
            <h3 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">${escapeHtml(group.title)}</h3>
            ${group.description ? `<p style="font-size:14px;color:#475569;margin:0 0 14px 0;">${escapeHtml(group.description)}</p>` : ''}
            ${items}
        </section>
    `
}

function downloadWorkbookHtml(
    config: StructuredWorkbookConfig,
    values: Record<string, string>
) {
    const html = `
        <!doctype html>
        <html lang="es">
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(config.code)} - ${escapeHtml(config.title)}</title>
            </head>
            <body style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;color:#0f172a;margin:0;padding:32px;">
                <main style="max-width:960px;margin:0 auto;background:#ffffff;border:1px solid #dbe4ee;border-radius:24px;padding:32px;">
                    <div style="display:inline-flex;gap:8px;align-items:center;padding:6px 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                        ${escapeHtml(config.code)} · ${escapeHtml(config.pillar)}
                    </div>
                    <h1 style="font-size:34px;line-height:1.1;margin:18px 0 10px 0;">${escapeHtml(config.title)}</h1>
                    <p style="font-size:16px;line-height:1.7;color:#334155;margin:0 0 12px 0;">${escapeHtml(config.summary)}</p>
                    <section style="margin-top:28px;">
                        <h2 style="font-size:22px;margin:0 0 10px 0;">Objetivo</h2>
                        <p style="font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(config.objective)}</p>
                    </section>
                    ${config.sections
                        .map(
                            (section) => `
                                <section style="margin-top:30px;padding-top:24px;border-top:1px solid #e2e8f0;">
                                    <h2 style="font-size:24px;margin:0 0 10px 0;">${escapeHtml(section.label)}</h2>
                                    <p style="font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(section.purpose)}</p>
                                    ${section.concepts.length > 0
                                        ? `
                                            <div style="margin-top:14px;font-size:13px;color:#475569;">
                                                <strong>Conceptos eje:</strong> ${escapeHtml(section.concepts.join(' · '))}
                                            </div>
                                        `
                                        : ''}
                                    ${section.groups.map((group) => renderGroupHtml(group, values)).join('')}
                                </section>
                            `
                        )
                        .join('')}
                </main>
            </body>
        </html>
    `

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = config.downloadFileName
    anchor.click()
    URL.revokeObjectURL(url)
}

export function WorkbookStructuredDigital({ config }: { config: StructuredWorkbookConfig }) {
    const initialValues = useMemo(() => buildInitialValues(config), [config])
    const pages = useMemo<WorkbookPage[]>(
        () => [
            {
                id: 'intro',
                label: 'Presentación del workbook',
                shortLabel: 'Intro',
                section: null
            },
            ...config.sections.map((section) => ({
                id: section.id,
                label: section.label,
                shortLabel: section.shortLabel,
                section
            }))
        ],
        [config]
    )
    const [values, setValues] = useState<Record<string, string>>(initialValues)
    const [activePage, setActivePage] = useState(0)
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(config.storageKey)
            if (!raw) {
                setIsHydrated(true)
                return
            }

            const parsed = JSON.parse(raw) as StoredState
            setValues({ ...initialValues, ...parsed.values })
            setActivePage(Math.min(parsed.activePage ?? 0, pages.length - 1))
            setLastSavedAt(parsed.lastSavedAt ?? null)
        } catch {
            setValues(initialValues)
        } finally {
            setIsHydrated(true)
        }
    }, [config.storageKey, initialValues, pages.length])

    useEffect(() => {
        if (!isHydrated) return

        const payload: StoredState = {
            values,
            activePage,
            lastSavedAt
        }

        window.localStorage.setItem(config.storageKey, JSON.stringify(payload))
    }, [activePage, config.storageKey, isHydrated, lastSavedAt, values])

    const allFields = useMemo(
        () => config.sections.flatMap((section) => section.groups).flatMap((group) => group.fields),
        [config.sections]
    )
    const completedFields = countCompletedFields(allFields, values)
    const completionPercent = allFields.length === 0 ? 0 : Math.round((completedFields / allFields.length) * 100)
    const currentPage = pages[activePage]
    const currentSection = currentPage.section

    const completedPages = useMemo(
        () =>
            new Set(
                config.sections
                    .filter((section) => {
                        const fields = section.groups.flatMap((group) => group.fields)
                        return fields.length > 0 && countCompletedFields(fields, values) > 0
                    })
                    .map((section) => section.id)
            ),
        [config.sections, values]
    )

    const handleFieldChange = (fieldId: string, value: string) => {
        setValues((previous) => ({
            ...previous,
            [fieldId]: value
        }))
    }

    const handleSave = () => {
        setLastSavedAt(new Date().toISOString())
    }

    const nextPage = () => setActivePage((previous) => Math.min(previous + 1, pages.length - 1))
    const previousPage = () => setActivePage((previous) => Math.max(previous - 1, 0))

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={WORKBOOK_V2_EDITORIAL.classes.toolbar}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={16} />
                        Volver
                    </Link>
                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            {config.code} · {config.pillar}
                        </p>
                        <h1 className="mt-1 text-base font-bold text-slate-900 md:text-lg">{config.title}</h1>
                    </div>
                    <span className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>{completionPercent}% completado</span>
                    {lastSavedAt && (
                        <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>
                            Guardado {new Date(lastSavedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button type="button" className={WORKBOOK_V2_EDITORIAL.classes.saveButton} onClick={handleSave}>
                        <Save size={14} />
                        Guardar local
                    </button>
                    <button
                        type="button"
                        className={WORKBOOK_V2_EDITORIAL.classes.htmlButton}
                        onClick={() => downloadWorkbookHtml(config, values)}
                    >
                        <Download size={14} />
                        Descargar HTML
                    </button>
                </div>
            </header>

            <div className="mx-auto grid max-w-[1280px] gap-6 px-3 py-6 sm:px-5 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className={WORKBOOK_V2_EDITORIAL.classes.sidebar}>
                    <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>Navegación</p>
                    <div className="space-y-2">
                        {pages.map((page, index) => {
                            const isActive = index === activePage
                            const isCompleted = page.id === 'intro' ? false : completedPages.has(page.id)

                            return (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => setActivePage(index)}
                                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                                        isActive
                                            ? 'border-slate-900 bg-slate-950 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                            Paso {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold">{page.shortLabel}</div>
                                    </div>
                                    {isCompleted && <CheckCircle2 size={16} className={isActive ? 'text-emerald-300' : 'text-emerald-500'} />}
                                </button>
                            )
                        })}
                    </div>

                </aside>

                <main className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                            <Sparkles size={14} />
                            {currentPage.label}
                        </div>

                        {!currentSection ? (
                            <div className="mt-5 space-y-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{config.title}</h2>
                                    <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">{config.summary}</p>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Objetivo</p>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{config.objective}</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Componentes trabajados</p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {config.components.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Competencias 4Shine</p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {config.competencies.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Reglas de oro</p>
                                    <ul className="mt-3 space-y-2 text-sm text-amber-900">
                                        {config.rules.map((rule) => (
                                            <li key={rule}>• {rule}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{currentSection.label}</h2>
                                    <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">{currentSection.purpose}</p>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conceptos eje</p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {currentSection.concepts.map((concept) => (
                                                <li key={concept}>• {concept}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {currentSection.prompts && currentSection.prompts.length > 0 && (
                                        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Claves de trabajo</p>
                                            <ul className="mt-3 space-y-2 text-sm text-blue-900">
                                                {currentSection.prompts.map((prompt) => (
                                                    <li key={prompt}>• {prompt}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {currentSection.groups.map((group) => (
                                        <section key={group.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                                                    {group.description && <p className="mt-1 text-sm text-slate-500">{group.description}</p>}
                                                </div>
                                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                                    {countCompletedFields(group.fields, values)} / {group.fields.length} campos
                                                </div>
                                            </div>
                                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                                {group.fields.map((field) => (
                                                    <label key={field.id} className="block">
                                                        <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                                                        <textarea
                                                            className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                                                            value={values[field.id] ?? ''}
                                                            onChange={(event) => handleFieldChange(field.id, event.target.value)}
                                                            placeholder={field.placeholder ?? 'Escribe aquí...'}
                                                            rows={field.rows ?? 3}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <div className={WORKBOOK_V2_EDITORIAL.classes.bottomNav}>
                        <button type="button" onClick={previousPage} disabled={activePage === 0} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                            <ArrowLeft size={16} />
                            Atrás
                        </button>
                        <div className="text-center text-sm text-slate-500">
                            Paso {activePage + 1} de {pages.length}
                        </div>
                        <button
                            type="button"
                            onClick={nextPage}
                            disabled={activePage === pages.length - 1}
                            className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}
                        >
                            Siguiente
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
