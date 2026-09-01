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
    if (role === 'mentor') return 'Advisor'
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

/**
 * El estado del líder viaja en dos formatos incompatibles entre sí:
 *   A) una llave por campo  ("wb1v3-1-1": "texto"), que es lo que sube el
 *      autoguardado del runtime V3;
 *   B) un blob de localStorage ("workbooks-v2-wb1-v3-state": "{values:…}"),
 *      que es lo que el runtime LEE al arrancar.
 *
 * Sin traducir A → B, abrir un workbook ya diligenciado lo mostraba en blanco:
 * el servidor tenía las respuestas, pero el runtime buscaba una llave que no
 * existía. Aquí se sintetiza el blob a partir de los campos sueltos.
 */
function expandFieldPayload(slug: string, payload: WorkbookStatePayload): WorkbookStatePayload {
    const out: WorkbookStatePayload = { ...payload }
    const fields = Object.entries(payload).filter(([key, value]) => /^wb\d+v3-/.test(key) && String(value ?? '').trim())
    if (fields.length === 0) return out

    const blobKey = `workbooks-v2-${slug}-v3-state`

    // Los dos formatos pueden convivir en la misma cuenta, así que se FUSIONAN:
    // se parte del blob existente y encima se aplican los campos sueltos. Antes
    // se descartaba uno de los dos y un workbook con respuestas abría vacío.
    let values: Record<string, unknown> = {}
    let activePage = 0
    let lastSavedAt: unknown = null
    const existing = out[blobKey]
    if (typeof existing === 'string' && existing) {
        try {
            const parsed = JSON.parse(existing) as {
                values?: Record<string, unknown>
                activePage?: number
                lastSavedAt?: unknown
            }
            if (parsed?.values && typeof parsed.values === 'object') values = { ...parsed.values }
            if (typeof parsed?.activePage === 'number') activePage = parsed.activePage
            lastSavedAt = parsed?.lastSavedAt ?? null
        } catch {
            // Blob ilegible: se reconstruye desde los campos sueltos.
        }
    }
    // Los valores van como TEXTO PLANO, que es lo que el runtime serializa y
    // sabe leer: su parseFieldValue devuelve vacío para cualquier objeto, así
    // que escribirlos como { text } dejaba el workbook en blanco. Si el campo
    // trae audio o IA, ya viene como JSON en string y se pasa tal cual.
    for (const [id, text] of fields) values[id] = String(text)

    out[blobKey] = JSON.stringify({ values, activePage, lastSavedAt })
    return out
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

/**
 * Identidad del DUEÑO del workbook (no la de quien lo abre).
 *
 * El shell es el único que consulta el workbook remoto, así que es el único
 * que sabe de quién es. El runtime lo necesita para el PDF: al descargarlo
 * desde la cuenta de un gestor o advisor, la portada debe decir el nombre del
 * líder dueño, no el de quien oprimió el botón.
 */
export interface WorkbookOwnerIdentity {
    ownerName: string | null
    ownerUserId: string | null
    viewerIsOwner: boolean
    /**
     * true cuando se abrió el workbook de una persona (hay workbookId), aunque
     * no se haya podido resolver quién es. Sirve para NO caer nunca en el
     * nombre del visor: es preferible una etiqueta genérica a un PDF que
     * atribuya el workbook de un líder a quien lo descargó.
     */
    isRemoteWorkbook: boolean
}

const WorkbookOwnerContext = React.createContext<WorkbookOwnerIdentity>({
    ownerName: null,
    ownerUserId: null,
    viewerIsOwner: true,
    isRemoteWorkbook: false,
})

export function useWorkbookOwner(): WorkbookOwnerIdentity {
    return React.useContext(WorkbookOwnerContext)
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

    // `force` se usa cuando el workbook es de OTRA persona: ahí el nombre y el
    // rol del encabezado (y del PDF exportado) deben ser los del dueño, no los
    // de quien lo abre. Sin esto, un gestor o admin que revisaba el workbook
    // lo exportaba con su propio nombre.
    const injectIdentificationDefaults = React.useCallback((
        ownerName: string,
        roleLabelText: string = ownerRoleLabel,
        force: boolean = false,
    ) => {
        if (typeof window === 'undefined' || !rawStorageRef.current) return

        const pick = (currentValue: string | undefined, ownerValue: string) =>
            force ? ownerValue : currentValue?.trim() || ownerValue

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
                    leaderName: pick(current.leaderName, ownerName),
                    role: pick(current.role, roleLabelText),
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
                        leaderName: pick(currentIdentification.leaderName, ownerName),
                        role: pick(currentIdentification.role, roleLabelText),
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
                const persistedPayload = expandFieldPayload(slug, workbook.statePayload)
                const initialPayload =
                    Object.keys(persistedPayload).length > 0 ? persistedPayload : localPayload

                hydrateScopedStatePayload(rawStorageRef.current, workbookId, initialPayload)
                // Si el workbook no es de quien lo abre, se impone la identidad del
                // dueño (nombre y rol de líder), corrigiendo incluso lo que haya
                // quedado guardado antes con la identidad equivocada.
                const viewerIsOwner = !!currentUser?.id && workbook.ownerUserId === currentUser.id
                injectIdentificationDefaults(
                    workbook.ownerName || fallbackOwnerName,
                    viewerIsOwner ? ownerRoleLabel : roleLabel('lider'),
                    !viewerIsOwner,
                )

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
        // Mismo criterio que el runtime: un estado vacío no se sincroniza,
        // porque solo puede destruir lo que el líder ya escribió.
        if (Object.keys(statePayload).length === 0) {
            return
        }

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

    const viewerIsOwner = !currentUser?.id || !remoteWorkbook?.ownerUserId
        || remoteWorkbook.ownerUserId === currentUser.id
    const canEditOthers = currentRole === 'admin' || currentRole === 'gestor'

    const ownerIdentity: WorkbookOwnerIdentity = {
        ownerName: remoteWorkbook?.ownerName ?? null,
        ownerUserId: remoteWorkbook?.ownerUserId ?? null,
        viewerIsOwner,
        isRemoteWorkbook: workbookId !== 'preview',
    }

    return (
        <div className="workbook-digital-shell">
            {!viewerIsOwner && (
                // Gestor y admin sí pueden intervenir el workbook de un líder,
                // pero solo con un guardado explícito. El resto (advisor) lo ve
                // en lectura, porque el servidor ignora sus escrituras.
                <div className="mx-auto mb-3 max-w-5xl px-4">
                    <p className={`rounded-[0.9rem] border px-4 py-2.5 text-[12.6px] font-semibold ${
                        canEditOthers
                            ? 'border-[var(--brand-accent)]/45 bg-[var(--brand-accent)]/10 text-[var(--brand-primary)]'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}>
                        {canEditOthers ? (
                            <>
                                Estás en el workbook de {remoteWorkbook?.ownerName || 'un líder'}. Para que tus
                                cambios queden en su cuenta usa <b>Guardar</b> o <b>Completar con IA</b>; lo que
                                escribas sin guardar no se conserva.
                            </>
                        ) : (
                            <>
                                Estás viendo el workbook de {remoteWorkbook?.ownerName || 'otro líder'} en modo
                                lectura. Lo que escribas aquí no se guarda en su cuenta.
                            </>
                        )}
                    </p>
                </div>
            )}
            <WorkbookOwnerContext.Provider value={ownerIdentity}>{children}</WorkbookOwnerContext.Provider>

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
