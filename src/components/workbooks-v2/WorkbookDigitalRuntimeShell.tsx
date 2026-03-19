'use client'

import React from 'react'
import { Fingerprint } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'

const IDENTIFICATION_FIELDS_KEY_BY_SLUG: Partial<Record<string, string>> = {
    wb1: 'workbooks-v2-wb1-identification'
}

const IDENTIFICATION_STATE_KEY_BY_SLUG: Partial<Record<string, string>> = {
    wb2: 'workbooks-v2-wb2-state',
    wb3: 'workbooks-v2-wb3-state',
    wb4: 'wb4_v2_state',
    wb5: 'workbooks-v2-wb5-state',
    wb6: 'workbooks-v2-wb6-state',
    wb7: 'workbooks-v2-wb7-state',
    wb8: 'workbooks-v2-wb8-state'
}

type StoragePrototype = {
    getItem: Storage['getItem']
    setItem: Storage['setItem']
    removeItem: Storage['removeItem']
}

function shouldScopeStorageKey(key: string): boolean {
    return /^workbooks-v2-wb\d/.test(key) || /^wb4_v2_/.test(key)
}

function roleLabel(role: string | null | undefined): string {
    if (role === 'mentor') return 'Ishiner'
    if (role === 'gestor') return 'Gestor'
    if (role === 'admin') return 'Admin'
    return 'Líder'
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
    if (!value) return fallback
    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

export function WorkbookDigitalRuntimeShell({
    slug,
    children
}: {
    slug: string
    children: React.ReactNode
}) {
    const searchParams = useSearchParams()
    const { currentUser, currentRole } = useUser()
    const workbookId = searchParams.get('workbookId')?.trim() || 'preview'
    const ownerName = searchParams.get('ownerName')?.trim() || currentUser?.name || 'Líder 4Shine'
    const ownerRoleLabel = roleLabel(currentRole)
    const displayWorkbookId = workbookId === 'preview' ? 'PREVIEW' : workbookId

    React.useLayoutEffect(() => {
        if (typeof window === 'undefined') return

        const storageProto = Object.getPrototypeOf(window.localStorage) as StoragePrototype
        const originalGetItem = storageProto.getItem
        const originalSetItem = storageProto.setItem
        const originalRemoveItem = storageProto.removeItem

        const scopeKey = (key: string) => (shouldScopeStorageKey(key) ? `${workbookId}:${key}` : key)

        storageProto.getItem = (key: string) => {
            return originalGetItem.call(window.localStorage, scopeKey(String(key)))
        }

        storageProto.setItem = (key: string, value: string) => {
            return originalSetItem.call(window.localStorage, scopeKey(String(key)), value)
        }

        storageProto.removeItem = (key: string) => {
            return originalRemoveItem.call(window.localStorage, scopeKey(String(key)))
        }

        const today = new Date().toISOString().slice(0, 10)
        const scopedIdLabel = workbookId === 'preview' ? 'PREVIEW' : workbookId.slice(0, 8).toUpperCase()

        const identificationFieldsKey = IDENTIFICATION_FIELDS_KEY_BY_SLUG[slug]
        if (identificationFieldsKey) {
            const current = safeJsonParse<Record<string, string>>(
                originalGetItem.call(window.localStorage, scopeKey(identificationFieldsKey)),
                {},
            )
            originalSetItem.call(
                window.localStorage,
                scopeKey(identificationFieldsKey),
                JSON.stringify({
                    ...current,
                    leaderName: current.leaderName?.trim() || ownerName,
                    role: current.role?.trim() || ownerRoleLabel,
                    cohort: current.cohort?.trim() || `ID ${scopedIdLabel}`,
                    startDate: current.startDate?.trim() || today,
                }),
            )
        }

        const stateKey = IDENTIFICATION_STATE_KEY_BY_SLUG[slug]
        if (stateKey) {
            const current = safeJsonParse<Record<string, unknown>>(
                originalGetItem.call(window.localStorage, scopeKey(stateKey)),
                {},
            )
            const currentIdentification =
                current.identification && typeof current.identification === 'object'
                    ? (current.identification as Record<string, string>)
                    : {}

            originalSetItem.call(
                window.localStorage,
                scopeKey(stateKey),
                JSON.stringify({
                    ...current,
                    identification: {
                        ...currentIdentification,
                        leaderName: currentIdentification.leaderName?.trim() || ownerName,
                        role: currentIdentification.role?.trim() || ownerRoleLabel,
                        cohort: currentIdentification.cohort?.trim() || `ID ${scopedIdLabel}`,
                        startDate: currentIdentification.startDate?.trim() || today,
                    },
                }),
            )
        }

        return () => {
            storageProto.getItem = originalGetItem
            storageProto.setItem = originalSetItem
            storageProto.removeItem = originalRemoveItem
        }
    }, [ownerName, ownerRoleLabel, slug, workbookId])

    return (
        <div className="workbook-digital-shell">
            <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[70] md:inset-x-auto md:bottom-auto md:right-4 md:top-24">
                <div className="ml-auto w-fit max-w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.10)] backdrop-blur">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <Fingerprint size={14} />
                        ID único
                    </div>
                    <div className="mt-2 break-all text-sm font-semibold text-slate-900">{displayWorkbookId}</div>
                    <div className="mt-1 text-xs text-slate-500">{ownerName}</div>
                </div>
            </div>

            {children}

            <style jsx global>{`
                .workbook-digital-shell [data-cover-page='true'] > div:last-child > h2,
                .workbook-digital-shell [data-cover-page='true'] > div:last-child > .mt-5,
                .workbook-digital-shell [data-cover-page='true'] > div:last-child > .mt-6 > button:first-child,
                .workbook-digital-shell [data-cover-page='true'] p.text-blue-600.text-sm {
                    display: none !important;
                }

                .workbook-digital-shell [data-cover-page='true'] > div:last-child {
                    padding-top: 1.25rem !important;
                }
            `}</style>
        </div>
    )
}
