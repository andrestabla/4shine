'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { updateLearningWorkbook } from '@/features/aprendizaje/client'

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
    const lastSyncedProgressRef = React.useRef<number | null>(null)
    const [detectedProgress, setDetectedProgress] = React.useState<number | null>(null)

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

    React.useEffect(() => {
        if (typeof window === 'undefined') return

        const readProgress = () => {
            const progressNode = document.querySelector<HTMLElement>('.workbook-progress-pill')
            const progressText = progressNode?.textContent ?? ''
            const match = progressText.match(/(\d{1,3})\s*%/)
            if (!match) return

            const nextProgress = Math.max(0, Math.min(100, Number.parseInt(match[1], 10)))
            setDetectedProgress((current) => (current === nextProgress ? current : nextProgress))
        }

        readProgress()

        const observer = new MutationObserver(readProgress)
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    React.useEffect(() => {
        if (workbookId === 'preview' || detectedProgress === null) {
            return
        }

        if (lastSyncedProgressRef.current === detectedProgress) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            lastSyncedProgressRef.current = detectedProgress

            void updateLearningWorkbook(workbookId, {
                completionPercent: detectedProgress,
            }).catch((error) => {
                console.error('Failed to sync workbook progress', error)
            })
        }, 600)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [detectedProgress, workbookId])

    return (
        <div className="workbook-digital-shell">
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

                @media (max-width: 1023px) {
                    .workbook-digital-shell .wbv2-main {
                        padding-left: 0.75rem !important;
                        padding-right: 0.75rem !important;
                    }

                    .workbook-digital-shell .wb1-toolbar > div,
                    .workbook-digital-shell .wb2-toolbar > div,
                    .workbook-digital-shell .wb3-toolbar > div,
                    .workbook-digital-shell .wb4-toolbar > div,
                    .workbook-digital-shell .wb5-toolbar > div,
                    .workbook-digital-shell .wb6-toolbar > div,
                    .workbook-digital-shell .wb7-toolbar > div,
                    .workbook-digital-shell .wb8-toolbar > div {
                        align-items: stretch !important;
                    }

                    .workbook-digital-shell .wb1-toolbar button,
                    .workbook-digital-shell .wb1-toolbar a,
                    .workbook-digital-shell .wb2-toolbar button,
                    .workbook-digital-shell .wb2-toolbar a,
                    .workbook-digital-shell .wb3-toolbar button,
                    .workbook-digital-shell .wb3-toolbar a,
                    .workbook-digital-shell .wb4-toolbar button,
                    .workbook-digital-shell .wb4-toolbar a,
                    .workbook-digital-shell .wb5-toolbar button,
                    .workbook-digital-shell .wb5-toolbar a,
                    .workbook-digital-shell .wb6-toolbar button,
                    .workbook-digital-shell .wb6-toolbar a,
                    .workbook-digital-shell .wb7-toolbar button,
                    .workbook-digital-shell .wb7-toolbar a,
                    .workbook-digital-shell .wb8-toolbar button,
                    .workbook-digital-shell .wb8-toolbar a,
                    .workbook-digital-shell header button,
                    .workbook-digital-shell header a {
                        width: 100%;
                    }

                    .workbook-digital-shell .wb1-toolbar span,
                    .workbook-digital-shell .wb2-toolbar span,
                    .workbook-digital-shell .wb3-toolbar span,
                    .workbook-digital-shell .wb4-toolbar span,
                    .workbook-digital-shell .wb5-toolbar span,
                    .workbook-digital-shell .wb6-toolbar span,
                    .workbook-digital-shell .wb7-toolbar span,
                    .workbook-digital-shell .wb8-toolbar span {
                        width: fit-content;
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    )
}
