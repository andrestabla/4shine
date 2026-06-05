'use client'

import React from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    BookOpen,
    Building2,
    GraduationCap,
    Loader2,
    MapPin,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react'
import { PageTitle } from '@/components/dashboard/PageTitle'
import { useUser } from '@/context/UserContext'
import { listLeaderSummaries, type LeaderSummary } from '@/features/lideres/client'

type PercentRange = { min: number; max: number; label: string }
type SessionsRange = { min: number; max: number; label: string }

const PERCENT_RANGES: PercentRange[] = [
    { min: 0, max: 100, label: 'Todo el rango' },
    { min: 0, max: 24, label: 'Inicio (0–24%)' },
    { min: 25, max: 49, label: 'En marcha (25–49%)' },
    { min: 50, max: 74, label: 'Avanzado (50–74%)' },
    { min: 75, max: 100, label: 'Cerca de cierre (75–100%)' },
]

const SESSIONS_RANGES: SessionsRange[] = [
    { min: 0, max: Number.POSITIVE_INFINITY, label: 'Cualquier número' },
    { min: 0, max: 0, label: 'Sin sesiones' },
    { min: 1, max: 3, label: '1–3 sesiones' },
    { min: 4, max: 9, label: '4–9 sesiones' },
    { min: 10, max: Number.POSITIVE_INFINITY, label: '10+ sesiones' },
]

function tokenize(value: string): string[] {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
}

function normalize(value: string | null | undefined): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
}

function buildSearchHaystack(leader: LeaderSummary): string {
    return [
        leader.name,
        leader.email,
        leader.company,
        leader.industry,
        leader.country,
        leader.location,
        leader.seniority,
        leader.plan.name,
        leader.plan.code,
    ]
        .filter(Boolean)
        .map((value) => normalize(value as string))
        .join(' ')
}

function highlightTokens(value: string, tokens: string[]): React.ReactNode {
    if (!tokens.length || !value) return value
    const normalized = normalize(value)
    const matches: Array<{ start: number; end: number }> = []
    for (const token of tokens) {
        if (!token) continue
        let from = 0
        while (true) {
            const idx = normalized.indexOf(token, from)
            if (idx === -1) break
            matches.push({ start: idx, end: idx + token.length })
            from = idx + token.length
        }
    }
    if (!matches.length) return value
    matches.sort((a, b) => a.start - b.start)
    const merged: Array<{ start: number; end: number }> = []
    for (const m of matches) {
        const last = merged[merged.length - 1]
        if (last && m.start <= last.end) {
            last.end = Math.max(last.end, m.end)
        } else {
            merged.push({ ...m })
        }
    }
    const out: React.ReactNode[] = []
    let cursor = 0
    merged.forEach((m, i) => {
        if (m.start > cursor) out.push(value.slice(cursor, m.start))
        out.push(
            <mark
                key={`m-${i}`}
                className="rounded bg-[var(--brand-accent)]/30 px-0.5 text-[var(--brand-primary)]"
            >
                {value.slice(m.start, m.end)}
            </mark>,
        )
        cursor = m.end
    })
    if (cursor < value.length) out.push(value.slice(cursor))
    return <>{out}</>
}

function avgFor(leader: LeaderSummary): number {
    return leader.overallPercent
}

function sessionsCountFor(leader: LeaderSummary): number {
    return leader.mentorias.completed
}

function planLabel(leader: LeaderSummary): string {
    return leader.plan.name ?? leader.plan.code ?? 'Sin plan asignado'
}

function planGroupLabel(group: string | null): string {
    if (group === 'program') return 'Programa'
    if (group === 'circulo') return 'Círculo'
    if (group === 'custom') return 'Custom'
    return 'Sin grupo'
}

function formatDate(value: string | null): string {
    if (!value) return 'Sin agendar'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Sin agendar'
    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function LeaderAvatar({ leader }: { leader: LeaderSummary }) {
    if (leader.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={leader.avatarUrl}
                alt={leader.name}
                className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-sm"
            />
        )
    }
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-base font-bold text-white shadow-sm">
            {leader.avatarInitial}
        </div>
    )
}

