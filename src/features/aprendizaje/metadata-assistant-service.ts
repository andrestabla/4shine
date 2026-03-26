import type { PoolClient } from 'pg';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import {
  COMPETENCY_PILLAR_OPTIONS,
  PILLAR_CODE_BY_LABEL,
  getCompetencyOptions,
  getComponentOptionsByPillarCode,
} from '@/features/aprendizaje/competency-map';
import type { ContentType, CourseModule, CourseModuleResource, CourseModuleResourceType } from '@/features/content/service';
import {
  LEARNING_AUDIENCE_OPTIONS,
  LEARNING_PROGRAM_STAGE_OPTIONS,
  type LearningMetadataAssistantInput,
  type LearningMetadataAssistantResult,
  type LearningMetadataAssistantSource,
  type LearningMetadataSuggestion,
} from './metadata-assistant';

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_TIMEOUT_MS = 15000;
const DEFAULT_OPENAI_MAX_TOKENS = 1200;
const DEFAULT_OPENAI_TEMPERATURE = 0.3;
const DEFAULT_YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const DEFAULT_CATEGORY_BY_CONTENT_TYPE: Record<ContentType, string> = {
  video: 'Masterclass',
  podcast: 'Conversación',
  pdf: 'Guía',
  article: 'Artículo',
  html: 'Experiencia interactiva',
  ppt: 'Presentación',
  scorm: 'Curso',
};

interface YoutubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  durationLabel: string | null;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface RawAssistantPayload {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  durationLabel?: unknown;
  tags?: unknown;
  pillar?: unknown;
  pillarCode?: unknown;
  component?: unknown;
  competency?: unknown;
  stage?: unknown;
  audience?: unknown;
  editorialNote?: unknown;
  courseModules?: unknown;
}

interface TaxonomySelection {
  pillar: string | null;
  component: string | null;
  competency: string | null;
}

function clampText(value: unknown, maxLength = 1200): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeMultilineText(value: unknown, maxLength = 2400): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength);
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const normalized = item.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (output.length >= 10) break;
  }

  return output;
}

function normalizeCourseModuleResourceType(value: unknown): CourseModuleResourceType {
  if (typeof value !== 'string') return 'link';

  const normalized = value.trim().toLowerCase();
  if (['video', 'pdf', 'article', 'podcast', 'html', 'ppt', 'link'].includes(normalized)) {
    return normalized as CourseModuleResourceType;
  }

  if (normalized.includes('document')) return 'pdf';
  if (normalized.includes('audio')) return 'podcast';
  if (normalized.includes('present')) return 'ppt';
  return 'link';
}

function normalizeCourseModules(input: unknown): CourseModule[] {
  if (!Array.isArray(input)) return [];

  const modules: CourseModule[] = [];

  for (const moduleItem of input) {
    if (!moduleItem || typeof moduleItem !== 'object' || Array.isArray(moduleItem)) continue;

    const moduleRecord = moduleItem as Record<string, unknown>;
    const title = clampText(moduleRecord.title, 160);
    if (!title) continue;

    const resourcesInput = Array.isArray(moduleRecord.resources) ? moduleRecord.resources : [];
    const resources: CourseModuleResource[] = [];

    for (const resourceItem of resourcesInput) {
      if (!resourceItem || typeof resourceItem !== 'object' || Array.isArray(resourceItem)) continue;

      const resourceRecord = resourceItem as Record<string, unknown>;
      const resourceTitle = clampText(resourceRecord.title, 160);
      if (!resourceTitle) continue;

      resources.push({
        id: crypto.randomUUID(),
        title: resourceTitle,
        description: clampText(resourceRecord.description, 280) || null,
        contentType: normalizeCourseModuleResourceType(resourceRecord.contentType),
        url: clampText(resourceRecord.url, 1000) || null,
        durationLabel: clampText(resourceRecord.durationLabel, 40) || null,
        linkedContentId: null,
      });

      if (resources.length >= 5) break;
    }

    modules.push({
      id: crypto.randomUUID(),
      title,
      description: clampText(moduleRecord.description, 280) || null,
      resources,
    });

    if (modules.length >= 6) break;
  }

  return modules;
}

function normalizeStage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  const match = LEARNING_PROGRAM_STAGE_OPTIONS.find(
    (option) => option.trim().toLowerCase() === normalized,
  );
  return match ?? null;
}

function normalizeAudience(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();

  const byValue = LEARNING_AUDIENCE_OPTIONS.find((option) => option.value === normalized);
  if (byValue) return byValue.value;

  const byLabel = LEARNING_AUDIENCE_OPTIONS.find(
    (option) => option.label.trim().toLowerCase() === normalized,
  );
  return byLabel?.value ?? null;
}

