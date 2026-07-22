'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Track = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  is_published: number;
};

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch('/api/v1/admin/tracks');
  const result = (await response.json()) as { data?: { tracks: Track[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load tracks');
  return result.data?.tracks ?? [];
}

export default function AdminTracksPage() {
  const queryClient = useQueryClient();
  const { data: tracks, isError: tracksIsError } = useQuery({ queryKey: ['admin-tracks'], queryFn: fetchTracks });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, description, order_index: 0, is_published: true }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create track');
    },
    onSuccess: () => {
      setTitle('');
      setSlug('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/v1/admin/tracks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tracks'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Tracks</h1>

      {tracksIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load tracks. Try refreshing the page.</p>
      )}

      <Card>
        <h2 className="font-semibold mb-3">Add New Track</h2>
        <div className="space-y-2">
          <Input aria-label="Title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input aria-label="Slug" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input
            aria-label="Description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !slug || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : '+ Add Track'}
          </Button>
          {createMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">{(createMutation.error as Error).message}</p>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {tracks?.map((track) => (
          <Card key={track.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {track.title} <span className="text-xs text-gray-400 dark:text-gray-500">#{track.id}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{track.slug}</p>
            </div>
            <Button
              onClick={() => deleteMutation.mutate(track.id)}
              className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 text-sm px-3 py-1"
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