function MetricChip({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    tone: 'primary' | 'accent' | 'neutral'
}) {
    const toneClasses =
        tone === 'primary'
            ? 'border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
            : tone === 'accent'
              ? 'border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 text-[var(--brand-primary)]'
              : 'border-slate-200 bg-slate-50 text-slate-700'
    return (
        <div className={`flex flex-col gap-1 rounded-xl border px-3 py-2 ${toneClasses}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
                {icon}
                {label}
            </div>
            <div className="text-base font-bold">{value}</div>
        </div>
    )
}

function LeaderCard({
    leader,
    tokens,
    isElevated,
}: {
    leader: LeaderSummary
    tokens: string[]
    isElevated: boolean
}) {
    const planText = planLabel(leader)
    const nextSession = formatDate(leader.mentorias.nextSessionAt)
    return (
        <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-accent)]/40 hover:shadow-md">
            <header className="flex items-start gap-3">
                <LeaderAvatar leader={leader} />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">
                        {highlightTokens(leader.name, tokens)}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                        {highlightTokens(leader.email, tokens)}
                    </p>
                </div>
            </header>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {leader.country && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                        <MapPin size={11} />
                        {highlightTokens(leader.country, tokens)}
                    </span>
                )}
                {leader.company && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                        <Building2 size={11} />
                        {highlightTokens(leader.company, tokens)}
                    </span>
                )}
                <span
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-2 py-0.5 font-semibold text-[var(--brand-primary)]"
                    title={`${planGroupLabel(leader.plan.group)} · ${leader.plan.code ?? '—'}`}
                >
                    <Sparkles size={11} />
                    {highlightTokens(planText, tokens)}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <MetricChip
                    icon={<BookOpen size={11} />}
                    label="WB"
                    value={
                        <span>
                            {leader.workbooks.avgPercent}%
                            <span className="ml-1 text-xs font-normal opacity-70">
                                ({leader.workbooks.completed}/{leader.workbooks.total})
                            </span>
                        </span>
                    }
                    tone="primary"
                />
                <MetricChip
                    icon={<Users size={11} />}
                    label="Sesiones"
                    value={
                        <span>
                            {leader.mentorias.completed}
                            {leader.mentorias.scheduled > 0 && (
                                <span className="ml-1 text-xs font-normal opacity-70">
                                    +{leader.mentorias.scheduled} próx.
                                </span>
                            )}
                        </span>
                    }
                    tone="accent"
                />
                <MetricChip
                    icon={<GraduationCap size={11} />}
                    label="Cursos"
                    value={
                        <span>
                            {leader.cursos.avgPercent}%
                            <span className="ml-1 text-xs font-normal opacity-70">
                                ({leader.cursos.completed}/{leader.cursos.total})
                            </span>
                        </span>
                    }
                    tone="neutral"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                    Próxima sesión: <strong className="text-slate-700">{nextSession}</strong>
                </span>
                {isElevated && (
                    <Link
                        href={`/dashboard/lideres/${leader.userId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/25"
                    >
                        Ver 360 <ArrowRight size={12} />
                    </Link>
                )}
            </div>
        </article>
    )
}

