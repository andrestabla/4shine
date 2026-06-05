import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';
export const maxDuration = 90;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'whisper-1';

interface TranscribeBody {
    audioUrl?: string;
    fieldId?: string;
    language?: string;
}

function sanitizeBaseUrl(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    const trimmed = value.trim().replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : fallback;
}

export async function POST(request: Request) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const body = await parseJsonBody<TranscribeBody>(request);
    if (!body || typeof body.audioUrl !== 'string' || body.audioUrl.length === 0) {
        return NextResponse.json({ ok: false, error: 'audioUrl is required' }, { status: 400 });
    }

    const audioUrl = body.audioUrl.trim();
    const language = (body.language ?? 'es').trim() || 'es';

    if (!/^https?:\/\//i.test(audioUrl)) {
        return NextResponse.json({ ok: false, error: 'audioUrl must be an http(s) URL' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const integration = await getIntegrationConfigForActor(client, identity.userId, 'openai');
                if (!integration?.enabled || !integration.secretValue) {
                    throw new Error('OpenAI no está configurado en Integraciones. Actívalo para habilitar la transcripción.');
                }

                const audioResponse = await fetch(audioUrl, { cache: 'no-store' });
                if (!audioResponse.ok) {
                    throw new Error(`No se pudo descargar el audio (${audioResponse.status})`);
                }
                const audioBlob = await audioResponse.blob();

                const baseUrl = sanitizeBaseUrl(integration.wizardData.baseUrl, DEFAULT_BASE_URL);
                const model = integration.wizardData.transcriptionModel?.trim() || DEFAULT_MODEL;

                const form = new FormData();
                const filename = audioUrl.split('?')[0].split('/').pop() || 'audio.webm';
                form.append('file', audioBlob, filename);
                form.append('model', model);
                form.append('language', language);
                form.append('response_format', 'json');

                const transcribeResponse = await fetch(`${baseUrl}/audio/transcriptions`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${integration.secretValue}`,
                        ...(integration.wizardData.organizationId
                            ? { 'OpenAI-Organization': integration.wizardData.organizationId }
                            : {}),
                        ...(integration.wizardData.projectId
                            ? { 'OpenAI-Project': integration.wizardData.projectId }
                            : {}),
                    },
                    body: form,
                    cache: 'no-store',
                });

                if (!transcribeResponse.ok) {
                    const detail = await transcribeResponse.text();
                    throw new Error(
                        `OpenAI Whisper respondió ${transcribeResponse.status}: ${detail.slice(0, 280)}`
                    );
                }

                const payload = (await transcribeResponse.json()) as { text?: string };
                return {
                    text: (payload.text ?? '').trim(),
                };
            }),
        );

        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo transcribir el audio');
    }
}
