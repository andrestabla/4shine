export type LearningCommentReactionType =
  | 'love'
  | 'useful'
  | 'insightful'
  | 'celebrate';

export interface LearningCommentReactionOption {
  value: LearningCommentReactionType;
  label: string;
  emoji: string;
}

export interface LearningCommentReactionSummary extends LearningCommentReactionOption {
  count: number;
  reacted: boolean;
}

export const LEARNING_COMMENT_REACTION_OPTIONS: LearningCommentReactionOption[] = [
  { value: 'love', label: 'Me encantó', emoji: '❤️' },
  { value: 'useful', label: 'Útil', emoji: '👍' },
  { value: 'insightful', label: 'Insight', emoji: '💡' },
  { value: 'celebrate', label: 'Aplaudo', emoji: '👏' },
];

export function isLearningCommentReactionType(
  value: string | null | undefined,
): value is LearningCommentReactionType {
  return LEARNING_COMMENT_REACTION_OPTIONS.some((option) => option.value === value);
}

export function buildEmptyLearningCommentReactions(): LearningCommentReactionSummary[] {
  return LEARNING_COMMENT_REACTION_OPTIONS.map((option) => ({
    ...option,
    count: 0,
    reacted: false,
  }));
}

export function mergeLearningCommentReactions(
  input:
    | Array<{
        reactionType?: string | null;
        count?: number | null;
        reacted?: boolean | null;
      }>
    | null
    | undefined,
): LearningCommentReactionSummary[] {
  const base = new Map(
    buildEmptyLearningCommentReactions().map((reaction) => [reaction.value, reaction]),
  );

  for (const item of input ?? []) {
    const candidate = item.reactionType ?? null;
    if (!isLearningCommentReactionType(candidate)) continue;

    const reactionType: LearningCommentReactionType = candidate;
    const current = base.get(reactionType);
    if (!current) continue;

    base.set(reactionType, {
      ...current,
      count: Number(item.count ?? current.count ?? 0),
      reacted: Boolean(item.reacted ?? current.reacted),
    });
  }

  return Array.from(base.values());
}