export default function LideresPage() {
    const { currentRole } = useUser()
    const isElevated =
        currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor'

    const [leaders, setLeaders] = React.useState<LeaderSummary[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [loadError, setLoadError] = React.useState<string | null>(null)
    const [query, setQuery] = React.useState('')
    const [planFilter, setPlanFilter] = React.useState<string>('all')
    const [countryFilter, setCountryFilter] = React.useState<string>('all')
    const [sessionsFilter, setSessionsFilter] = React.useState<number>(0)
    const [progressFilter, setProgressFilter] = React.useState<number>(0)

    React.useEffect(() => {
        if (!isElevated) {
            setIsLoading(false)
            return
        }
        let active = true
        setIsLoading(true)
        setLoadError(null)
        listLeaderSummaries()
            .then((data) => {
                if (!active) return
                setLeaders(data)
            })
            .catch((err) => {
                if (!active) return
                setLoadError(
                    err instanceof Error
                        ? err.message
                        : 'No pudimos cargar el resumen de líderes.',
                )
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })
        return () => {
            active = false
        }
    }, [isElevated])

    const planOptions = React.useMemo(() => {
        const map = new Map<string, string>()
        for (const leader of leaders) {
            if (leader.plan.id) {
                map.set(leader.plan.id, leader.plan.name ?? leader.plan.code ?? leader.plan.id)
            }
        }
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
    }, [leaders])

    const countryOptions = React.useMemo(() => {
        const set = new Set<string>()
        for (const leader of leaders) {
            if (leader.country) set.add(leader.country)
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
    }, [leaders])

    const filteredLeaders = React.useMemo(() => {
        const tokens = tokenize(query)
        const sessionsRange = SESSIONS_RANGES[sessionsFilter] ?? SESSIONS_RANGES[0]
        const progressRange = PERCENT_RANGES[progressFilter] ?? PERCENT_RANGES[0]

        return leaders.filter((leader) => {
            if (planFilter !== 'all') {
                if (leader.plan.id !== planFilter) return false
            }
            if (countryFilter !== 'all') {
                if ((leader.country ?? '') !== countryFilter) return false
            }
            const sessions = sessionsCountFor(leader)
            if (sessions < sessionsRange.min || sessions > sessionsRange.max) return false
            const avg = avgFor(leader)
            if (avg < progressRange.min || avg > progressRange.max) return false

            if (tokens.length > 0) {
                const haystack = buildSearchHaystack(leader)
                for (const token of tokens) {
                    if (!haystack.includes(token)) return false
                }
            }
            return true
        })
    }, [leaders, query, planFilter, countryFilter, sessionsFilter, progressFilter])

    const tokensForHighlight = React.useMemo(() => tokenize(query), [query])
    const hasActiveFilters =
        query.trim().length > 0 ||
        planFilter !== 'all' ||
        countryFilter !== 'all' ||
        sessionsFilter !== 0 ||
        progressFilter !== 0

    function clearFilters() {
        setQuery('')
        setPlanFilter('all')
        setCountryFilter('all')
        setSessionsFilter(0)
        setProgressFilter(0)
    }

    if (!isElevated) {
        return (
            <div>
                <PageTitle
                    title="Líderes"
                    subtitle="Seguimiento 360 de cada líder en el programa."
                />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    Sólo administradores, gestores o advisers pueden acceder a este resumen.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageTitle
                title="Líderes"
                subtitle="Dashboard ejecutivo: avatar, país, empresa, plan, progreso en workbooks, mentorías 1:1 y cursos, con acceso a la vista 360 de cada líder."
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="flex-1">
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Buscador inteligente
                        </label>
                        <div className="relative mt-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Busca por nombre, email, empresa, industria, país, plan, seniority…"
                                className="w-full rounded-xl border border-slate-300 bg-white px-9 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-focus)]"
                            />
                            {query.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Múltiples palabras combinan con AND. Tildes y mayúsculas se ignoran.
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Plan
                        </label>
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                            <option value="all">Todos los planes</option>
                            {planOptions.map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            País
                        </label>
                        <select
                            value={countryFilter}
                            onChange={(e) => setCountryFilter(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                            <option value="all">Todos los países</option>
                            {countryOptions.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Sesiones (mentoría 1:1)
                        </label>
                        <select
                            value={String(sessionsFilter)}
                            onChange={(e) => setSessionsFilter(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                            {SESSIONS_RANGES.map((range, index) => (
                                <option key={index} value={index}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Progreso global
                        </label>
                        <select
                            value={String(progressFilter)}
                            onChange={(e) => setProgressFilter(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                            {PERCENT_RANGES.map((range, index) => (
                                <option key={index} value={index}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">
                            {filteredLeaders.length} de {leaders.length} líderes en pantalla
                        </span>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        >
                            <X size={12} /> Limpiar filtros
                        </button>
                    </div>
                )}
            </section>

            {loadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                    {loadError}
                </div>
            )}

            {isLoading ? (
                <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
                    <Loader2 size={28} className="mr-2 animate-spin" /> Cargando líderes…
                </div>
            ) : filteredLeaders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <p className="text-sm text-slate-600">
                        No hay líderes que coincidan con los criterios actuales.
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        >
                            <X size={12} /> Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredLeaders.map((leader) => (
                        <LeaderCard
                            key={leader.userId}
                            leader={leader}
                            tokens={tokensForHighlight}
                            isElevated={isElevated}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
