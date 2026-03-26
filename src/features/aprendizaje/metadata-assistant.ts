import type { CourseModule, ContentType } from '@/features/content/client';

export const LEARNING_PROGRAM_STAGE_OPTIONS = [
  'Descubrimiento',
  'Shine Within',
  'Shine Out',
  'Shine Up',
  'Shine Beyond',
  'Programa completo',
  'Free',
] as const;

export const LEARNING_AUDIENCE_OPTIONS = [
  { value: 'lider', label: 'Líderes' },
  { value: 'lider_suscrito', label: 'Líderes con suscripción' },
  { value: 'lider_sin_suscripcion', label: 'Líderes sin suscripción' },
  { value: 'ishiners', label: 'iShiners' },
  { value: 'all', label: 'Toda la plataforma' },
] as const;

export interface LearningMetadataAssistantInput {
  kind: 'resource' | 'course';
  contentType: ContentType;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  durationLabel?: string | null;
}

export interface LearningMetadataSuggestion {
  title: string;
  description: string;
  category: string;
  durationLabel: string | null;
  tags: string[];
  pillar: string | null;
  component: string | null;
  competency: string | null;
  stage: string | null;
  audience: string | null;
  courseModules: CourseModule[];
}

export interface LearningMetadataAssistantSource {
  youtubeMatched: boolean;
  youtubeUsed: boolean;
  youtubeVideoId: string | null;
  youtubeTitle: string | null;
  youtubeDescription: string | null;
  youtubeChannelTitle: string | null;
  youtubeDurationLabel: string | null;
  youtubeWarning: string | null;
}

export interface LearningMetadataAssistantResult {
  source: LearningMetadataAssistantSource;
  suggestion: LearningMetadataSuggestion;
  editorialNote: string;
}
