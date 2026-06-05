'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Download,
    Loader2,
    Mic,
    Pause,
    Play,
    Save,
    Sparkles,
    Square,
    Trash2,
    Upload,
    Wand2,
    X
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { useBranding } from '@/context/BrandingContext'
import { requestApi } from '@/lib/api-client'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'
import { WB1_V3_CONFIG, type WB1Field, type WB1Group, type WB1Section } from '@/lib/workbooks-v2-wb1'

type WB1FieldValue = {
    text: string
    audioUrl?: string
    audioDurationMs?: number
    audioMimeType?: string
    aiGenerated?: boolean
    aiSuggestion?: string
    updatedAt?: string
}

type WB1RuntimeState = {
    values: Record<string, WB1FieldValue>
    activePage: number
    lastSavedAt: string | null
}

type PresignResponse = {
    uploadUrl: string
    url: string
    key: string
    bucket: string
    contentType: string
}

type TranscribeResponse = {
    text: string
}

type AnalysisFieldRef = { id: string; label: string }

type AnalysisResponse = {
    fields: Record<string, string>
    filled?: AnalysisFieldRef[]
    missing?: AnalysisFieldRef[]
    totalRequested?: number
    notes?: string
}

const STORAGE_KEY = WB1_V3_CONFIG.storageKey
const ELEVATED_ROLES = new Set(['admin', 'gestor', 'mentor'])

function parseFieldValue(raw: unknown): WB1FieldValue {
    if (typeof raw === 'string') {
        if (!raw) return { text: '' }
        if (raw.startsWith('{') || raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw)
                if (parsed && typeof parsed === 'object' && 'text' in parsed) {
                    return parsed as WB1FieldValue
                }
            } catch {
                return { text: raw }
            }
        }
        return { text: raw }
    }
    return { text: '' }
}

function serializeFieldValue(value: WB1FieldValue): string {
    if (!value.audioUrl && !value.aiGenerated && !value.aiSuggestion) {
        return value.text ?? ''
    }
    return JSON.stringify(value)
}

function buildInitialValues() {
    const seed: Record<string, WB1FieldValue> = {}
    for (const section of WB1_V3_CONFIG.sections) {
        for (const group of section.groups) {
            for (const field of group.fields) {
                seed[field.id] = { text: '' }
            }
        }
    }
    return seed
}

function allFields() {
    return WB1_V3_CONFIG.sections.flatMap((section) => section.groups).flatMap((group) => group.fields)
}

function countCompleted(values: Record<string, WB1FieldValue>) {
    let total = 0
    let done = 0
    for (const field of allFields()) {
        total += 1
        const value = values[field.id]
        if (value && (value.text?.trim().length || value.audioUrl)) done += 1
    }
    return { done, total }
}

function formatMillis(ms?: number | null): string {
    if (!ms || ms < 0) return '0:00'
    const seconds = Math.floor(ms / 1000)
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function getMicMimeType(): string {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4'
    ]
    if (typeof MediaRecorder === 'undefined') return ''
    for (const type of candidates) {
        if (MediaRecorder.isTypeSupported(type)) return type
    }
    return ''
}

async function uploadAudioToR2(
    blob: Blob,
    fieldId: string,
    workbookId: string,
    contentType: string,
): Promise<{ url: string }> {
    const extension =
        contentType.includes('webm') ? 'webm' :
        contentType.includes('ogg') ? 'ogg' :
        contentType.includes('mp4') ? 'm4a' :
        contentType.includes('mpeg') || contentType.includes('mp3') ? 'mp3' :
        contentType.includes('wav') ? 'wav' :
        'bin'
    const fileName = `${fieldId}-${Date.now()}.${extension}`
    const pathPrefix = `aprendizaje/workbooks/${workbookId}/audio`

    const presignPayload = await requestApi<PresignResponse>('/api/v1/uploads/r2/presign', {
        method: 'POST',
        body: JSON.stringify({
            fileName,
            fileType: contentType,
            fileSize: blob.size,
            moduleCode: 'aprendizaje',
            action: 'update',
            pathPrefix,
            fieldName: 'workbook_audio',
            entityTable: 'app_learning.user_workbooks'
        })
    })

    const putResponse = await fetch(presignPayload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob
    })
    if (!putResponse.ok) {
        throw new Error(`R2 upload failed (${putResponse.status})`)
    }

    return { url: presignPayload.url }
}

async function transcribeAudio(audioUrl: string, fieldId: string): Promise<TranscribeResponse> {
    return requestApi<TranscribeResponse>('/api/v1/modules/aprendizaje/workbooks/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audioUrl, fieldId, language: 'es' }),
        timeoutMs: 90000
    })
}

