'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const TRACKS = [
  {
    slug: 'cognitive-biases-101',
    title: 'Cognitive Biases 101',
    description: 'Spot the mental shortcuts that quietly distort your judgment.',
  },
  {
    slug: 'difficult-conversations',
    title: 'Difficult Conversations',
    description: 'Handle feedback, conflict, and disagreement with confidence.',
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTrack(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function handleContinue() {
    if (selected.length === 0) {
      setError('Pick at least one topic to continue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selected }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message ?? 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">What are you most interested in?</h1>
        <p className="text-gray-500">Pick one or more — we&apos;ll recommend a track to start with.</p>
      </div>

      <div className="grid gap-4">
        {TRACKS.map((track) => {
          const isSelected = selected.includes(track.slug);
          const isRecommended = selected[0] === track.slug;

          return (
            <Card
              key={track.slug}
              onClick={() => toggleTrack(track.slug)}
              className={`cursor-pointer transition border-2 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{track.title}</h2>
                  <p className="text-sm text-gray-500">{track.description}</p>
                </div>
                {isRecommended && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <Button onClick={handleContinue} disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
