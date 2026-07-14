'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import Card from '@/components/ui/Card';

type Lesson = {
  id: number;
  title: string;
  order_index: number;
  xp_reward: number;
  mastery_threshold: number;
};

type TrackDetail = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
};

async function fetchTrackDetail(trackId: string): Promise<{ track: TrackDetail; lessons: Lesson[] }> {
  const response = await fetch(`/api/v1/tracks/${trackId}`);
  const result = (await response.json()) as {
    data?: { track: TrackDetail; lessons: Lesson[] };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Failed to load track');
  }

  return result.data!;
}

export default function TrackDetailPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = use(params);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => fetchTrackDetail(trackId),
  });

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">{(error as Error).message}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <Link href="/tracks" className="text-sm text-blue-600 hover:underline">
        ← Back to Tracks
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{data?.track.title}</h1>
        {data?.track.description && (
          <p className="text-gray-500 mt-1">{data.track.description}</p>
        )}
      </div>

      <div className="grid gap-3">
        {data?.lessons.map((lesson, index) => (
          <Card key={lesson.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Lesson {index + 1}</p>
              <h2 className="font-semibold">{lesson.title}</h2>
            </div>
            <span className="text-sm text-blue-600 font-medium">+{lesson.xp_reward} XP</span>
          </Card>
        ))}
      </div>
    </main>
  );
}
