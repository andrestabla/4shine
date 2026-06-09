import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getMentorshipOverview } from '@/features/mentorias/service';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../_utils';

export const runtime = 'nodejs';

interface SmartSearchBody {
  query?: string;
}

function sanitizeBaseUrl(value: string | null | undefined): string {
  const candidate = (value ?? '').trim();
  if (!candidate) return 'https://api.openai.com/v1';
  return candidate.replace(/\/+$/, '');
}

function parseOpenAiContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  return '';
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<SmartSearchBody>(request);
  const query = body?.query?.trim() ?? '';
  if (!query) {
    return NextResponse.json({ ok: false, error: 'query es obligatorio.' }, { status: 400 });
  }

  try {
    const result = await withClient(async (client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const overview = await getMentorshipOverview(client, identity);
        const catalog = overview.mentorCatalog.map((mentor) => ({
          id: mentor.mentorUserId,
          name: mentor.name,
          specialty: mentor.specialty,
          sector: mentor.sector,
          ratingAvg: mentor.ratingAvg,
          experiencia: mentor.experiencia,
          temas: mentor.temas.map((t) => `${t.topicLabel} (${t.pillarLabel})`),
          priceCop: mentor.precioSesion,
        }));

        if (catalog.length === 0) {
          return { mentorIds: [], rationale: 'No hay advisers disponibles.' };
        }

        const openAi = await getIntegrationConfigForActor(client, identity.userId, 'openai');
        if (!openAi?.enabled || !openAi.secretValue) {
          return {
            mentorIds: catalog.map((c) => c.id),
            rationale: 'OpenAI no está configurado; se devuelve el listado completo en orden por defecto.',
            llmAvailable: false,
          };
        }

        const endpoint = `${sanitizeBaseUrl(openAi.wizardData.baseUrl)}/chat/completions`;
        const systemPrompt = [
          'Eres un asistente que recomienda mentores ejecutivos en la plataforma 4Shine.',
          'Recibes un catálogo en JSON con id, nombre, especialidad, sector, rating, experiencia, temas y precio.',
          'Recibes también una solicitud del usuario en lenguaje natural.',
          'Devuelve SOLO un JSON válido con esta forma: { "mentorIds": ["id1","id2",...], "rationale": "texto breve en español" }.',
          'Ordena los mentores de más a menos relevantes. Incluye SOLO los relevantes (puedes excluir los que no encajan).',
          'Sé conciso. El rationale no debe exceder 200 caracteres.',
        ].join('\n');
        const userPrompt = `Catálogo:\n${JSON.stringify(catalog).slice(0, 12000)}\n\nNecesidad del usuario:\n${query}`;

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openAi.secretValue}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: openAi.wizardData.model?.trim() || 'gpt-4.1-mini',
              temperature: 0.2,
              max_tokens: 400,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          });
          if (!response.ok) {
            return {
              mentorIds: catalog.map((c) => c.id),
              rationale: 'Búsqueda inteligente no disponible momentáneamente.',
              llmAvailable: false,
            };
          }
          const payload = (await response.json()) as unknown;
          const raw = parseOpenAiContent(payload);
          if (!raw) {
            return {
              mentorIds: catalog.map((c) => c.id),
              rationale: 'Sin respuesta del modelo; se muestra el listado por defecto.',
              llmAvailable: true,
            };
          }
          const parsed = JSON.parse(raw) as { mentorIds?: unknown; rationale?: unknown };
          const validIds = new Set(catalog.map((c) => c.id));
          const mentorIds = Array.isArray(parsed.mentorIds)
            ? (parsed.mentorIds as unknown[])
                .filter((v): v is string => typeof v === 'string')
                .filter((id) => validIds.has(id))
            : [];
          const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : '';
          return {
            mentorIds,
            rationale,
            llmAvailable: true,
          };
        } catch {
          return {
            mentorIds: catalog.map((c) => c.id),
            rationale: 'Búsqueda inteligente no disponible momentáneamente.',
            llmAvailable: false,
          };
        }
      }),
    );

    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo ejecutar la búsqueda inteligente.');
  }
}
