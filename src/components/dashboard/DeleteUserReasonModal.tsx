'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'

export type DeleteUserMode = 'self' | 'admin'

/**
 * Opciones predefinidas que cubren la mayoría de motivos reales de baja.
 * Si ninguna aplica, el usuario puede escribir un comentario libre.
 */
export const DELETE_REASON_OPTIONS_SELF: { value: string; label: string }[] = [
    { value: 'no_relevant_content', label: 'El contenido ya no es relevante para mí.' },
    { value: 'no_time', label: 'No tengo tiempo para seguir el programa.' },
    { value: 'switching_program', label: 'Me cambio a otro programa/plataforma.' },
    { value: 'privacy_concerns', label: 'Preocupación por mis datos y privacidad.' },
    { value: 'technical_issues', label: 'Problemas técnicos persistentes.' },
]

export const DELETE_REASON_OPTIONS_ADMIN: { value: string; label: string }[] = [
    { value: 'leader_request', label: 'El usuario lo solicitó por otra vía.' },
    { value: 'subscription_cancelled', label: 'Canceló o no renovó su suscripción.' },
    { value: 'duplicate_account', label: 'Cuenta duplicada o creada por error.' },
    { value: 'inactive_user', label: 'Usuario inactivo durante un periodo prolongado.' },
    { value: 'policy_violation', label: 'Incumplimiento de políticas de la plataforma.' },
]

interface DeleteUserReasonModalProps {
    mode: DeleteUserMode
    /** Nombre del usuario que se eliminará (para mostrar contexto en admin) */
    targetName?: string
    open: boolean
    onCancel: () => void
    onConfirm: (reason: string | null) => Promise<void> | void
    confirmingBusy?: boolean
}

export function DeleteUserReasonModal({
    mode,
    targetName,
    open,
    onCancel,
    onConfirm,
    confirmingBusy,
}: DeleteUserReasonModalProps) {
    const [selected, setSelected] = React.useState<string>('')
    const [comment, setComment] = React.useState<string>('')
    const [error, setError] = React.useState<string | null>(null)

    const options = mode === 'self' ? DELETE_REASON_OPTIONS_SELF : DELETE_REASON_OPTIONS_ADMIN

    React.useEffect(() => {
        if (open) {
            setSelected('')
            setComment('')
            setError(null)
            const previous = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            const onKey = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && !confirmingBusy) onCancel()
            }
            window.addEventListener('keydown', onKey)
            return () => {
                document.body.style.overflow = previous
                window.removeEventListener('keydown', onKey)
            }
        }
    }, [open, confirmingBusy, onCancel])

    if (!open || typeof document === 'undefined') return null

    async function handleConfirm() {
        const trimmedComment = comment.trim()
        if (!selected && trimmedComment.length === 0) {
            setError('Selecciona una opción o escribe un comentario.')
            return
        }
        // Si hay opción + comentario, se combinan; si sólo hay una, esa va.
        let finalReason: string | null = null
        if (selected) {
            const opt = options.find((o) => o.value === selected)
            finalReason = opt?.label ?? selected
            if (trimmedComment.length > 0) {
                finalReason = `${finalReason} · ${trimmedComment}`
            }
        } else {
            finalReason = trimmedComment
        }
        setError(null)
        await onConfirm(finalReason)
    }

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/65 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8"
            onClick={(event) => {
                if (event.target === event.currentTarget && !confirmingBusy) onCancel()
            }}
        >
            <div className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[85dvh] sm:max-w-xl sm:rounded-3xl">
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-rose-50 px-4 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
                            <Trash2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-rose-900 sm:text-base">
                                {mode === 'self' ? 'Eliminar mi cuenta' : `Eliminar a ${targetName ?? 'este usuario'}`}
                            </h2>
                            <p className="mt-1 text-xs text-rose-700">
                                {mode === 'self'
                                    ? 'Esta acción es permanente. Borra todos tus datos y tu historial. Antes de continuar, cuéntanos por qué te vas.'
                                    : 'Se borrarán todos los datos e historial del usuario. Esta acción no se puede deshacer. Indica el motivo.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={confirmingBusy}
                        className="shrink-0 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Motivo principal
                        </legend>
                        {options.map((option) => (
                            <label
                                key={option.value}
                                className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2.5 text-sm transition ${
                                    selected === option.value
                                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="delete-reason"
                                    value={option.value}
                                    checked={selected === option.value}
                                    onChange={() => {
                                        setSelected(option.value)
                                        setError(null)
                                    }}
                                    className="mt-0.5 h-4 w-4 accent-rose-600"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </fieldset>

                    <div className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Comentario (opcional)
                        </label>
                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(event) => {
                                setComment(event.target.value)
                                setError(null)
                            }}
                            placeholder="Si quieres aclarar tu motivo o no hay una opción que aplique, escríbelo aquí."
                            maxLength={1000}
                            className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            {comment.length}/1000
                        </p>
                    </div>

                    {error && (
                        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={confirmingBusy}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={confirmingBusy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 size={14} />
                        {confirmingBusy
                            ? 'Eliminando…'
                            : mode === 'self'
                              ? 'Eliminar mi cuenta'
                              : 'Eliminar usuario'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}
