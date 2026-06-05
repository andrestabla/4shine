import type { PoolClient } from 'pg';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { WB1_V3_CONFIG, type WB1Config } from '@/lib/workbooks-v2-wb1';
import { WB2_V3_CONFIG } from '@/lib/workbooks-v2-wb2';
import { WB3_V3_CONFIG } from '@/lib/workbooks-v2-wb3';
import { WB4_V3_CONFIG } from '@/lib/workbooks-v2-wb4';
import { WB5_V3_CONFIG } from '@/lib/workbooks-v2-wb5';
import { WB6_V3_CONFIG } from '@/lib/workbooks-v2-wb6';
import { WB7_V3_CONFIG } from '@/lib/workbooks-v2-wb7';
import { WB8_V3_CONFIG } from '@/lib/workbooks-v2-wb8';

export type WorkbookTemplateContent = WB1Config;

export interface WorkbookCoverConfig {
    overlayHex: string;
    overlayOpacity: number;
    kicker: string | null;
    title: string | null;
    summary: string | null;
}

export const DEFAULT_COVER_CONFIG: WorkbookCoverConfig = {
    overlayHex: '#0D1B2A',
    overlayOpacity: 0.55,
    kicker: null,
    title: null,
    summary: null,
};

function normalizeCoverConfig(raw: unknown): WorkbookCoverConfig {
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_COVER_CONFIG };
    const value = raw as Record<string, unknown>;
    const overlayOpacityNum = typeof value.overlayOpacity === 'number' ? value.overlayOpacity : Number(value.overlayOpacity);
    return {
        overlayHex:
            typeof value.overlayHex === 'string' && /^#[0-9a-f]{6}$/i.test(value.overlayHex)
                ? value.overlayHex
                : DEFAULT_COVER_CONFIG.overlayHex,
        overlayOpacity: Number.isFinite(overlayOpacityNum)
            ? Math.max(0, Math.min(1, overlayOpacityNum))
            : DEFAULT_COVER_CONFIG.overlayOpacity,
        kicker: typeof value.kicker === 'string' && value.kicker.trim().length > 0 ? value.kicker.trim().slice(0, 80) : null,
        title: typeof value.title === 'string' && value.title.trim().length > 0 ? value.title.trim().slice(0, 200) : null,
        summary: typeof value.summary === 'string' && value.summary.trim().length > 0 ? value.summary.trim().slice(0, 480) : null,
    };
}

const TEMPLATE_FALLBACK_BY_CODE: Record<string, WorkbookTemplateContent> = {
    WB1: WB1_V3_CONFIG,
    WB2: WB2_V3_CONFIG,
    WB3: WB3_V3_CONFIG,
    WB4: WB4_V3_CONFIG,
    WB5: WB5_V3_CONFIG,
    WB6: WB6_V3_CONFIG,
    WB7: WB7_V3_CONFIG,
    WB8: WB8_V3_CONFIG,
};

const EDITABLE_ROLES = new Set<AuthUser['role']>(['admin', 'gestor']);

export interface WorkbookTemplateRecord {
    templateId: string;
    workbookCode: string;
    sequenceNo: number;
    title: string;
    description: string | null;
    pillarCode: string | null;
    coverImageUrl: string | null;
    coverConfig: WorkbookCoverConfig;
    publishedContent: WorkbookTemplateContent;
    publishedVersionNo: number;
    draftContent: WorkbookTemplateContent | null;
    draftCoverImageUrl: string | null;
    draftCoverConfig: WorkbookCoverConfig | null;
    draftUpdatedAt: string | null;
    draftUpdatedBy: string | null;
    hasDraft: boolean;
    canEdit: boolean;
}

export interface WorkbookTemplateVersionRecord {
    versionId: string;
    templateId: string;
    versionNo: number;
    coverImageUrl: string | null;
    publishedBy: string | null;
    publishedByName: string | null;
    publishedAt: string;
    notes: string | null;
}

interface TemplateRow {
    template_id: string;
    workbook_code: string;
    sequence_no: number;
    title: string;
    description: string | null;
    pillar_code: string | null;
    cover_image_url: string | null;
    cover_config: unknown;
    draft_content: WorkbookTemplateContent | null;
    draft_cover_image_url: string | null;
    draft_cover_config: unknown;
    draft_updated_at: string | null;
    draft_updated_by: string | null;
    current_version_no: number;
    latest_content: WorkbookTemplateContent | null;
    latest_cover_image_url: string | null;
    latest_cover_config: unknown;
}

function ensureCanEdit(actor: AuthUser) {
    if (!EDITABLE_ROLES.has(actor.role)) {
        throw new ForbiddenError('Solo admin o gestor pueden editar la plantilla del workbook.');
    }
}

function fallbackContent(code: string): WorkbookTemplateContent {
    const fallback = TEMPLATE_FALLBACK_BY_CODE[code.toUpperCase()];
    if (!fallback) {
        throw new Error(`Plantilla ${code} no tiene contenido base cargado.`);
    }
    return fallback;
}