function buildTaxonomySelection(
  rawPillar: unknown,
  rawComponent: unknown,
  rawCompetency: unknown,
): TaxonomySelection {
  const pillarValue = clampText(rawPillar, 120);
  const componentValue = clampText(rawComponent, 180);
  const competencyValue = clampText(rawCompetency, 180);

  const pillarCode =
    COMPETENCY_PILLAR_OPTIONS.find(
      (pillar) =>
        pillar.value.toLowerCase() === pillarValue.toLowerCase() ||
        pillar.label.toLowerCase() === pillarValue.toLowerCase(),
    )?.value ??
    PILLAR_CODE_BY_LABEL[pillarValue] ??
    null;

  if (pillarCode) {
    const componentOptions = getComponentOptionsByPillarCode(pillarCode);
    const component =
      componentOptions.find((option) => option.value.toLowerCase() === componentValue.toLowerCase())
        ?.value ?? null;
    const competencyOptions = getCompetencyOptions(pillarCode, component);
    const competency =
      competencyOptions.find((option) => option.value.toLowerCase() === competencyValue.toLowerCase())
        ?.value ?? null;

    return {
      pillar: pillarCode,
      component,
      competency,
    };
  }

  for (const pillar of COMPETENCY_PILLAR_OPTIONS) {
    const componentOptions = getComponentOptionsByPillarCode(pillar.value);
    for (const componentOption of componentOptions) {
      const componentMatch =
        componentValue.length > 0 &&
        componentOption.value.toLowerCase() === componentValue.toLowerCase();
      const competencyOptions = getCompetencyOptions(pillar.value, componentOption.value);
      const competencyMatch = competencyOptions.find(
        (option) => option.value.toLowerCase() === competencyValue.toLowerCase(),
      );

      if (componentMatch && competencyMatch) {
        return {
          pillar: pillar.value,
          component: componentOption.value,
          competency: competencyMatch.value,
        };
      }

      if (!componentValue && competencyMatch) {
        return {
          pillar: pillar.value,
          component: componentOption.value,
          competency: competencyMatch.value,
        };
      }

      if (componentMatch) {
        return {
          pillar: pillar.value,
          component: componentOption.value,
          competency: null,
        };
      }
    }
  }

  return {
    pillar: null,
    component: null,
    competency: null,
  };
}

function extractJsonString(value: string): string {
  const fenced = value.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  const firstBrace = fenced.indexOf('{');
  const lastBrace = fenced.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return fenced.slice(firstBrace, lastBrace + 1);
  }
  return fenced;
}

function parseChatMessageContent(value: OpenAiChatCompletionResponse['choices']): string {
  const content = value?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
  }
  return '';
}

function sanitizeBaseUrl(value: string | undefined, fallback: string): string {
  const normalized = typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
  return normalized || fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractYoutubeVideoId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  if (host === 'youtu.be') {
    const value = url.pathname.split('/').filter(Boolean)[0] ?? '';
    return value || null;
  }

  if (!host.endsWith('youtube.com')) {
    return null;
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && ['embed', 'shorts', 'live'].includes(segments[0])) {
    return segments[1];
  }

  return null;
}

function formatYoutubeDurationLabel(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;

  const hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  const seconds = Number.parseInt(match[3] ?? '0', 10);

  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  if (minutes > 0) return `${minutes} min`;
  if (seconds > 0) return '1 min';
  return null;
}

async function fetchYoutubeVideoMetadata(
  apiKey: string,
  baseUrl: string,
  url: string,
  defaultLanguage?: string,
): Promise<YoutubeVideoMetadata | null> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;

  const endpoint = new URL(`${sanitizeBaseUrl(baseUrl, DEFAULT_YOUTUBE_BASE_URL)}/videos`);
  endpoint.searchParams.set('part', 'snippet,contentDetails');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);
  if (defaultLanguage) {
    endpoint.searchParams.set('hl', defaultLanguage);
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube Data API respondió ${response.status}: ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
      };
      contentDetails?: {
        duration?: string;
      };
    }>;
  };

  const item = payload.items?.[0];
  if (!item?.id || !item.snippet) return null;

  return {
    videoId: item.id,
    title: clampText(item.snippet.title, 180),
    description: normalizeMultilineText(item.snippet.description, 4000),
    channelTitle: clampText(item.snippet.channelTitle, 180),
    durationLabel: formatYoutubeDurationLabel(item.contentDetails?.duration),
  };
}

function buildCompetencyTaxonomy() {
  return COMPETENCY_PILLAR_OPTIONS.map((pillar) => ({
    pillarCode: pillar.value,
    pillarLabel: pillar.label,
    components: getComponentOptionsByPillarCode(pillar.value).map((component) => ({
      component: component.value,
      competencies: getCompetencyOptions(pillar.value, component.value).map((competency) => competency.value),
    })),
  }));
}