function translateMediaError(err: unknown): { code: 'denied' | 'unavailable' | 'inuse' | 'other'; message: string } {
    if (err instanceof Error) {
        const name = err.name || ''
        if (name === 'NotAllowedError' || name === 'SecurityError' || /Permission denied|permission/i.test(err.message)) {
            return {
                code: 'denied',
                message:
                    'El navegador bloqueó el acceso al micrófono. Resetea el permiso desde el ícono de la barra de URL o desde chrome://settings/content/microphone y recarga la página.'
            }
        }
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
            return {
                code: 'unavailable',
                message:
                    'No detectamos ningún micrófono. Conecta uno (o revisa Ajustes del sistema → Sonido → Entrada) y vuelve a intentar.'
            }
        }
        if (name === 'NotReadableError' || name === 'AbortError') {
            return {
                code: 'inuse',
                message:
                    'Otra aplicación está usando el micrófono (Zoom, Meet, Teams…). Ciérrala y vuelve a intentar.'
            }
        }
        return { code: 'other', message: err.message || 'No se pudo acceder al micrófono.' }
    }
    return { code: 'other', message: 'No se pudo acceder al micrófono.' }
}

function AudioRecorder({
    fieldId,
    value,
    onChange,
    workbookId,
    disabled,
    onTranscriptionComplete
}: {
    fieldId: string
    value: WB1FieldValue
    onChange: (next: WB1FieldValue) => void
    workbookId: string
    disabled?: boolean
    onTranscriptionComplete?: (text: string) => void
}) {
    const [recording, setRecording] = useState(false)
    const [paused, setPaused] = useState(false)
    const [elapsedMs, setElapsedMs] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [transcribing, setTranscribing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [needsPermissionGuide, setNeedsPermissionGuide] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<BlobPart[]>([])
    const startedAtRef = useRef<number>(0)
    const elapsedBeforePauseRef = useRef<number>(0)
    const intervalRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const audioUrl = value.audioUrl
    const audioDurationMs = value.audioDurationMs

    useEffect(() => {
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current)
            if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startTick = () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
        startedAtRef.current = Date.now()
        intervalRef.current = window.setInterval(() => {
            setElapsedMs(elapsedBeforePauseRef.current + (Date.now() - startedAtRef.current))
        }, 200)
    }

    const stopTick = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    async function startRecording() {
        setError(null)
        setNeedsPermissionGuide(false)
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setError('Tu navegador no soporta grabación de audio. Usa Chrome, Edge o Firefox actualizados.')
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const mimeType = getMicMimeType()
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
            chunksRef.current = []
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
            }
            recorder.onstop = handleStop
            mediaRecorderRef.current = recorder
            recorder.start(1000)
            elapsedBeforePauseRef.current = 0
            setElapsedMs(0)
            startTick()
            setRecording(true)
            setPaused(false)
        } catch (err) {
            const translated = translateMediaError(err)
            setError(translated.message)
            if (translated.code === 'denied') {
                setNeedsPermissionGuide(true)
            }
        }
    }

    function detectBrowser(): 'chrome' | 'edge' | 'safari' | 'firefox' | 'other' {
        if (typeof navigator === 'undefined') return 'other'
        const ua = navigator.userAgent
        if (/Edg\//.test(ua)) return 'edge'
        if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome'
        if (/Firefox\//.test(ua)) return 'firefox'
        if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari'
        return 'other'
    }

    function pauseRecording() {
        const recorder = mediaRecorderRef.current
        if (!recorder) return
        if (recorder.state === 'recording') {
            recorder.pause()
            stopTick()
            elapsedBeforePauseRef.current += Date.now() - startedAtRef.current
            setPaused(true)
        } else if (recorder.state === 'paused') {
            recorder.resume()
            startTick()
            setPaused(false)
        }
    }

    function stopRecording() {
        const recorder = mediaRecorderRef.current
        if (!recorder) return
        if (recorder.state !== 'inactive') recorder.stop()
        stopTick()
        setRecording(false)
        setPaused(false)
    }

    async function handleStop() {
        const stream = streamRef.current
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        const recorder = mediaRecorderRef.current
        const mimeType = recorder?.mimeType || 'audio/webm'
        const finalDuration = elapsedBeforePauseRef.current + (recording && !paused ? Date.now() - startedAtRef.current : 0)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        elapsedBeforePauseRef.current = 0

        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const localPreview = URL.createObjectURL(blob)
        setPreviewUrl(localPreview)

        if (!workbookId || workbookId === 'preview') {
            onChange({
                ...value,
                audioUrl: localPreview,
                audioDurationMs: finalDuration,
                audioMimeType: mimeType,
                updatedAt: new Date().toISOString()
            })
            return
        }

        setUploading(true)
        try {
            const { url } = await uploadAudioToR2(blob, fieldId, workbookId, mimeType)
            onChange({
                ...value,
                audioUrl: url,
                audioDurationMs: finalDuration,
                audioMimeType: mimeType,
                updatedAt: new Date().toISOString()
            })
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo subir el audio.'
            setError(message)
        } finally {
            setUploading(false)
        }
    }

    async function handleTranscribe() {
        if (!audioUrl) return
        if (audioUrl.startsWith('blob:')) {
            setError('Sube el audio para poder transcribirlo (necesitamos un workbookId real).')
            return
        }
        setError(null)
        setTranscribing(true)
        try {
            const { text } = await transcribeAudio(audioUrl, fieldId)
            const trimmed = (text ?? '').trim()
            if (trimmed) {
                onChange({
                    ...value,
                    text: value.text?.trim() ? `${value.text.trim()}\n${trimmed}` : trimmed,
                    updatedAt: new Date().toISOString()
                })
                onTranscriptionComplete?.(trimmed)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo transcribir el audio.'
            setError(message)
        } finally {
            setTranscribing(false)
        }
    }

    function handleDeleteAudio() {
        onChange({
            ...value,
            audioUrl: undefined,
            audioDurationMs: undefined,
            audioMimeType: undefined,
            updatedAt: new Date().toISOString()
        })
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
    }

    return (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
                {!recording && !audioUrl && (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={disabled || uploading}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1 font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                        <Mic size={12} /> Grabar audio
                    </button>
                )}

                {recording && (
                    <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 font-semibold text-white">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                            {paused ? 'Pausado' : 'Grabando'} · {formatMillis(elapsedMs)}
                        </span>
                        <button
                            type="button"
                            onClick={pauseRecording}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            {paused ? <Play size={12} /> : <Pause size={12} />}
                            {paused ? 'Reanudar' : 'Pausa'}
                        </button>
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800"
                        >
                            <Square size={12} /> Detener
                        </button>
                    </>
                )}

                {uploading && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                        <Loader2 size={12} className="animate-spin" /> Subiendo audio…
                    </span>
                )}

                {audioUrl && !recording && (
                    <>
                        <audio controls src={audioUrl} className="h-8 max-w-[280px]" />
                        {typeof audioDurationMs === 'number' && (
                            <span className="text-slate-500">{formatMillis(audioDurationMs)}</span>
                        )}
                        <button
                            type="button"
                            onClick={handleTranscribe}
                            disabled={transcribing}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--brand-focus)] disabled:opacity-60"
                        >
                            {transcribing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            {transcribing ? 'Transcribiendo…' : 'Transcribir'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteAudio}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500 hover:text-rose-600"
                        >
                            <Trash2 size={12} /> Borrar
                        </button>
                    </>
                )}
            </div>

            {error && <p className="mt-2 text-rose-700">{error}</p>}

            {needsPermissionGuide && (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-900">
                    <p className="font-semibold">¿Cómo permitir el micrófono?</p>
                    {detectBrowser() === 'chrome' || detectBrowser() === 'edge' ? (
                        <>
                            <p className="mt-1">Opción A — desde la barra de direcciones:</p>
                            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                                <li>
                                    Haz click en el ícono que aparece a la <span className="font-semibold">izquierda de la URL</span> (ajustes / sliders <span aria-hidden>🎚️</span> en Chrome reciente, o un mini icono de cámara/mic tachado <span aria-hidden>🚫🎤</span> si el navegador te bloqueó automáticamente).
                                </li>
                                <li>
                                    Abre <span className="font-semibold">Configuración del sitio</span> (o &ldquo;Permisos&rdquo;) y cambia <span className="font-semibold">Micrófono</span> a <span className="font-semibold">Permitir</span>.
                                </li>
                                <li>Recarga la página (⌘R / Ctrl R).</li>
                            </ol>
                            <p className="mt-2">
                                Opción B — directo en ajustes: pega esto en una pestaña nueva y permite <span className="font-semibold">4shine.co</span>:
                            </p>
                            <pre className="mt-1 select-all rounded-md bg-rose-100 px-2 py-1 text-[11px] text-rose-900">
chrome://settings/content/microphone
                            </pre>
                            <p className="mt-2">
                                Opción C — Mac: <span className="font-semibold">Ajustes del sistema → Privacidad y seguridad → Micrófono</span> y verifica que tu navegador (Chrome / Edge) tenga el toggle <span className="font-semibold">activado</span>. Luego recarga.
                            </p>
                        </>
                    ) : detectBrowser() === 'safari' ? (
                        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                            <li>
                                Menú <span className="font-semibold">Safari → Ajustes → Sitios web → Micrófono</span>.
                            </li>
                            <li>
                                Encuentra <span className="font-semibold">4shine.co</span> y cámbialo a <span className="font-semibold">Permitir</span>.
                            </li>
                            <li>Recarga la pestaña.</li>
                            <li>
                                Verifica también <span className="font-semibold">Ajustes del sistema → Privacidad y seguridad → Micrófono → Safari</span>.
                            </li>
                        </ol>
                    ) : detectBrowser() === 'firefox' ? (
                        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                            <li>
                                Click en el ícono de permisos a la izquierda de la URL (escudo o ajustes).
                            </li>
                            <li>
                                Quita el bloqueo del <span className="font-semibold">Micrófono</span> para 4shine.co.
                            </li>
                            <li>Recarga la pestaña.</li>
                            <li>
                                Mac: verifica <span className="font-semibold">Ajustes del sistema → Privacidad y seguridad → Micrófono → Firefox</span>.
                            </li>
                        </ol>
                    ) : (
                        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                            <li>
                                Abre los permisos del sitio en tu navegador (ícono junto a la URL o ajustes del navegador).
                            </li>
                            <li>
                                Permite el <span className="font-semibold">Micrófono</span> para 4shine.co y recarga.
                            </li>
                            <li>
                                Verifica también el permiso de micrófono a nivel del sistema operativo.
                            </li>
                        </ol>
                    )}
                </div>
            )}
        </div>
    )
}

