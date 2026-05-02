'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import {
    getLearningWorkbook,
    type WorkbookRecord,
    type WorkbookStatePayload,
    updateLearningWorkbook
} from '@/features/aprendizaje/client'

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
    if (role === 'mentor') return 'Adviser'
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

function collectScopedStatePayload(workbookId: string): WorkbookStatePayload {
    if (typeof window === 'undefined') {
        return {}
    }

    const prefix = `${workbookId}:`
    const payload: WorkbookStatePayload = {}

    for (let index = 0; index < window.localStorage.length; index += 1) {
        const scopedKey = window.localStorage.key(index)
        if (!scopedKey || !scopedKey.startsWith(prefix)) continue

        const rawValue = window.localStorage.getItem(scopedKey)
        if (typeof rawValue !== 'string') continue

        payload[scopedKey.slice(prefix.length)] = rawValue
    }

    return payload
}

function clearScopedStatePayload(rawStorage: StoragePrototype, workbookId: string) {
    if (typeof window === 'undefined') {
        return
    }

    const prefix = `${workbookId}:`
    const keysToRemove: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
        const scopedKey = window.localStorage.key(index)
        if (scopedKey?.startsWith(prefix)) {
            keysToRemove.push(scopedKey)
        }
    }

    for (const scopedKey of keysToRemove) {
        rawStorage.removeItem.call(window.localStorage, scopedKey)
    }
}