async function fetchOpenAiSuggestion(
  input: LearningMetadataAssistantInput,
  config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    timeoutMs: number;
    temperature: number;
    maxTokens: number;
    organizationId?: string;
    projectId?: string;
  },
  youtubeMetadata: YoutubeVideoMetadata | null,
): Promise<RawAssistantPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const prompt = {
      request: {
        kind: input.kind,
        contentType: input.contentType,
      },
      currentInput: {
        title: clampText(input.title, 180),
        description: normalizeMultilineText(input.description, 4000),
        category: clampText(input.category, 120),
        durationLabel: clampText(input.durationLabel, 40),
        url: clampText(input.url, 1200),
      },
      youtubeMetadata: youtubeMetadata
        ? {
            videoId: youtubeMetadata.videoId,
            title: youtubeMetadata.title,
            description: youtubeMetadata.description,
            channelTitle: youtubeMetadata.channelTitle,
            durationLabel: youtubeMetadata.durationLabel,
          }
        : null,
      allowedStages: [...LEARNING_PROGRAM_STAGE_OPTIONS],
      allowedAudiences: LEARNING_AUDIENCE_OPTIONS,
      competencyTaxonomy: buildCompetencyTaxonomy(),
      instructions: [
        'Responde solo JSON valido.',
        'No inventes pilares, componentes o competencias fuera de la taxonomia entregada.',
        'Si no estas seguro de un metadato, devuelve null o un arreglo vacio.',
        'Mantén tags breves, útiles para búsqueda y descubrimiento.',
        'Si kind es course, puedes sugerir entre 3 y 6 modulos con recursos internos. Si no hay contexto suficiente, devuelve courseModules como arreglo vacio.',
        'No cambies el contentType solicitado.',
      ],
      expectedShape: {
        title: 'string',
        description: 'string',
        category: 'string',
        durationLabel: 'string|null',
        tags: ['string'],
        pillar: 'pillarCode|null',
        component: 'string|null',
        competency: 'string|null',
        stage: 'string|null',
        audience: 'audienceValue|null',
        editorialNote: 'string',
        courseModules: [
          {
            title: 'string',
            description: 'string|null',
            resources: [
              {
                title: 'string',
                description: 'string|null',
                contentType: 'video|pdf|article|podcast|html|ppt|link',
                durationLabel: 'string|null',
                url: 'string|null',
              },
            ],
          },
        ],
      },
    };

    const response = await fetch(`${sanitizeBaseUrl(config.baseUrl, DEFAULT_OPENAI_BASE_URL)}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.organizationId ? { 'OpenAI-Organization': config.organizationId } : {}),
        ...(config.projectId ? { 'OpenAI-Project': config.projectId } : {}),
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_OPENAI_MODEL,
        response_format: {
          type: 'json_object',
        },
        temperature: config.temperature,
        max_completion_tokens: config.maxTokens,
        messages: [
          {
            role: 'system',
            content:
              'Eres un editor instruccional de 4Shine. Extraes metadatos en español para recursos y cursos. Priorizas precisión, claridad editorial y coherencia con la taxonomía entregada. Responde únicamente JSON válido.',
          },
          {
            role: 'user',
            content: JSON.stringify(prompt),
          },
        ],
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI respondió ${response.status}: ${detail.slice(0, 280)}`);
    }

    const payload = (await response.json()) as OpenAiChatCompletionResponse;
    const content = parseChatMessageContent(payload.choices);
    if (!content) {
      throw new Error('OpenAI no devolvió contenido utilizable para el asistente de metadatos.');
    }

    const raw = JSON.parse(extractJsonString(content)) as RawAssistantPayload;
    return raw;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAssistantResult(
  input: LearningMetadataAssistantInput,
  raw: RawAssistantPayload,
  youtubeSource: LearningMetadataAssistantSource,
): LearningMetadataAssistantResult {
  const taxonomy = buildTaxonomySelection(
    raw.pillarCode ?? raw.pillar,
    raw.component,
    raw.competency,
  );

  const suggestion: LearningMetadataSuggestion = {
    title:
      clampText(raw.title, 180) ||
      youtubeSource.youtubeTitle ||
      clampText(input.title, 180),
    description:
      normalizeMultilineText(raw.description, 4000) ||
      youtubeSource.youtubeDescription ||
      normalizeMultilineText(input.description, 4000),
    category:
      clampText(raw.category, 120) ||
      clampText(input.category, 120) ||
      DEFAULT_CATEGORY_BY_CONTENT_TYPE[input.contentType],
    durationLabel:
      clampText(raw.durationLabel, 40) ||
      youtubeSource.youtubeDurationLabel ||
      clampText(input.durationLabel, 40) ||
      null,
    tags: normalizeTags(raw.tags),
    pillar: taxonomy.pillar,
    component: taxonomy.component,
    competency: taxonomy.competency,
    stage: normalizeStage(raw.stage),
    audience: normalizeAudience(raw.audience),
    courseModules: input.kind === 'course' ? normalizeCourseModules(raw.courseModules) : [],
  };

  return {
    source: youtubeSource,
    suggestion,
    editorialNote:
      clampText(raw.editorialNote, 320) ||
      (youtubeSource.youtubeUsed
        ? 'Se tomaron señales del recurso y metadatos confirmados desde YouTube para proponer una clasificación más precisa.'
        : 'Se generó una sugerencia editorial a partir del contexto disponible en el editor.'),
  };
}