function FieldEditor({
    field,
    value,
    onChange,
    workbookId,
    disabled
}: {
    field: WB1Field
    value: WB1FieldValue
    onChange: (next: WB1FieldValue) => void
    workbookId: string
    disabled?: boolean
}) {
    const rows = field.rows ?? (field.kind === 'long' ? 6 : field.kind === 'completion' ? 2 : 3)
    return (
        <div>
            <label className="block">
                <span className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                    {field.label}
                    {field.aiSuggested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-accent)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                            <Sparkles size={10} /> IA
                        </span>
                    )}
                    {value.aiGenerated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            Sugerencia IA
                        </span>
                    )}
                </span>
                {field.helper && <p className="-mt-1 mb-2 text-xs text-slate-500">{field.helper}</p>}
                <textarea
                    className="min-h-[80px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-focus)] disabled:cursor-not-allowed disabled:bg-slate-50"
                    rows={rows}
                    value={value.text}
                    placeholder={field.placeholder ?? 'Escribe aquí…'}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            text: event.target.value,
                            aiGenerated: false,
                            updatedAt: new Date().toISOString()
                        })
                    }
                />
            </label>
            <AudioRecorder
                fieldId={field.id}
                value={value}
                onChange={onChange}
                workbookId={workbookId}
                disabled={disabled}
            />
        </div>
    )
}

