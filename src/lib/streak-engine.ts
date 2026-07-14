export function calculateStreakUpdate(
  lastActiveDate: string | null,
  currentStreak: number,
  longestStreak: number,
): { newStreak: number; newLongestStreak: number } {
  const todayStr = new Date().toISOString().split('T')[0];

  if (lastActiveDate === todayStr) {
    return { newStreak: currentStreak, newLongestStreak: longestStreak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = lastActiveDate === yesterdayStr ? currentStreak + 1 : 1;
  const newLongestStreak = Math.max(newStreak, longestStreak);

  return { newStreak, newLongestStreak };
}