function hydrateScopedStatePayload(
    rawStorage: StoragePrototype,
    workbookId: string,
    payload: WorkbookStatePayload,
) {
    clearScopedStatePayload(rawStorage, workbookId)

    for (const [key, value] of Object.entries(payload)) {
        rawStorage.setItem.call(window.localStorage, `${workbookId}:${key}`, value)
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
    const fallbackOwnerName = searchParams.get('ownerName')?.trim() || currentUser?.name || 'Líder 4Shine'
    const ownerRoleLabel = roleLabel(currentRole)

    const scopeKey = React.useCallback(
        (key: string) => (shouldScopeStorageKey(key) ? `${workbookId}:${key}` : key),
        [workbookId],
    )

    const rawStorageRef = React.useRef<StoragePrototype | null>(null)
    const lastSyncedSnapshotRef = React.useRef('')
    const [storageVersion, setStorageVersion] = React.useState(0)
    const [detectedProgress, setDetectedProgress] = React.useState<number | null>(null)
    const [storageReady, setStorageReady] = React.useState(false)
    const [remoteReady, setRemoteReady] = React.useState(false)
    const [remoteWorkbook, setRemoteWorkbook] = React.useState<WorkbookRecord | null>(null)

    const injectIdentificationDefaults = React.useCallback((ownerName: string) => {
        if (typeof window === 'undefined' || !rawStorageRef.current) return

        const rawStorage = rawStorageRef.current
        const today = new Date().toISOString().slice(0, 10)
        const scopedIdLabel = workbookId === 'preview' ? 'PREVIEW' : workbookId.slice(0, 8).toUpperCase()

        const identificationFieldsKey = IDENTIFICATION_FIELDS_KEY_BY_SLUG[slug]
        if (identificationFieldsKey) {
            const current = safeJsonParse<Record<string, string>>(
                rawStorage.getItem.call(window.localStorage, scopeKey(identificationFieldsKey)),
                {},
            )

            rawStorage.setItem.call(
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
                rawStorage.getItem.call(window.localStorage, scopeKey(stateKey)),
                {},
            )
            const currentIdentification =
                current.identification && typeof current.identification === 'object'
                    ? (current.identification as Record<string, string>)
                    : {}

            rawStorage.setItem.call(
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
    }, [ownerRoleLabel, scopeKey, slug, workbookId])

    React.useEffect(() => {
        if (typeof window === 'undefined') return

        const storageProto = Object.getPrototypeOf(window.localStorage) as StoragePrototype
        const originalStorage: StoragePrototype = {
            getItem: storageProto.getItem,
            setItem: storageProto.setItem,
            removeItem: storageProto.removeItem,
        }
        rawStorageRef.current = originalStorage

        storageProto.getItem = (key: string) => {
            return originalStorage.getItem.call(window.localStorage, scopeKey(String(key)))
        }

        storageProto.setItem = (key: string, value: string) => {
            const normalizedKey = String(key)
            const result = originalStorage.setItem.call(
                window.localStorage,
                scopeKey(normalizedKey),
                value,
            )
            if (shouldScopeStorageKey(normalizedKey)) {
                setStorageVersion((current) => current + 1)
            }
            return result
        }

        storageProto.removeItem = (key: string) => {
            const normalizedKey = String(key)
            const result = originalStorage.removeItem.call(
                window.localStorage,
                scopeKey(normalizedKey),
            )
            if (shouldScopeStorageKey(normalizedKey)) {
                setStorageVersion((current) => current + 1)
            }
            return result
        }

        setStorageReady(true)

        return () => {
            storageProto.getItem = originalStorage.getItem
            storageProto.setItem = originalStorage.setItem
            storageProto.removeItem = originalStorage.removeItem
            rawStorageRef.current = null
        }
    }, [scopeKey])

    React.useEffect(() => {
        if (!storageReady) return

        let active = true

        const hydrate = async () => {
            if (workbookId === 'preview' || !rawStorageRef.current) {
                injectIdentificationDefaults(fallbackOwnerName)
                if (active) {
                    setRemoteWorkbook(null)
                    setRemoteReady(true)
                }
                return
            }

            setRemoteReady(false)

            try {
                const workbook = await getLearningWorkbook(workbookId)
                if (!active || !rawStorageRef.current) return

                const localPayload = collectScopedStatePayload(workbookId)
                const persistedPayload = workbook.statePayload
                const initialPayload =
                    Object.keys(persistedPayload).length > 0 ? persistedPayload : localPayload

                hydrateScopedStatePayload(rawStorageRef.current, workbookId, initialPayload)
                injectIdentificationDefaults(workbook.ownerName || fallbackOwnerName)

                const remoteSnapshot = JSON.stringify({
                    completionPercent: Math.max(0, Math.min(100, Math.round(workbook.completionPercent))),
                    statePayload: persistedPayload,
                })

                lastSyncedSnapshotRef.current = remoteSnapshot
                setDetectedProgress(Math.max(0, Math.min(100, Math.round(workbook.completionPercent))))
                setRemoteWorkbook(workbook)
            } catch (error) {
                console.error('Failed to hydrate workbook state', error)
                if (!active) return
                injectIdentificationDefaults(fallbackOwnerName)
            } finally {
                if (active) {
                    setRemoteReady(true)
                }
            }
        }

        void hydrate()

        return () => {
            active = false
        }
    }, [fallbackOwnerName, injectIdentificationDefaults, storageReady, workbookId])

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
    }, [remoteReady])

    React.useEffect(() => {
        if (!storageReady || !remoteReady || workbookId === 'preview') {
            return
        }

        const statePayload = collectScopedStatePayload(workbookId)
        const completionPercent =
            detectedProgress ?? Math.max(0, Math.min(100, Math.round(remoteWorkbook?.completionPercent ?? 0)))

        const nextSnapshot = JSON.stringify({
            completionPercent,
            statePayload,
        })

        if (nextSnapshot === lastSyncedSnapshotRef.current) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            void updateLearningWorkbook(workbookId, {
                completionPercent,
                statePayload,
            })
                .then((updatedWorkbook) => {
                    lastSyncedSnapshotRef.current = nextSnapshot
                    setRemoteWorkbook(updatedWorkbook)
                })
                .catch((error) => {
                    console.error('Failed to sync workbook state', error)
                })
        }, 800)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [detectedProgress, remoteReady, remoteWorkbook?.completionPercent, storageReady, storageVersion, workbookId])

    if (!storageReady || !remoteReady) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
                <div className="text-center">
                    <Loader2 size={34} className="mx-auto animate-spin text-[var(--brand-primary)]" />
                    <p className="mt-3 text-sm text-[var(--app-muted)]">
                        Preparando tu workbook con tu avance guardado...
                    </p>
                </div>
            </div>
        )
    }

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
                    .workbook-digital-shell .wb9-toolbar button,
                    .workbook-digital-shell .wb9-toolbar a,
                    .workbook-digital-shell .wb10-toolbar button,
                    .workbook-digital-shell .wb10-toolbar a {
                        width: 100% !important;
                        justify-content: center !important;
                    }

                    .workbook-digital-shell .wb1-cover-layout,
                    .workbook-digital-shell .wb2-cover-layout,
                    .workbook-digital-shell .wb3-cover-layout,
                    .workbook-digital-shell .wb4-cover-layout,
                    .workbook-digital-shell .wb5-cover-layout,
                    .workbook-digital-shell .wb6-cover-layout,
                    .workbook-digital-shell .wb7-cover-layout,
                    .workbook-digital-shell .wb8-cover-layout {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    )
}