async function fetchTemplateRow(client: PoolClient, slug: string): Promise<TemplateRow | null> {
    const { rows } = await client.query<TemplateRow>(
        `
            SELECT
                wt.template_id::text,
                wt.workbook_code,
                wt.sequence_no,
                wt.title,
                wt.description,
                wt.pillar_code,
                wt.cover_image_url,
                wt.cover_config,
                wt.draft_content,
                wt.draft_cover_image_url,
                wt.draft_cover_config,
                wt.draft_updated_at,
                wt.draft_updated_by::text,
                wt.current_version_no,
                v.content AS latest_content,
                v.cover_image_url AS latest_cover_image_url,
                v.cover_config AS latest_cover_config
            FROM app_learning.workbook_templates wt
            LEFT JOIN LATERAL (
                SELECT content, cover_image_url, cover_config
                FROM app_learning.workbook_template_versions
                WHERE template_id = wt.template_id
                ORDER BY version_no DESC
                LIMIT 1
            ) v ON true
            WHERE LOWER(wt.workbook_code) = LOWER($1)
            LIMIT 1
        `,
        [slug],
    );
    return rows[0] ?? null;
}

function buildTemplateRecord(row: TemplateRow, canEdit: boolean): WorkbookTemplateRecord {
    const fallback = fallbackContent(row.workbook_code);
    const publishedContent = row.latest_content ?? fallback;
    const publishedCover = row.cover_image_url ?? row.latest_cover_image_url ?? null;
    const publishedCoverConfig = normalizeCoverConfig(row.cover_config ?? row.latest_cover_config ?? null);
    const draftCoverConfig =
        row.draft_cover_config === null || row.draft_cover_config === undefined
            ? null
            : normalizeCoverConfig(row.draft_cover_config);
    return {
        templateId: row.template_id,
        workbookCode: row.workbook_code,
        sequenceNo: row.sequence_no,
        title: row.title,
        description: row.description,
        pillarCode: row.pillar_code,
        coverImageUrl: publishedCover,
        coverConfig: publishedCoverConfig,
        publishedContent,
        publishedVersionNo: row.current_version_no ?? 0,
        draftContent: row.draft_content ?? null,
        draftCoverImageUrl: row.draft_cover_image_url ?? null,
        draftCoverConfig: draftCoverConfig,
        draftUpdatedAt: row.draft_updated_at,
        draftUpdatedBy: row.draft_updated_by,
        hasDraft:
            !!row.draft_content ||
            !!row.draft_cover_image_url ||
            !!row.draft_cover_config,
        canEdit,
    };
}

export async function getWorkbookTemplate(
    client: PoolClient,
    actor: AuthUser,
    slug: string,
): Promise<WorkbookTemplateRecord> {
    await requireModulePermission(client, 'aprendizaje', 'view');
    const row = await fetchTemplateRow(client, slug);
    if (!row) {
        throw new ForbiddenError(`Plantilla ${slug} no encontrada.`);
    }
    return buildTemplateRecord(row, EDITABLE_ROLES.has(actor.role));
}

export interface UpdateTemplateDraftInput {
    content?: WorkbookTemplateContent | null;
    coverImageUrl?: string | null;
    coverConfig?: Partial<WorkbookCoverConfig> | null;
}

export async function updateWorkbookTemplateDraft(
    client: PoolClient,
    actor: AuthUser,
    slug: string,
    input: UpdateTemplateDraftInput,
): Promise<WorkbookTemplateRecord> {
    await requireModulePermission(client, 'aprendizaje', 'update');
    ensureCanEdit(actor);

    const row = await fetchTemplateRow(client, slug);
    if (!row) {
        throw new ForbiddenError(`Plantilla ${slug} no encontrada.`);
    }

    const nextDraftContent = input.content === undefined ? row.draft_content : input.content;
    const nextDraftCover = input.coverImageUrl === undefined ? row.draft_cover_image_url : input.coverImageUrl;
    let nextDraftCoverConfig: WorkbookCoverConfig | null;
    if (input.coverConfig === undefined) {
        nextDraftCoverConfig =
            row.draft_cover_config === null || row.draft_cover_config === undefined
                ? null
                : normalizeCoverConfig(row.draft_cover_config);
    } else if (input.coverConfig === null) {
        nextDraftCoverConfig = null;
    } else {
        const base = normalizeCoverConfig(row.draft_cover_config ?? row.cover_config ?? null);
        nextDraftCoverConfig = normalizeCoverConfig({ ...base, ...input.coverConfig });
    }

    await client.query(
        `
            UPDATE app_learning.workbook_templates
            SET
                draft_content = $1,
                draft_cover_image_url = $2,
                draft_cover_config = $3::jsonb,
                draft_updated_at = now(),
                draft_updated_by = $4::uuid,
                updated_at = now()
            WHERE template_id = $5::uuid
        `,
        [
            nextDraftContent ? JSON.stringify(nextDraftContent) : null,
            nextDraftCover,
            nextDraftCoverConfig ? JSON.stringify(nextDraftCoverConfig) : null,
            actor.userId,
            row.template_id,
        ],
    );

    const refreshed = await fetchTemplateRow(client, slug);
    if (!refreshed) {
        throw new Error('Plantilla actualizada pero no se pudo releer.');
    }
    return buildTemplateRecord(refreshed, true);
}

