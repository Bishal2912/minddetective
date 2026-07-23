'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import Card from '@/components/ui/Card';

type Track = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
};

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch('/api/v1/tracks');
  const result = (await response.json()) as { data?: { tracks: Track[] }; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Failed to load tracks');
  }

  return result.data!.tracks;
}

export default function TracksPage() {
  const { data: tracks, isLoading, isError, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: fetchTracks,
  });

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading tracks...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600 dark:text-red-400">{(error as Error).message}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tracks</h1>
      <div className="grid gap-4">
        {tracks?.map((track) => (
          <Link key={track.id} href={`/tracks/${track.id}`}>
            <Card className="hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer">
              <h2 className="font-semibold text-lg">{track.title}</h2>
              {track.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{track.description}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
