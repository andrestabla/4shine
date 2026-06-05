import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { WB1_V3_CONFIG } from '@/lib/workbooks-v2-wb1';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';
export const maxDuration = 120;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const ELEVATED_ROLES = new Set(['admin', 'gestor', 'mentor']);

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
}

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

function buildFieldCatalog(targetFields?: Array<{ id?: string; label?: string }>) {
    if (Array.isArray(targetFields) && targetFields.length > 0) {
        return targetFields
            .filter((field) => typeof field.id === 'string' && field.id.trim().length > 0)
            .map((field) => ({ id: String(field.id), label: String(field.label ?? field.id) }));
    }
    return WB1_V3_CONFIG.sections.flatMap((section) =>
        section.groups.flatMap((group) =>
            group.fields.map((field) => ({
                id: field.id,
                label: `${section.label} · ${group.title ?? group.id} · ${field.label}`,
            })),
        ),
    );
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

    if (!ELEVATED_ROLES.has(identity.role)) {
        return NextResponse.json(
            { ok: false, error: 'Solo admin, gestor o adviser pueden ejecutar el análisis IA del workbook.' },
            { status: 403 },
        );
    }

    const mode = body.mode === 'autofill' ? 'autofill' : 'transcript';
    const catalog = buildFieldCatalog(body.targetFields);

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const integration = await getIntegrationConfigForActor(client, identity.userId, 'openai');
                if (!integration?.enabled || !integration.secretValue) {
                    throw new Error('OpenAI no está configurado en Integraciones. Actívalo para usar el análisis IA.');
                }

                const baseUrl = sanitizeBaseUrl(integration.wizardData.baseUrl, DEFAULT_BASE_URL);
                const model = integration.wizardData.model?.trim() || DEFAULT_MODEL;
                const temperature = Number(integration.wizardData.temperature ?? 0.3);
                const maxTokens = Number(integration.wizardData.maxTokens ?? 2400);

                const systemPrompt =
                    mode === 'transcript'
                        ? 'Eres un coach ejecutivo y editor instruccional de 4Shine. A partir de una transcripción literal de la sesión de trabajo con un líder, redactas un borrador editable de su Workbook 1 (Creencias, identidad y pilares personales). Eres riguroso, respetas las palabras del líder, evitas inventar hechos y devuelves únicamente JSON válido.'
                        : 'Eres un coach ejecutivo y editor instruccional de 4Shine. A partir de las respuestas ya completadas por el líder en su Workbook 1, generas síntesis o sugerencias para los campos solicitados sin inventar hechos. Devuelves únicamente JSON válido.';

                const userPrompt = {
                    instruccion:
                        mode === 'transcript'
                            ? 'Lee la transcripción y propon un borrador completo de los campos del WB1 que aparezcan claramente respondidos en el discurso del líder. Si un campo no tiene evidencia clara, déjalo como cadena vacía. No copies texto irrelevante. Usa primera persona del líder. Sé conciso (máx ~120 palabras por campo).'
                            : 'Con base en las respuestas previas del líder, sugiere texto para los campos solicitados. Si no hay base suficiente, deja el campo vacío. Sé conciso (máx ~80 palabras por campo).',
                    workbook: {
                        code: WB1_V3_CONFIG.code,
                        version: WB1_V3_CONFIG.version,
                        title: WB1_V3_CONFIG.title,
                        objetivo: WB1_V3_CONFIG.objective,
                    },
                    campos: catalog,
                    transcripcion_o_contexto: transcript,
                    formato_respuesta: {
                        fields: 'objeto cuyas claves son los IDs de los campos y los valores son strings con el contenido sugerido',
                        notes: 'string corta y opcional con observaciones para el adviser',
                    },
                };

                const completionResponse = await fetch(`${baseUrl}/chat/completions`, {
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
                        temperature: Number.isFinite(temperature) ? temperature : 0.3,
                        max_completion_tokens: Number.isFinite(maxTokens) ? maxTokens : 2400,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: JSON.stringify(userPrompt) },
                        ],
                    }),
                    cache: 'no-store',
                });

                if (!completionResponse.ok) {
                    const detail = await completionResponse.text();
                    throw new Error(
                        `OpenAI respondió ${completionResponse.status}: ${detail.slice(0, 320)}`
                    );
                }

                const payload = (await completionResponse.json()) as OpenAiChatResponse;
                const raw = parseChatMessageContent(payload.choices);
                if (!raw) {
                    throw new Error('OpenAI no devolvió contenido utilizable.');
                }
                const parsed = JSON.parse(extractJsonString(raw)) as {
                    fields?: Record<string, unknown>;
                    notes?: unknown;
                };

                const allowedIds = new Set(catalog.map((field) => field.id));
                const normalizedFields: Record<string, string> = {};
                if (parsed.fields && typeof parsed.fields === 'object') {
                    for (const [id, value] of Object.entries(parsed.fields)) {
                        if (!allowedIds.has(id)) continue;
                        if (typeof value === 'string') {
                            const trimmed = value.trim();
                            if (trimmed.length > 0) {
                                normalizedFields[id] = trimmed.slice(0, 4000);
                            }
                        }
                    }
                }

                return {
                    fields: normalizedFields,
                    notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 320) : null,
                };
            }),
        );

        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo ejecutar el análisis IA del workbook');
    }
}
