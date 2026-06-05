'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    History,
    Image as ImageIcon,
    Layers,
    Loader2,
    Save,
    Send,
    Upload
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { requestApi } from '@/lib/api-client';
import {
    getWorkbookTemplate,
    listWorkbookTemplateVersions,
    publishWorkbookTemplateVersion,
    updateWorkbookTemplateDraft,
    type WorkbookTemplateRecord,
    type WorkbookTemplateVersionRecord,
    type WorkbookTemplateContent,
} from '@/features/aprendizaje/template-client';

type Tab = 'cover' | 'structure' | 'versions';

interface PresignResponse {
    uploadUrl: string;
    url: string;
}

function formatDateTime(value: string | null) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
}

function cloneContent(content: WorkbookTemplateContent): WorkbookTemplateContent {
    return JSON.parse(JSON.stringify(content)) as WorkbookTemplateContent;
}

function StructureEditor({
    content,
    onChange,
    disabled,
}: {
    content: WorkbookTemplateContent;
    onChange: (next: WorkbookTemplateContent) => void;
    disabled?: boolean;
}) {
    function updateSection(sectionId: string, mutate: (section: WorkbookTemplateContent['sections'][number]) => void) {
        const next = cloneContent(content);
        const section = next.sections.find((s) => s.id === sectionId);
        if (!section) return;
        mutate(section);
        onChange(next);
    }

    function updateGroup(sectionId: string, groupId: string, mutate: (group: WorkbookTemplateContent['sections'][number]['groups'][number]) => void) {
        updateSection(sectionId, (section) => {
            const group = section.groups.find((g) => g.id === groupId);
            if (!group) return;
            mutate(group);
        });
    }

    function updateField(sectionId: string, groupId: string, fieldId: string, mutate: (field: WorkbookTemplateContent['sections'][number]['groups'][number]['fields'][number]) => void) {
        updateGroup(sectionId, groupId, (group) => {
            const field = group.fields.find((f) => f.id === fieldId);
            if (!field) return;
            mutate(field);
        });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Metadatos del workbook</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block">
                        <span className="text-xs font-semibold text-slate-700">Título</span>
                        <input
                            type="text"
                            disabled={disabled}
                            value={content.title}
                            onChange={(event) => onChange({ ...content, title: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-semibold text-slate-700">Pilar</span>
                        <input
                            type="text"
                            disabled={disabled}
                            value={content.pillar}
                            onChange={(event) => onChange({ ...content, pillar: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-xs font-semibold text-slate-700">Resumen</span>
                        <textarea
                            disabled={disabled}
                            rows={2}
                            value={content.summary}
                            onChange={(event) => onChange({ ...content, summary: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-xs font-semibold text-slate-700">Objetivo</span>
                        <textarea
                            disabled={disabled}
                            rows={3}
                            value={content.objective}
                            onChange={(event) => onChange({ ...content, objective: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                    </label>
                </div>
            </div>

            {content.sections.map((section, sectionIndex) => (
                <details
                    key={section.id}
                    className="rounded-2xl border border-slate-200 bg-white"
                    open={sectionIndex < 2}
                >
                    <summary className="cursor-pointer rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                        Sección {sectionIndex + 1}: {section.label}{' '}
                        <span className="text-xs font-normal text-slate-500">({section.groups.length} grupos)</span>
                    </summary>
                    <div className="space-y-3 p-4">
                        <label className="block">
                            <span className="text-xs font-semibold text-slate-700">Etiqueta de la sección</span>
                            <input
                                type="text"
                                disabled={disabled}
                                value={section.label}
                                onChange={(event) => updateSection(section.id, (s) => { s.label = event.target.value })}
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-semibold text-slate-700">Propósito</span>
                            <textarea
                                disabled={disabled}
                                rows={2}
                                value={section.purpose}
                                onChange={(event) => updateSection(section.id, (s) => { s.purpose = event.target.value })}
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                            />
                        </label>

                        {section.groups.map((group) => (
                            <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                        Grupo · {group.kind ?? 'questions'}
                                        {group.aiAutofill ? ' · IA' : ''}
                                    </p>
                                    <span className="text-xs text-slate-500">{group.fields.length} campos</span>
                                </div>
                                <label className="mt-2 block">
                                    <span className="text-xs font-semibold text-slate-700">Título del grupo</span>
                                    <input
                                        type="text"
                                        disabled={disabled}
                                        value={group.title ?? ''}
                                        onChange={(event) => updateGroup(section.id, group.id, (g) => { g.title = event.target.value })}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                                    />
                                </label>
                                <label className="mt-2 block">
                                    <span className="text-xs font-semibold text-slate-700">Descripción del grupo (opcional)</span>
                                    <textarea
                                        disabled={disabled}
                                        rows={2}
                                        value={group.description ?? ''}
                                        onChange={(event) => updateGroup(section.id, group.id, (g) => { g.description = event.target.value })}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                                    />
                                </label>

                                <div className="mt-3 space-y-3">
                                    {group.fields.map((field, fieldIndex) => (
                                        <div key={field.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-xs font-bold text-slate-500">
                                                Campo {fieldIndex + 1} · <span className="font-mono text-[10px] text-slate-400">{field.id}</span>
                                                {field.aiSuggested && (
                                                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                                                        IA
                                                    </span>
                                                )}
                                            </p>
                                            <label className="mt-1 block">
                                                <span className="text-xs font-semibold text-slate-700">Pregunta / etiqueta</span>
                                                <input
                                                    type="text"
                                                    disabled={disabled}
                                                    value={field.label}
                                                    onChange={(event) =>
                                                        updateField(section.id, group.id, field.id, (f) => {
                                                            f.label = event.target.value;
                                                        })
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                                                />
                                            </label>
                                            <label className="mt-2 block">
                                                <span className="text-xs font-semibold text-slate-700">Texto de ayuda (opcional)</span>
                                                <textarea
                                                    disabled={disabled}
                                                    rows={2}
                                                    value={field.helper ?? ''}
                                                    onChange={(event) =>
                                                        updateField(section.id, group.id, field.id, (f) => {
                                                            f.helper = event.target.value;
                                                        })
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                                                />
                                            </label>
                                            <label className="mt-2 block">
                                                <span className="text-xs font-semibold text-slate-700">Placeholder (opcional)</span>
                                                <input
                                                    type="text"
                                                    disabled={disabled}
                                                    value={field.placeholder ?? ''}
                                                    onChange={(event) =>
                                                        updateField(section.id, group.id, field.id, (f) => {
                                                            f.placeholder = event.target.value;
                                                        })
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            ))}
        </div>
    );
}

export default function WorkbookTemplateEditorPage() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug ?? '';
    const { currentRole } = useUser();
    const canEdit = currentRole === 'admin' || currentRole === 'gestor';

    const [tab, setTab] = React.useState<Tab>('cover');
    const [template, setTemplate] = React.useState<WorkbookTemplateRecord | null>(null);
    const [versions, setVersions] = React.useState<WorkbookTemplateVersionRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [editingContent, setEditingContent] = React.useState<WorkbookTemplateContent | null>(null);
    const [editingCover, setEditingCover] = React.useState<string | null>(null);
    const [isDirty, setIsDirty] = React.useState(false);

    const [saving, setSaving] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [publishing, setPublishing] = React.useState(false);
    const [publishNotes, setPublishNotes] = React.useState('');
    const [feedback, setFeedback] = React.useState<{ kind: 'success' | 'error'; message: string } | null>(null);

    const loadAll = React.useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        setError(null);
        try {
            const [tpl, vers] = await Promise.all([
                getWorkbookTemplate(slug),
                listWorkbookTemplateVersions(slug).catch(() => [] as WorkbookTemplateVersionRecord[]),
            ]);
            setTemplate(tpl);
            setVersions(vers);
            setEditingContent(tpl.draftContent ?? tpl.publishedContent);
            setEditingCover(tpl.draftCoverImageUrl ?? tpl.coverImageUrl);
            setIsDirty(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar la plantilla.');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    React.useEffect(() => {
        void loadAll();
    }, [loadAll]);

    async function handleSaveDraft() {
        if (!template || !editingContent) return;
        setSaving(true);
        setFeedback(null);
        try {
            const result = await updateWorkbookTemplateDraft(slug, {
                content: editingContent,
                coverImageUrl: editingCover ?? null,
            });
            setTemplate(result);
            setIsDirty(false);
            setFeedback({ kind: 'success', message: 'Borrador guardado.' });
        } catch (err) {
            setFeedback({
                kind: 'error',
                message: err instanceof Error ? err.message : 'No se pudo guardar el borrador.',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handlePublish() {
        if (!template) return;
        if (isDirty) {
            setFeedback({ kind: 'error', message: 'Guarda el borrador antes de publicar.' });
            return;
        }
        if (!confirm('¿Publicar esta versión? Los nuevos workbooks de los líderes la usarán como base.')) {
            return;
        }
        setPublishing(true);
        setFeedback(null);
        try {
            const result = await publishWorkbookTemplateVersion(slug, publishNotes.trim() || null);
            const refreshedVersions = await listWorkbookTemplateVersions(slug);
            setTemplate(result);
            setVersions(refreshedVersions);
            setPublishNotes('');
            setFeedback({
                kind: 'success',
                message: `Versión ${result.publishedVersionNo} publicada. Los nuevos workbooks usarán este snapshot.`,
            });
        } catch (err) {
            setFeedback({
                kind: 'error',
                message: err instanceof Error ? err.message : 'No se pudo publicar.',
            });
        } finally {
            setPublishing(false);
        }
    }

    async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setFeedback({ kind: 'error', message: 'La imagen no puede superar 8 MB.' });
            return;
        }
        setUploading(true);
        setFeedback(null);
        try {
            const presign = await requestApi<PresignResponse>('/api/v1/uploads/r2/presign', {
                method: 'POST',
                body: JSON.stringify({
                    fileName: `${slug}-cover-${Date.now()}-${file.name}`,
                    fileType: file.type || 'image/png',
                    fileSize: file.size,
                    moduleCode: 'aprendizaje',
                    action: 'update',
                    pathPrefix: `aprendizaje/templates/${slug}/cover`,
                    fieldName: 'workbook_cover',
                    entityTable: 'app_learning.workbook_templates',
                }),
            });
            const putResponse = await fetch(presign.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type || 'image/png' },
                body: file,
            });
            if (!putResponse.ok) {
                throw new Error(`R2 upload failed (${putResponse.status})`);
            }
            setEditingCover(presign.url);
            setIsDirty(true);
            setFeedback({ kind: 'success', message: 'Imagen subida. Recuerda guardar y publicar.' });
        } catch (err) {
            setFeedback({
                kind: 'error',
                message: err instanceof Error ? err.message : 'No se pudo subir la imagen.',
            });
        } finally {
            setUploading(false);
        }
    }

    if (!slug) return null;

    if (!canEdit) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                Solo administradores o gestores pueden editar la plantilla de los workbooks.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="animate-spin text-[var(--brand-primary)]" size={28} />
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                {error ?? 'Plantilla no encontrada.'}
            </div>
        );
    }

    const previewCover = editingCover ?? template.coverImageUrl;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/dashboard/aprendizaje?tab=workbooks"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
                >
                    <ArrowLeft size={14} /> Volver a workbooks
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/dashboard/aprendizaje/workbooks/${slug}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        <Eye size={12} /> Vista previa
                    </Link>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving || !isDirty}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Guardar borrador
                    </button>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishing || isDirty}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                    >
                        {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Publicar versión
                    </button>
                </div>
            </div>

            <PageTitle
                title={`Editor de plantilla · ${template.workbookCode}`}
                subtitle={`${template.title} · versión publicada actual: ${template.publishedVersionNo || 'sin publicar'}`}
            />

            {feedback && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                        feedback.kind === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {template.hasDraft && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    Hay un <strong>borrador sin publicar</strong> actualizado el {formatDateTime(template.draftUpdatedAt)}. Los workbooks de los líderes aún ven la versión {template.publishedVersionNo || 'inicial'}.
                </div>
            )}

            <div className="flex flex-wrap gap-2 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setTab('cover')}
                    className={`-mb-px inline-flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-semibold ${
                        tab === 'cover'
                            ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ImageIcon size={14} /> Carátula
                </button>
                <button
                    type="button"
                    onClick={() => setTab('structure')}
                    className={`-mb-px inline-flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-semibold ${
                        tab === 'structure'
                            ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Layers size={14} /> Estructura
                </button>
                <button
                    type="button"
                    onClick={() => setTab('versions')}
                    className={`-mb-px inline-flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-semibold ${
                        tab === 'versions'
                            ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <History size={14} /> Versiones ({versions.length})
                </button>
            </div>

            {tab === 'cover' && (
                <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                    <div className="space-y-3">
                        <p className="text-sm text-slate-700">
                            La imagen de carátula se muestra en la tarjeta del workbook en{' '}
                            <code>/dashboard/aprendizaje?tab=workbooks</code> y como banner en la portada del PDF generado por
                            el líder. Recomendado: <strong>1600×900px</strong>, formato PNG o JPG, peso menor a 8 MB.
                        </p>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploading ? 'Subiendo…' : 'Subir nueva imagen'}
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleCoverUpload}
                                disabled={uploading}
                            />
                        </label>
                        {editingCover && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCover(null);
                                    setIsDirty(true);
                                }}
                                className="ml-2 text-xs font-semibold text-rose-700 hover:underline"
                            >
                                Quitar carátula
                            </button>
                        )}
                    </div>
                    <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {previewCover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewCover} alt="Carátula" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                Sin imagen de carátula
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'structure' && editingContent && (
                <StructureEditor
                    content={editingContent}
                    disabled={false}
                    onChange={(next) => {
                        setEditingContent(next);
                        setIsDirty(true);
                    }}
                />
            )}

            {tab === 'versions' && (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Publicar nueva versión
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                            Al publicar, el borrador actual se congela como un snapshot. Sólo los nuevos workbooks de los líderes verán esta versión; los que ya están instanciados conservan su contenido.
                        </p>
                        <textarea
                            placeholder="Notas opcionales para esta versión (qué cambió, por qué)…"
                            value={publishNotes}
                            onChange={(event) => setPublishNotes(event.target.value)}
                            rows={2}
                            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={publishing || isDirty}
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                        >
                            {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Publicar versión {(template.publishedVersionNo ?? 0) + 1}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white">
                        {versions.length === 0 ? (
                            <p className="p-4 text-sm text-slate-500">Aún no hay versiones publicadas.</p>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                                {versions.map((version) => (
                                    <li key={version.versionId} className="flex items-start justify-between gap-3 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Versión {version.versionNo}
                                                {version.versionNo === template.publishedVersionNo && (
                                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                        <CheckCircle2 size={10} /> Vigente
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Publicada {formatDateTime(version.publishedAt)}
                                                {version.publishedByName ? ` · por ${version.publishedByName}` : ''}
                                            </p>
                                            {version.notes && (
                                                <p className="mt-1 text-xs italic text-slate-600">{version.notes}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
