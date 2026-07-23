'use client';

import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const steps = [
  {
    title: 'Take today’s challenge',
    description: 'One quick question every day — no prep, no login streaks to maintain manually.',
  },
  {
    title: 'Learn in short lessons',
    description: 'Work through focused tracks like Cognitive Biases 101, a few minutes at a time.',
  },
  {
    title: 'Build your streak',
    description: 'Earn XP, track mastery, and watch your streak grow the more you show up.',
  },
];

const tracks = [
  {
    title: 'Cognitive Biases 101',
    description:
      'Learn to spot the mental shortcuts that quietly distort your judgment — and how to catch yourself in the act.',
  },
  {
    title: 'Difficult Conversations',
    description:
      'Practical, evidence-based skills for handling feedback, conflict, and disagreement without damaging the relationship.',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex-1 bg-gray-50 dark:bg-gray-950">
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Think Better.</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          MindDetective helps you catch cognitive biases and navigate hard conversations, one short daily lesson at a time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => router.push('/signup')} className="w-full sm:w-auto">
            Sign Up
          </Button>
          <Button variant="secondary" onClick={() => router.push('/login')} className="w-full sm:w-auto">
            Log In
          </Button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Step {index + 1}</span>
              <h3 className="font-semibold text-lg mt-1 text-gray-900 dark:text-gray-50">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-50 mb-8">Explore the tracks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => (
            <Card key={track.title} hoverable>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">{track.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{track.description}</p>
              <Button variant="secondary" onClick={() => router.push('/signup')} className="mt-4 w-full">
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © 2026 MindDetective
      </footer>
    </main>
  );
}