export async function publishWorkbookTemplateVersion(
    client: PoolClient,
    actor: AuthUser,
    slug: string,
    notes: string | null,
): Promise<WorkbookTemplateRecord> {
    await requireModulePermission(client, 'aprendizaje', 'update');
    ensureCanEdit(actor);

    const row = await fetchTemplateRow(client, slug);
    if (!row) {
        throw new ForbiddenError(`Plantilla ${slug} no encontrada.`);
    }

    const baseContent = row.latest_content ?? fallbackContent(row.workbook_code);
    const contentToPublish = row.draft_content ?? baseContent;
    const coverToPublish = row.draft_cover_image_url ?? row.cover_image_url ?? null;
    const coverConfigToPublish = normalizeCoverConfig(
        row.draft_cover_config ?? row.cover_config ?? row.latest_cover_config ?? null,
    );
    const nextVersionNo = (row.current_version_no ?? 0) + 1;

    await client.query('BEGIN');
    try {
        await client.query(
            `
                INSERT INTO app_learning.workbook_template_versions (
                    template_id,
                    version_no,
                    cover_image_url,
                    cover_config,
                    content,
                    published_by,
                    notes
                )
                VALUES ($1::uuid, $2::int, $3, $4::jsonb, $5::jsonb, $6::uuid, $7)
            `,
            [
                row.template_id,
                nextVersionNo,
                coverToPublish,
                JSON.stringify(coverConfigToPublish),
                JSON.stringify(contentToPublish),
                actor.userId,
                notes && notes.trim().length > 0 ? notes.trim().slice(0, 480) : null,
            ],
        );

        await client.query(
            `
                UPDATE app_learning.workbook_templates
                SET
                    current_version_no = $1::int,
                    cover_image_url = $2,
                    cover_config = $3::jsonb,
                    draft_content = NULL,
                    draft_cover_image_url = NULL,
                    draft_cover_config = NULL,
                    draft_updated_at = NULL,
                    draft_updated_by = NULL,
                    updated_at = now()
                WHERE template_id = $4::uuid
            `,
            [nextVersionNo, coverToPublish, JSON.stringify(coverConfigToPublish), row.template_id],
        );

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }

    const refreshed = await fetchTemplateRow(client, slug);
    if (!refreshed) {
        throw new Error('Versión publicada pero no se pudo releer la plantilla.');
    }
    return buildTemplateRecord(refreshed, true);
}

export async function listWorkbookTemplateVersions(
    client: PoolClient,
    actor: AuthUser,
    slug: string,
): Promise<WorkbookTemplateVersionRecord[]> {
    await requireModulePermission(client, 'aprendizaje', 'view');
    const row = await fetchTemplateRow(client, slug);
    if (!row) return [];

    if (!EDITABLE_ROLES.has(actor.role) && actor.role !== 'mentor') {
        // Líderes ven plantillas pero no el historial de versiones.
        return [];
    }

    const { rows } = await client.query<{
        version_id: string;
        template_id: string;
        version_no: number;
        cover_image_url: string | null;
        published_by: string | null;
        published_by_name: string | null;
        published_at: string;
        notes: string | null;
    }>(
        `
            SELECT
                v.version_id::text,
                v.template_id::text,
                v.version_no,
                v.cover_image_url,
                v.published_by::text,
                u.display_name AS published_by_name,
                v.published_at,
                v.notes
            FROM app_learning.workbook_template_versions v
            LEFT JOIN app_core.users u ON u.user_id = v.published_by
            WHERE v.template_id = $1::uuid
            ORDER BY v.version_no DESC
            LIMIT 50
        `,
        [row.template_id],
    );

    return rows.map((versionRow) => ({
        versionId: versionRow.version_id,
        templateId: versionRow.template_id,
        versionNo: versionRow.version_no,
        coverImageUrl: versionRow.cover_image_url,
        publishedBy: versionRow.published_by,
        publishedByName: versionRow.published_by_name,
        publishedAt: versionRow.published_at,
        notes: versionRow.notes,
    }));
}

// Helper invocado al crear nuevas instancias de user_workbooks (ensureWorkbookInstances)
// para copiar el snapshot vigente de cada plantilla activa.
export async function snapshotLatestVersionsIntoNewWorkbooks(client: PoolClient): Promise<void> {
    await client.query(
        `
            WITH latest_versions AS (
                SELECT DISTINCT ON (template_id)
                    template_id,
                    version_no,
                    cover_image_url,
                    content
                FROM app_learning.workbook_template_versions
                ORDER BY template_id, version_no DESC
            )
            UPDATE app_learning.user_workbooks uw
            SET
                template_version_no = lv.version_no,
                content_snapshot = lv.content
            FROM latest_versions lv
            WHERE uw.template_id = lv.template_id
              AND uw.content_snapshot IS NULL
              AND uw.template_version_no IS NULL
        `,
    );
}