function GroupEditor({
    group,
    values,
    onFieldChange,
    workbookId,
    disabled,
    onAutofill,
    autofillBusy,
    autofillStatus
}: {
    group: WB1Group
    values: Record<string, WB1FieldValue>
    onFieldChange: (fieldId: string, next: WB1FieldValue) => void
    workbookId: string
    disabled?: boolean
    onAutofill?: (group: WB1Group) => void
    autofillBusy?: boolean
    autofillStatus?: { kind: 'success' | 'error' | 'empty'; message: string } | null
}) {
    const completedInGroup = group.fields.reduce(
        (acc, field) => acc + (values[field.id]?.text?.trim() || values[field.id]?.audioUrl ? 1 : 0),
        0
    )

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                    {group.title && <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>}
                    {group.description && <p className="mt-1 text-sm text-slate-500">{group.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                        {completedInGroup} / {group.fields.length} campos
                    </div>
                    {group.aiAutofill && onAutofill && (
                        <button
                            type="button"
                            onClick={() => onAutofill(group)}
                            disabled={autofillBusy || disabled}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/25 focus:outline-none focus:ring-2 focus:ring-[var(--brand-focus)] disabled:opacity-60"
                        >
                            {autofillBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {group.aiAutofillCta ?? 'Autocompletar con IA'}
                        </button>
                    )}
                </div>
            </div>
            {autofillStatus && (
                <div
                    className={`mt-3 rounded-2xl border px-3 py-2 text-xs ${
                        autofillStatus.kind === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : autofillStatus.kind === 'empty'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                >
                    {autofillStatus.message}
                </div>
            )}
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {group.fields.map((field) => (
                    <FieldEditor
                        key={field.id}
                        field={field}
                        value={values[field.id] ?? { text: '' }}
                        onChange={(next) => onFieldChange(field.id, next)}
                        workbookId={workbookId}
                        disabled={disabled}
                    />
                ))}
            </div>
        </section>
    )
}

function SectionContent({
    section,
    values,
    onFieldChange,
    workbookId,
    disabled,
    onAutofill,
    autofillBusyGroupId,
    autofillStatusByGroupId
}: {
    section: WB1Section
    values: Record<string, WB1FieldValue>
    onFieldChange: (fieldId: string, next: WB1FieldValue) => void
    workbookId: string
    disabled?: boolean
    onAutofill: (group: WB1Group) => void
    autofillBusyGroupId: string | null
    autofillStatusByGroupId: Record<string, { kind: 'success' | 'error' | 'empty'; message: string } | null>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{section.label}</h2>
                <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">{section.purpose}</p>
            </div>

            {(section.concepts || section.prompts) && (
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    {section.concepts && section.concepts.length > 0 && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conceptos eje</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                {section.concepts.map((concept) => (
                                    <li key={concept}>• {concept}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {section.prompts && section.prompts.length > 0 && (
                        <div className="rounded-3xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Claves de trabajo</p>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--brand-primary)]">
                                {section.prompts.map((prompt) => (
                                    <li key={prompt}>• {prompt}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {section.narrative && section.narrative.length > 0 && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Contexto teórico</p>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-amber-950">
                        {section.narrative.map((block, index) => (
                            <div key={index}>
                                {block.title && <p className="font-semibold">{block.title}</p>}
                                <p className="mt-1 whitespace-pre-wrap">{block.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {section.groups.map((group) => (
                    <GroupEditor
                        key={group.id}
                        group={group}
                        values={values}
                        onFieldChange={onFieldChange}
                        workbookId={workbookId}
                        disabled={disabled}
                        onAutofill={onAutofill}
                        autofillBusy={autofillBusyGroupId === group.id}
                        autofillStatus={autofillStatusByGroupId[group.id] ?? null}
                    />
                ))}
            </div>
        </div>
    )
}

function TranscriptAnalysisModal({
    workbookId,
    onApply,
    onClose
}: {
    workbookId: string
    onApply: (fields: Record<string, string>) => void
    onClose: () => void
}) {
    const [transcript, setTranscript] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<AnalysisResponse | null>(null)

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [busy, onClose])

    async function handleAnalyze() {
        setBusy(true)
        setError(null)
        setResult(null)
        try {
            const response = await requestApi<AnalysisResponse>(
                '/api/v1/modules/aprendizaje/workbooks/analyze-transcript',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        workbookId,
                        templateCode: WB1_V3_CONFIG.code,
                        transcript: transcript.trim()
                    }),
                    timeoutMs: 180000
                }
            )
            onApply(response.fields ?? {})
            setResult(response)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo analizar la transcripción.'
            setError(message)
        } finally {
            setBusy(false)
        }
    }

    const totalRequested = result?.totalRequested ?? 0
    const filledCount = result?.filled?.length ?? 0
    const missingCount = result?.missing?.length ?? 0
    const successPercent =
        totalRequested > 0 ? Math.round((filledCount / totalRequested) * 100) : 0

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget && !busy) onClose()
            }}
        >
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[var(--brand-accent)]/10 px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[var(--brand-primary)] p-2 text-white">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                                Modo adviser · WB1
                            </p>
                            <h2 className="mt-1 text-base font-bold text-slate-900">
                                Completar el workbook con análisis IA
                            </h2>
                            <p className="mt-1 text-xs text-slate-600">
                                Pega la transcripción literal de la sesión. La IA va a redactar un borrador editable de todos
                                los campos de las 8 secciones del WB1 a partir de lo que el líder dijo.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => !busy && onClose()}
                        className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-40"
                        disabled={busy}
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {!result ? (
                        <>
                            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Transcripción de la sesión
                            </label>
                            <textarea
                                className="mt-2 min-h-[260px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-focus)]"
                                placeholder="Pega aquí la transcripción literal de la sesión (formato libre, sin marcadores especiales)…"
                                value={transcript}
                                onChange={(event) => setTranscript(event.target.value)}
                                disabled={busy}
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Mínimo 200 caracteres recomendados. La transcripción no se almacena: sólo se envía a OpenAI para
                                generar los borradores. Cuanto más literal y completa, mejor el resultado.
                            </p>
                            {error && (
                                <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-700" />
                                    <p className="text-sm font-bold text-emerald-900">
                                        Análisis IA completado
                                    </p>
                                </div>
                                <p className="mt-1 text-xs text-emerald-900">
                                    Se procesaron {totalRequested} campos. {filledCount} fueron completados ({successPercent}%)
                                    y {missingCount} quedaron en blanco porque la transcripción no tenía evidencia suficiente.
                                </p>
                                {result.notes && (
                                    <p className="mt-2 text-xs italic text-emerald-900">Nota IA: {result.notes}</p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                        Completados ({filledCount})
                                    </p>
                                    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1 text-xs text-slate-700">
                                        {(result.filled ?? []).map((field) => (
                                            <li key={field.id} className="flex items-start gap-1">
                                                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                                                <span>{field.label}</span>
                                            </li>
                                        ))}
                                        {(result.filled ?? []).length === 0 && (
                                            <li className="italic text-slate-500">Ningún campo completado.</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                                        Sin información ({missingCount})
                                    </p>
                                    <p className="mt-1 text-[11px] text-amber-900">
                                        Hay que completarlos manualmente en una nueva sesión o pedirle al líder que los
                                        responda.
                                    </p>
                                    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1 text-xs text-amber-900">
                                        {(result.missing ?? []).map((field) => (
                                            <li key={field.id} className="flex items-start gap-1">
                                                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-700" />
                                                <span>{field.label}</span>
                                            </li>
                                        ))}
                                        {(result.missing ?? []).length === 0 && (
                                            <li className="italic text-amber-700">Todos los campos quedaron cubiertos.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                Los borradores ya están aplicados al workbook con la etiqueta <em>Sugerencia IA</em>. Cierra
                                este informe y revísalos antes de guardar.
                            </p>
                        </div>
                    )}
                </div>

                <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
                    {!result ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={busy}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={busy || transcript.trim().length < 20}
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-focus)] disabled:opacity-50"
                            >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {busy ? 'Analizando…' : 'Completar con análisis IA'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]"
                        >
                            Cerrar y revisar borradores
                        </button>
                    )}
                </footer>
            </div>
        </div>
    )
}

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

function downloadHtml(values: Record<string, WB1FieldValue>) {
    const sections = WB1_V3_CONFIG.sections
        .map((section) => {
            const groups = section.groups
                .map((group) => {
                    const items = group.fields
                        .map((field) => {
                            const text = values[field.id]?.text?.trim()
                            if (!text) return ''
                            return `<div style="margin:0 0 12px 0;padding:10px 12px;border:1px solid #dbe4ee;border-radius:12px;background:#f8fafc;"><div style="font-size:12px;font-weight:700;color:#475569;">${escapeHtml(field.label)}</div><div style="margin-top:6px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(text)}</div></div>`
                        })
                        .filter(Boolean)
                        .join('')
                    if (!items) return ''
                    return `<section style="margin-top:16px;"><h3 style="font-size:16px;margin:0 0 8px 0;">${escapeHtml(group.title ?? '')}</h3>${items}</section>`
                })
                .join('')
            return `<section style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;"><h2 style="font-size:22px;margin:0 0 8px 0;">${escapeHtml(section.label)}</h2><p style="font-size:14px;color:#334155;">${escapeHtml(section.purpose)}</p>${groups}</section>`
        })
        .join('')

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>${escapeHtml(WB1_V3_CONFIG.code)} · ${escapeHtml(WB1_V3_CONFIG.title)}</title></head><body style="font-family:Arial,sans-serif;background:#f4f7fb;color:#0f172a;margin:0;padding:32px;"><main style="max-width:960px;margin:0 auto;background:#fff;border:1px solid #dbe4ee;border-radius:24px;padding:32px;"><div style="display:inline-flex;gap:8px;align-items:center;padding:6px 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(WB1_V3_CONFIG.code)} · ${escapeHtml(WB1_V3_CONFIG.pillar)}</div><h1 style="font-size:30px;margin:18px 0 10px 0;">${escapeHtml(WB1_V3_CONFIG.title)}</h1><p style="font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(WB1_V3_CONFIG.summary)}</p>${sections}</main></body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = WB1_V3_CONFIG.downloadFileName
    anchor.click()
    URL.revokeObjectURL(url)
}

