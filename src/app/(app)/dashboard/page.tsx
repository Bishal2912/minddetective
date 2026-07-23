'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type UserMe = {
  id: string;
  name: string;
  xp: number;
  streak_count: number;
  longest_streak: number;
};

type Track = { id: number; title: string; slug: string; description: string | null };

type DailyQuestion = {
  question: { id: number; type: string; prompt: string };
  options: { id: number; label: string }[];
};

type DailyResult = { isCorrect: boolean; correctOptionId: number | null; explanation: string };

async function fetchMe(): Promise<UserMe> {
  const response = await fetch('/api/v1/user/me');
  const result = (await response.json()) as { data?: UserMe; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load profile');
  return result.data!;
}

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch('/api/v1/tracks');
  const result = (await response.json()) as { data?: { tracks: Track[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load tracks');
  return result.data!.tracks;
}

async function fetchDailyChallenge(): Promise<DailyQuestion> {
  const response = await fetch('/api/v1/daily-challenge');
  const result = (await response.json()) as { data?: DailyQuestion; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load daily challenge');
  return result.data!;
}

async function submitDailyChallenge(questionId: number, selectedOptionId: number): Promise<DailyResult> {
  const response = await fetch('/api/v1/daily-challenge/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, selectedOptionId }),
  });
  const result = (await response.json()) as { data?: DailyResult; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to submit');
  return result.data!;
}

export default function DashboardPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { data: me, isLoading: meLoading, isError: meIsError } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: tracks, isLoading: tracksLoading, isError: tracksIsError } = useQuery({ queryKey: ['tracks'], queryFn: fetchTracks });
  const { data: daily, isLoading: dailyLoading, isError: dailyIsError } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: fetchDailyChallenge,
  });

  const mutation = useMutation({
    mutationFn: () => submitDailyChallenge(daily!.question.id, selectedOption!),
  });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      {!meLoading && me && (
        <div className="flex items-center gap-6 text-lg">
          <span>🔥 Streak: {me.streak_count} days</span>
          <span>⭐ XP: {me.xp}</span>
        </div>
      )}
      {meIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load your stats. Try refreshing the page.</p>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Daily Challenge</h2>
        {dailyLoading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {dailyIsError && (
          <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load today&apos;s challenge. Try refreshing the page.</p>
        )}
        {daily && !mutation.isSuccess && (
          <Card>
            <p className="font-medium mb-4">{daily.question.prompt}</p>
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {daily.options.map((option) => (
                <div
                  key={option.id}
                  role="radio"
                  aria-checked={selectedOption === option.id}
                  tabIndex={0}
                  onClick={() => setSelectedOption(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOption(option.id);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!selectedOption || mutation.isPending}
              className="w-full mt-4"
            >
              {mutation.isPending ? 'Checking...' : 'Submit Answer'}
            </Button>
          </Card>
        )}
        {mutation.isSuccess && (
          <Card>
            <p className={mutation.data.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
              {mutation.data.isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mutation.data.explanation}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">✓ Completed today — come back tomorrow.</p>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Tracks</h2>
        {tracksLoading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {tracksIsError && (
          <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load your tracks. Try refreshing the page.</p>
        )}
        <div className="grid gap-3">
          {tracks?.map((track) => (
            <Link key={track.id} href={`/tracks/${track.id}`}>
              <Card className="hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer">
                <h3 className="font-semibold">{track.title}</h3>
                {track.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{track.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
