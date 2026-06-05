import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getIntegrationConfigForActor, type ResolvedIntegrationConfig } from '@/server/integrations/config';
import { WB1_V3_CONFIG, type WB1Config, type WB1Section } from '@/lib/workbooks-v2-wb1';
import { WB2_V3_CONFIG } from '@/lib/workbooks-v2-wb2';
import { WB3_V3_CONFIG } from '@/lib/workbooks-v2-wb3';

const TEMPLATE_BY_CODE: Record<string, WB1Config> = {
    WB1: WB1_V3_CONFIG,
    WB2: WB2_V3_CONFIG,
    WB3: WB3_V3_CONFIG,
};

function resolveTemplate(templateCode: string | undefined): WB1Config {
    const code = (templateCode ?? 'WB1').toUpperCase();
    return TEMPLATE_BY_CODE[code] ?? WB1_V3_CONFIG;
}
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';
export const maxDuration = 300;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const ELEVATED_ROLES = new Set(['admin', 'gestor', 'mentor']);
const PER_SECTION_OUTPUT_TOKENS = 8000;
const AUTOFILL_OUTPUT_TOKENS = 4000;

interface AnalyzeBody {
    workbookId?: string;
    templateCode?: string;
    transcript?: string;
    mode?: 'transcript' | 'autofill';
    targetFields?: Array<{ id?: string; label?: string }>;
}

interface OpenAiChatResponse {
    choices?: Array<{
        message?: {
            content?: string | Array<{ type?: string; text?: string }>;
        };
    }>;
    usage?: {
        completion_tokens?: number;
    };
}

type FieldRef = { id: string; label: string };

function sanitizeBaseUrl(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    const trimmed = value.trim().replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : fallback;
}

function parseChatMessageContent(choices: OpenAiChatResponse['choices']): string {
    if (!choices || choices.length === 0) return '';
    const first = choices[0]?.message?.content;
    if (typeof first === 'string') return first;
    if (Array.isArray(first)) {
        return first
            .map((part) => (typeof part?.text === 'string' ? part.text : ''))
            .filter(Boolean)
            .join('\n');
    }
    return '';
}

function extractJsonString(content: string): string {
    const fence = content.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
    if (fence) return fence[1].trim();
    return content.trim();
}

// Si OpenAI cortó el JSON a mitad (max_tokens), intentamos parsearlo
// removiendo la entrada incompleta del final. Repetimos hasta que parsee
// o devolvemos un objeto vacío para que la sección se reporte como missing.
function tolerantJsonParse(raw: string): { fields?: Record<string, unknown>; notes?: unknown } {
    const content = extractJsonString(raw);
    try {
        return JSON.parse(content) as { fields?: Record<string, unknown>; notes?: unknown };
    } catch {
        // intento de auto-repair: buscar último "id":"texto", terminar string y cerrar objeto
        for (let i = content.length - 1; i > 200; i--) {
            const candidate = content.slice(0, i);
            const lastQuote = candidate.lastIndexOf('"');
            if (lastQuote < 0) break;
            try {
                const repaired = `${candidate.slice(0, lastQuote)}"}}`;
                return JSON.parse(repaired) as { fields?: Record<string, unknown>; notes?: unknown };
            } catch {
                // continúa retrocediendo
            }
        }
    }
    return {};
}

function buildSectionPlan(
    template: WB1Config,
    targetFields: Array<{ id?: string; label?: string }> | undefined,
): Array<{ section: WB1Section | null; label: string; fields: FieldRef[] }> {
    if (Array.isArray(targetFields) && targetFields.length > 0) {
        const cleaned = targetFields
            .filter((field) => typeof field.id === 'string' && field.id.trim().length > 0)
            .map((field) => ({
                id: String(field.id),
                label: String(field.label ?? field.id),
            }));
        return [{ section: null, label: 'Campos solicitados', fields: cleaned }];
    }
    return template.sections.map((section) => ({
        section,
        label: section.label,
        fields: section.groups.flatMap((group) =>
            group.fields.map((field) => ({
                id: field.id,
                label: `${group.title ?? group.id} · ${field.label}`,
            })),
        ),
    }));
}