export function WB1V3Runtime() {
    const searchParams = useSearchParams()
    const { currentRole, currentUser } = useUser()
    const { branding } = useBranding()
    const workbookId = searchParams.get('workbookId')?.trim() || 'preview'
    const isElevated = !!currentRole && ELEVATED_ROLES.has(currentRole)
    // Modo plantilla: admin/gestor/adviser entró desde el index de Aprendizaje
    // sin un workbookId concreto. Está viendo la plantilla base del WB,
    // no la instancia de un líder. En este modo deshabilitamos el flujo
    // de IA por sesión (necesita un workbook concreto del líder) y dejamos
    // marcado el banner correspondiente.
    const isTemplateView = isElevated && workbookId === 'preview'

    const pages = useMemo(
        () => [
            { id: 'intro', label: 'Presentación del workbook', shortLabel: 'Intro', section: null as WB1Section | null },
            ...WB1_V3_CONFIG.sections.map((section) => ({
                id: section.id,
                label: section.label,
                shortLabel: section.shortLabel,
                section
            }))
        ],
        []
    )

    const [values, setValues] = useState<Record<string, WB1FieldValue>>(() => buildInitialValues())
    const [activePage, setActivePage] = useState(0)
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
    const [hydrated, setHydrated] = useState(false)
    const [autofillBusyGroupId, setAutofillBusyGroupId] = useState<string | null>(null)
    const [autofillStatusByGroupId, setAutofillStatusByGroupId] = useState<
        Record<string, { kind: 'success' | 'error' | 'empty'; message: string } | null>
    >({})
    const [showAdminPanel, setShowAdminPanel] = useState(false)

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY)
            if (!raw) {
                setHydrated(true)
                return
            }
            const parsed = JSON.parse(raw) as { values?: Record<string, unknown>; activePage?: number; lastSavedAt?: string | null }
            const hydratedValues: Record<string, WB1FieldValue> = buildInitialValues()
            if (parsed.values && typeof parsed.values === 'object') {
                for (const [key, raw2] of Object.entries(parsed.values)) {
                    hydratedValues[key] = parseFieldValue(raw2)
                }
            }
            setValues(hydratedValues)
            setActivePage(Math.min(parsed.activePage ?? 0, pages.length - 1))
            setLastSavedAt(parsed.lastSavedAt ?? null)
        } catch {
            // ignore parse error
        } finally {
            setHydrated(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!hydrated) return
        const serialized: Record<string, string> = {}
        for (const [id, value] of Object.entries(values)) {
            serialized[id] = serializeFieldValue(value)
        }
        const payload: WB1RuntimeState = {
            values: Object.fromEntries(
                Object.entries(values).map(([id, value]) => [id, value])
            ),
            activePage,
            lastSavedAt
        }
        const flatPayload = {
            values: serialized,
            activePage: payload.activePage,
            lastSavedAt: payload.lastSavedAt
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flatPayload))
    }, [activePage, hydrated, lastSavedAt, values])

    const { done, total } = countCompleted(values)
    const completionPercent = total === 0 ? 0 : Math.round((done / total) * 100)

    function handleFieldChange(fieldId: string, next: WB1FieldValue) {
        setValues((previous) => ({ ...previous, [fieldId]: next }))
    }

    async function handleGroupAutofill(group: WB1Group) {
        setAutofillBusyGroupId(group.id)
        setAutofillStatusByGroupId((current) => ({ ...current, [group.id]: null }))
        try {
            const context = WB1_V3_CONFIG.sections
                .flatMap((section) => section.groups)
                .filter((g) => !g.aiAutofill)
                .map((g) => {
                    const items = g.fields
                        .map((field) => {
                            const text = values[field.id]?.text?.trim()
                            if (!text) return null
                            return `- ${field.label}\n  ${text}`
                        })
                        .filter(Boolean)
                        .join('\n')
                    return items ? `### ${g.title ?? g.id}\n${items}` : ''
                })
                .filter(Boolean)
                .join('\n\n')

            if (context.trim().length < 60) {
                setAutofillStatusByGroupId((current) => ({
                    ...current,
                    [group.id]: {
                        kind: 'empty',
                        message:
                            'Necesitas responder primero las preguntas previas de esta sección. La IA usa tus respuestas como base.'
                    }
                }))
                return
            }

            const result = await requestApi<AnalysisResponse>(
                '/api/v1/modules/aprendizaje/workbooks/analyze-transcript',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        workbookId,
                        templateCode: WB1_V3_CONFIG.code,
                        transcript: context,
                        mode: 'autofill',
                        targetFields: group.fields.map((field) => ({ id: field.id, label: field.label }))
                    }),
                    timeoutMs: 120000
                }
            )
            applyAiFields(result.fields ?? {})
            const filled = Object.values(result.fields ?? {}).filter((value) => value && value.trim().length > 0).length
            if (filled === 0) {
                setAutofillStatusByGroupId((current) => ({
                    ...current,
                    [group.id]: {
                        kind: 'empty',
                        message:
                            'La IA no encontró suficiente información en tus respuestas previas para completar esta tabla. Amplía las preguntas anteriores y vuelve a intentar.'
                    }
                }))
            } else {
                setAutofillStatusByGroupId((current) => ({
                    ...current,
                    [group.id]: {
                        kind: 'success',
                        message: `Se completaron ${filled} de ${group.fields.length} campos con sugerencias IA. Revisa y edita si lo necesitas.`
                    }
                }))
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo autocompletar.'
            setAutofillStatusByGroupId((current) => ({
                ...current,
                [group.id]: { kind: 'error', message }
            }))
        } finally {
            setAutofillBusyGroupId(null)
        }
    }

    function applyAiFields(fields: Record<string, string>) {
        setValues((previous) => {
            const next = { ...previous }
            for (const [id, text] of Object.entries(fields)) {
                if (typeof text !== 'string') continue
                const existing = next[id] ?? { text: '' }
                const trimmed = text.trim()
                if (!trimmed) continue
                next[id] = {
                    ...existing,
                    text: existing.text?.trim() ? existing.text : trimmed,
                    aiSuggestion: existing.text?.trim() ? trimmed : undefined,
                    aiGenerated: !existing.text?.trim(),
                    updatedAt: new Date().toISOString()
                }
            }
            return next
        })
    }

    if (!hydrated) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 size={28} className="animate-spin text-slate-500" />
            </div>
        )
    }

    const currentPage = pages[activePage]

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`${WORKBOOK_V2_EDITORIAL.classes.toolbar} wb1-toolbar`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={16} />
                        Volver
                    </Link>
                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            {WB1_V3_CONFIG.code} {WB1_V3_CONFIG.version} · {WB1_V3_CONFIG.pillar}
                        </p>
                        <h1 className="mt-1 text-base font-bold text-slate-900 md:text-lg">{WB1_V3_CONFIG.title}</h1>
                    </div>
                    <span className={`${WORKBOOK_V2_EDITORIAL.classes.progressPill} workbook-progress-pill`}>
                        {completionPercent}% completado
                    </span>
                    {lastSavedAt && (
                        <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>
                            Guardado{' '}
                            {new Date(lastSavedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        type="button"
                        className={WORKBOOK_V2_EDITORIAL.classes.saveButton}
                        onClick={() => setLastSavedAt(new Date().toISOString())}
                    >
                        <Save size={14} /> Guardar
                    </button>
                    <button
                        type="button"
                        className={WORKBOOK_V2_EDITORIAL.classes.pdfButton}
                        onClick={async () => {
                            const { downloadWb1Pdf } = await import('@/components/workbooks-v2/wb1-pdf-export')
                            await downloadWb1Pdf(
                                values,
                                currentUser?.name ?? 'Líder 4Shine',
                                branding.logoDarkUrl,
                            )
                        }}
                    >
                        <Download size={14} /> Descargar PDF
                    </button>
                    {isElevated && (
                        <button
                            type="button"
                            className={WORKBOOK_V2_EDITORIAL.classes.htmlButton}
                            onClick={() => downloadHtml(values)}
                        >
                            <Download size={14} /> HTML
                        </button>
                    )}
                    {isElevated && !isTemplateView && (
                        <button
                            type="button"
                            onClick={() => setShowAdminPanel(true)}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/25 focus:outline-none focus:ring-2 focus:ring-[var(--brand-focus)]"
                        >
                            <Sparkles size={12} />
                            Completar con IA
                        </button>
                    )}
                </div>
            </header>

            <div className="mx-auto grid max-w-[1280px] gap-6 px-3 py-6 sm:px-5 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)] wbv2-main">
                <aside className={WORKBOOK_V2_EDITORIAL.classes.sidebar}>
                    <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>Navegación</p>
                    <div className="space-y-2">
                        {pages.map((page, index) => {
                            const isActive = index === activePage
                            const isCompleted =
                                page.section &&
                                page.section.groups.some((group) =>
                                    group.fields.some((field) => {
                                        const value = values[field.id]
                                        return value?.text?.trim() || value?.audioUrl
                                    })
                                )
                            return (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => setActivePage(index)}
                                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                                        isActive
                                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <div
                                            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                                                isActive ? 'text-slate-300' : 'text-slate-400'
                                            }`}
                                        >
                                            Paso {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold">{page.shortLabel}</div>
                                    </div>
                                    {isCompleted && (
                                        <CheckCircle2 size={16} className={isActive ? 'text-emerald-300' : 'text-emerald-500'} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                <main className="space-y-6">
                    {isTemplateView && (
                        <div className="rounded-3xl border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-5 py-4 text-sm text-[var(--brand-primary)]">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
                                Modo plantilla
                            </p>
                            <p className="mt-1 leading-relaxed">
                                Estás viendo el contenido <strong>base</strong> del WB1 ({WB1_V3_CONFIG.code} {WB1_V3_CONFIG.version}). Las respuestas que escribas aquí <strong>no se guardan</strong>, son sólo previsualización para validar la plantilla.
                                Para abrir el WB1 de un líder en particular, entra desde su perfil 360 en <code>/dashboard/lideres</code>.
                            </p>
                            <p className="mt-2 text-xs text-[var(--brand-primary)]/80">
                                El editor de plantilla (cover image, secciones, preguntas) está en desarrollo.
                            </p>
                        </div>
                    )}
                    {isElevated && showAdminPanel && !isTemplateView && (
                        <TranscriptAnalysisModal
                            workbookId={workbookId}
                            onApply={applyAiFields}
                            onClose={() => setShowAdminPanel(false)}
                        />
                    )}
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                            <Sparkles size={14} />
                            {currentPage.label}
                        </div>

                        {!currentPage.section ? (
                            <div className="mt-5 space-y-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{WB1_V3_CONFIG.title}</h2>
                                    <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">
                                        {WB1_V3_CONFIG.summary}
                                    </p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Presentación
                                    </p>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                        {WB1_V3_CONFIG.introduction}
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Al finalizar tendrás
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {WB1_V3_CONFIG.deliverables.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Competencias 4Shine
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                            {WB1_V3_CONFIG.competencies.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Conductas observables asociadas
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                        {WB1_V3_CONFIG.observableBehaviours.map((item) => (
                                            <li key={item}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        Reglas de oro
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm text-amber-900">
                                        {WB1_V3_CONFIG.rules.map((rule) => (
                                            <li key={rule}>• {rule}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Cómo trabajar este workbook
                                    </p>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                        Puedes <strong>escribir</strong> tus respuestas o <strong>grabarlas por audio</strong>{' '}
                                        directamente en cada campo. La grabación se transcribe con un clic y queda lista para
                                        editar. Algunos campos están marcados con la etiqueta <em>IA</em>: la inteligencia
                                        artificial puede proponerte un primer borrador a partir de tus otras respuestas. Si eres
                                        admin, gestor o adviser, también puedes pegar la transcripción de la sesión de trabajo
                                        para que la IA proponga un borrador completo del workbook.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5">
                                <SectionContent
                                    section={currentPage.section}
                                    values={values}
                                    onFieldChange={handleFieldChange}
                                    workbookId={workbookId}
                                    onAutofill={handleGroupAutofill}
                                    autofillBusyGroupId={autofillBusyGroupId}
                                    autofillStatusByGroupId={autofillStatusByGroupId}
                                />
                            </div>
                        )}
                    </section>

                    {currentPage.section?.id === 'cierre' && (
                        <section className="rounded-3xl border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                                Cierre reflexivo
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--brand-primary)]">
                                {WB1_V3_CONFIG.closing}
                            </p>
                        </section>
                    )}

                    <div className={WORKBOOK_V2_EDITORIAL.classes.bottomNav}>
                        <button
                            type="button"
                            onClick={() => setActivePage((previous) => Math.max(previous - 1, 0))}
                            disabled={activePage === 0}
                            className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}
                        >
                            <ArrowLeft size={16} /> Atrás
                        </button>
                        <div className="text-center text-sm text-slate-500">
                            Paso {activePage + 1} de {pages.length}
                        </div>
                        <button
                            type="button"
                            onClick={() => setActivePage((previous) => Math.min(previous + 1, pages.length - 1))}
                            disabled={activePage === pages.length - 1}
                            className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}
                        >
                            Siguiente <ArrowRight size={16} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