export async function extractLearningMetadataAssistant(
  client: PoolClient,
  actor: AuthUser,
  input: LearningMetadataAssistantInput,
): Promise<LearningMetadataAssistantResult> {
  await requireModulePermission(client, 'contenido', 'create');

  if (!['gestor', 'admin'].includes(actor.role)) {
    throw new ForbiddenError('Solo gestores y admins pueden usar el asistente IA de metadatos.');
  }

  const hasSignal =
    clampText(input.url, 1200).length > 0 ||
    clampText(input.title, 180).length > 0 ||
    normalizeMultilineText(input.description, 4000).length > 0;

  if (!hasSignal) {
    throw new Error('Agrega al menos una URL, título o descripción antes de usar el asistente IA.');
  }

  const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, 'openai');
  if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) {
    throw new Error('OpenAI no está configurado en Integraciones. Activa la integración antes de usar el asistente.');
  }

  const youtubeSource: LearningMetadataAssistantSource = {
    youtubeMatched: false,
    youtubeUsed: false,
    youtubeVideoId: null,
    youtubeTitle: null,
    youtubeDescription: null,
    youtubeChannelTitle: null,
    youtubeDurationLabel: null,
    youtubeWarning: null,
  };

  const normalizedUrl = clampText(input.url, 1200);
  const youtubeVideoId = normalizedUrl ? extractYoutubeVideoId(normalizedUrl) : null;
  let youtubeMetadata: YoutubeVideoMetadata | null = null;

  if (youtubeVideoId) {
    youtubeSource.youtubeMatched = true;
    youtubeSource.youtubeVideoId = youtubeVideoId;

    const youtubeIntegration = await getIntegrationConfigForActor(client, actor.userId, 'youtube_data_api');
    if (!youtubeIntegration?.enabled || !youtubeIntegration.secretValue) {
      youtubeSource.youtubeWarning =
        'URL de YouTube detectada, pero la integración YouTube Data API no está activa. Se usó solo el contexto disponible en el editor.';
    } else {
      try {
        youtubeMetadata = await fetchYoutubeVideoMetadata(
          youtubeIntegration.secretValue,
          youtubeIntegration.wizardData.baseUrl,
          normalizedUrl,
          youtubeIntegration.wizardData.defaultLanguage,
        );
      } catch (error) {
        youtubeSource.youtubeWarning =
          error instanceof Error
            ? error.message
            : 'No fue posible leer metadatos desde YouTube Data API.';
      }
    }
  }

  if (youtubeMetadata) {
    youtubeSource.youtubeUsed = true;
    youtubeSource.youtubeTitle = youtubeMetadata.title;
    youtubeSource.youtubeDescription = youtubeMetadata.description;
    youtubeSource.youtubeChannelTitle = youtubeMetadata.channelTitle;
    youtubeSource.youtubeDurationLabel = youtubeMetadata.durationLabel;
  }

  const rawSuggestion = await fetchOpenAiSuggestion(
    input,
    {
      apiKey: openAiIntegration.secretValue,
      baseUrl: openAiIntegration.wizardData.baseUrl || DEFAULT_OPENAI_BASE_URL,
      model: openAiIntegration.wizardData.model || DEFAULT_OPENAI_MODEL,
      timeoutMs: parseInteger(openAiIntegration.wizardData.timeoutMs, DEFAULT_OPENAI_TIMEOUT_MS),
      temperature: parseNumber(openAiIntegration.wizardData.temperature, DEFAULT_OPENAI_TEMPERATURE),
      maxTokens: parseInteger(openAiIntegration.wizardData.maxTokens, DEFAULT_OPENAI_MAX_TOKENS),
      organizationId: openAiIntegration.wizardData.organizationId,
      projectId: openAiIntegration.wizardData.projectId,
    },
    youtubeMetadata,
  );

  return normalizeAssistantResult(input, rawSuggestion, youtubeSource);
}