async function callOpenAiForSection(
    integration: ResolvedIntegrationConfig,
    baseUrl: string,
    model: string,
    temperature: number,
    maxTokens: number,
    mode: 'transcript' | 'autofill',
    section: WB1Section | null,
    fields: FieldRef[],
    transcript: string,
    template: WB1Config,
): Promise<{ fields: Record<string, string>; notes: string | null }> {
    const systemPrompt =
        mode === 'transcript'
            ? `Eres un coach ejecutivo de 4Shine. A partir de la transcripción literal de una sesión 1:1 entre un adviser y un líder, redactas el borrador editable de la sección "${section?.label ?? ''}" del ${template.code} (${template.title}). Respetas las palabras del líder, no inventas hechos, y devuelves SÓLO JSON válido.`
            : 'Eres un coach ejecutivo de 4Shine. A partir de las respuestas previas del líder, sugieres texto conciso para los campos solicitados sin inventar hechos. Devuelves SÓLO JSON válido.';

    const userPrompt = {
        instruccion:
            mode === 'transcript'
                ? `Lee la transcripción y propon un borrador para los campos de esta sección que aparezcan claramente respondidos por el líder. Si un campo no tiene evidencia clara en la transcripción, devuélvelo como "" (cadena vacía). No copies texto irrelevante. Usa primera persona del líder. Máx ~120 palabras por campo. NO repitas el mismo texto en varios campos.`
                : 'Con base en las respuestas previas del líder, sugiere texto para los campos solicitados. Si no hay base suficiente, deja el campo "". Máx ~80 palabras por campo.',
        seccion: section
            ? {
                  id: section.id,
                  label: section.label,
                  proposito: section.purpose,
                  conceptos: section.concepts,
              }
            : { label: 'Campos solicitados' },
        campos: fields,
        transcripcion_o_contexto: transcript,
        formato_respuesta:
            'JSON con la forma {"fields": { "<id_de_campo>": "<texto sugerido>" }, "notes": "string corta opcional"}. Incluye TODOS los IDs solicitados, usando "" cuando no haya evidencia.',
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${integration.secretValue}`,
            'Content-Type': 'application/json',
            ...(integration.wizardData.organizationId
                ? { 'OpenAI-Organization': integration.wizardData.organizationId }
                : {}),
            ...(integration.wizardData.projectId
                ? { 'OpenAI-Project': integration.wizardData.projectId }
                : {}),
        },
        body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            temperature,
            max_completion_tokens: maxTokens,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userPrompt) },
            ],
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI respondió ${response.status} para ${section?.label ?? 'sección'}: ${detail.slice(0, 240)}`);
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const raw = parseChatMessageContent(payload.choices);
    const parsed = tolerantJsonParse(raw);

    const allowedIds = new Set(fields.map((field) => field.id));
    const normalized: Record<string, string> = {};
    if (parsed.fields && typeof parsed.fields === 'object') {
        for (const [id, value] of Object.entries(parsed.fields)) {
            if (!allowedIds.has(id)) continue;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed.length > 0) {
                    normalized[id] = trimmed.slice(0, 4000);
                }
            }
        }
    }

    return {
        fields: normalized,
        notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 200) : null,
    };
}

export async function POST(request: Request) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const body = await parseJsonBody<AnalyzeBody>(request);
    if (!body) {
        return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const transcript = (body.transcript ?? '').trim();
    if (transcript.length < 20) {
        return NextResponse.json(
            { ok: false, error: 'La transcripción es demasiado corta para extraer contenido útil.' },
            { status: 400 },
        );
    }

    const mode = body.mode === 'autofill' ? 'autofill' : 'transcript';
    if (mode === 'transcript' && !ELEVATED_ROLES.has(identity.role)) {
        return NextResponse.json(
            { ok: false, error: 'Solo admin, gestor o adviser pueden ejecutar el análisis IA de la transcripción de sesión.' },
            { status: 403 },
        );
    }

    const template = resolveTemplate(body.templateCode);
    const plan = buildSectionPlan(template, body.targetFields);
    const flatCatalog: FieldRef[] = plan.flatMap((entry) => entry.fields);

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const integration = await getIntegrationConfigForActor(client, identity.userId, 'openai');
                if (!integration?.enabled || !integration.secretValue) {
                    throw new Error('OpenAI no está configurado en Integraciones. Actívalo para usar el análisis IA.');
                }

                const baseUrl = sanitizeBaseUrl(integration.wizardData.baseUrl, DEFAULT_BASE_URL);
                const model = integration.wizardData.model?.trim() || DEFAULT_MODEL;
                const temperature = Number.isFinite(Number(integration.wizardData.temperature))
                    ? Number(integration.wizardData.temperature)
                    : 0.3;
                const baseMaxTokens = Number.isFinite(Number(integration.wizardData.maxTokens))
                    ? Number(integration.wizardData.maxTokens)
                    : mode === 'transcript'
                      ? PER_SECTION_OUTPUT_TOKENS
                      : AUTOFILL_OUTPUT_TOKENS;

                const sectionMaxTokens =
                    mode === 'transcript'
                        ? Math.max(baseMaxTokens, PER_SECTION_OUTPUT_TOKENS)
                        : Math.max(baseMaxTokens, AUTOFILL_OUTPUT_TOKENS);

                const results = await Promise.all(
                    plan.map((entry) =>
                        callOpenAiForSection(
                            integration,
                            baseUrl,
                            model,
                            temperature,
                            sectionMaxTokens,
                            mode,
                            entry.section,
                            entry.fields,
                            transcript,
                            template,
                        ).catch((err: unknown) => {
                            const message = err instanceof Error ? err.message : 'OpenAI error';
                            return {
                                fields: {} as Record<string, string>,
                                notes: `Sección ${entry.label} no procesada: ${message.slice(0, 160)}`,
                            };
                        }),
                    ),
                );

                const mergedFields: Record<string, string> = {};
                const noteLines: string[] = [];
                for (const result of results) {
                    Object.assign(mergedFields, result.fields);
                    if (result.notes) noteLines.push(result.notes);
                }

                const filled = flatCatalog
                    .filter((field) => mergedFields[field.id])
                    .map((field) => ({ id: field.id, label: field.label }));
                const missing = flatCatalog
                    .filter((field) => !mergedFields[field.id])
                    .map((field) => ({ id: field.id, label: field.label }));

                return {
                    fields: mergedFields,
                    filled,
                    missing,
                    totalRequested: flatCatalog.length,
                    notes: noteLines.length > 0 ? noteLines.join(' · ').slice(0, 480) : null,
                };
            }),
        );

        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo ejecutar el análisis IA del workbook');
    }
}
