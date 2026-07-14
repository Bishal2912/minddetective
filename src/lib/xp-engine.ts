export function calculateScore(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((correctCount / totalCount) * 100);
}

export function isMastered(score: number, masteryThreshold: number): boolean {
  return score >= masteryThreshold;
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}
