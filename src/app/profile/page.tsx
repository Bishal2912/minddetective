'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import { calculateLevel } from '@/lib/xp-engine';

type UserMe = { id: string; name: string; email: string; xp: number; streak_count: number; longest_streak: number };
type TrackProgress = { track_id: number; track_title: string; total_lessons: number; completed_lessons: number };

async function fetchMe(): Promise<UserMe> {
  const response = await fetch('/api/v1/user/me');
  const result = (await response.json()) as { data?: UserMe; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load profile');
  return result.data!;
}

async function fetchProgress(): Promise<TrackProgress[]> {
  const response = await fetch('/api/v1/user/me/progress');
  const result = (await response.json()) as { data?: { progress: TrackProgress[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load progress');
  return result.data!.progress;
}

export default function ProfilePage() {
  const { data: me, isLoading: meLoading, isError: meIsError } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: progress, isLoading: progressLoading, isError: progressIsError } = useQuery({
    queryKey: ['progress'],
    queryFn: fetchProgress,
  });

  if (meLoading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </main>
    );
  }

  if (meIsError) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load your profile. Try refreshing the page.</p>
      </main>
    );
  }

  const level = me ? calculateLevel(me.xp) : 1;
  const initial = me?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold">{me?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Level {level}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span>🔥 {me?.streak_count} day streak</span>
        <span>⭐ {me?.xp} XP total</span>
        <span>🏆 Longest streak: {me?.longest_streak} days</span>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Tracks in Progress</h2>
        {progressLoading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {progressIsError && (
          <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load your progress. Try refreshing the page.</p>
        )}
        <div className="space-y-3">
          {progress?.map((track) => {
            const percent =
              track.total_lessons > 0
                ? Math.round((track.completed_lessons / track.total_lessons) * 100)
                : 0;
            return (
              <Card key={track.track_id}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{track.track_title}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {track.completed_lessons}/{track.total_lessons} lessons
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Badges</h2>
        <Card>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Badges coming soon 🏅</p>
        </Card>
      </div>

      <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
        Edit Profile →
      </Link>
    </main>
  );
}
