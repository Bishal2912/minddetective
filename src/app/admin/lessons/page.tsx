'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Track = { id: number; title: string };
type Lesson = { id: number; track_id: number; title: string; xp_reward: number; mastery_threshold: number };

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch('/api/v1/admin/tracks');
  const result = (await response.json()) as { data?: { tracks: Track[] } };
  return result.data?.tracks ?? [];
}

async function fetchLessonsForTrack(trackId: number): Promise<Lesson[]> {
  const response = await fetch(`/api/v1/tracks/${trackId}`);
  const result = (await response.json()) as { data?: { lessons: Lesson[] } };
  return result.data?.lessons ?? [];
}

export default function AdminLessonsPage() {
  const queryClient = useQueryClient();
  const { data: tracks } = useQuery({ queryKey: ['admin-tracks'], queryFn: fetchTracks });
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const { data: lessons } = useQuery({
    queryKey: ['admin-lessons', selectedTrackId],
    queryFn: () => fetchLessonsForTrack(selectedTrackId!),
    enabled: selectedTrackId !== null,
  });

  const [title, setTitle] = useState('');
  const [xpReward, setXpReward] = useState('10');
  const [masteryThreshold, setMasteryThreshold] = useState('70');

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: selectedTrackId,
          title,
          order_index: lessons?.length ?? 0,
          xp_reward: Number(xpReward),
          mastery_threshold: Number(masteryThreshold),
        }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create lesson');
    },
    onSuccess: () => {
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedTrackId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/v1/admin/lessons/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedTrackId] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Lessons</h1>

      <div>
        <label className="text-sm text-gray-500">Select a track</label>
        <select
          className="block w-full border rounded-lg p-2 mt-1"
          value={selectedTrackId ?? ''}
          onChange={(e) => setSelectedTrackId(Number(e.target.value))}
        >
          <option value="" disabled>
            Choose a track...
          </option>
          {tracks?.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      </div>

      {selectedTrackId !== null && (
        <>
          <Card>
            <h2 className="font-semibold mb-3">Add New Lesson</h2>
            <div className="space-y-2">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input
                placeholder="XP Reward"
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
              />
              <Input
                placeholder="Mastery Threshold (%)"
                type="number"
                value={masteryThreshold}
                onChange={(e) => setMasteryThreshold(e.target.value)}
              />
              <Button onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : '+ Add Lesson'}
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            {lessons?.map((lesson) => (
              <Card key={lesson.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {lesson.title} <span className="text-xs text-gray-400">#{lesson.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    +{lesson.xp_reward} XP · {lesson.mastery_threshold}% mastery
                  </p>
                </div>
                <Button
                  onClick={() => deleteMutation.mutate(lesson.id)}
                  className="bg-red-100 text-red-700 hover:bg-red-200 text-sm px-3 py-1"
                >
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
