'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type CorrectAnswer = { questionId: number; correctOptionId: number | null; explanation: string };

type ResultData = {
  score: number;
  xpEarned: number;
  newTotalXp: number;
  mastered: boolean;
  leveledUp: boolean;
  correctAnswers: CorrectAnswer[];
  questions: { id: number; prompt: string }[];
  answers: Record<number, number>;
  trackId: number;
  totalQuestions: number;
  correctCount: number;
};

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.2, ease: 'easeOut' });
    const unsubscribe = rounded.on('change', (latest) => setDisplay(latest));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded]);

  return <span>{display}</span>;
}

export default function ResultsPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [showMistakes, setShowMistakes] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`lesson-result-${lessonId}`);
    if (!raw) {
      router.replace(`/lesson/${lessonId}`);
      return;
    }
    setResult(JSON.parse(raw));
  }, [lessonId, router]);

  if (!result) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
      </main>
    );
  }

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (result.score / 100) * circumference;
  const mistakes = result.correctAnswers.filter((c) => {
    const selected = result.answers[c.questionId];
    return c.correctOptionId !== selected;
  });

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold"
      >
        🎉 Lesson Complete
      </motion.h1>

      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            {result.correctCount}/{result.totalQuestions}
          </div>
        </div>

        <p className="text-lg">
          XP earned: <span className="font-bold text-blue-600 dark:text-blue-400">+<AnimatedNumber value={result.xpEarned} /></span>
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          New total XP: <AnimatedNumber value={result.newTotalXp} />
        </p>

        {result.mastered && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="text-green-600 dark:text-green-400 font-semibold"
          >
            Mastered ✅
          </motion.p>
        )}

        {result.leveledUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-4 py-2 rounded-full font-semibold"
          >
            Level Up! 🎊
          </motion.div>
        )}
      </div>

      {mistakes.length > 0 && (
        <div className="text-left">
          <button
            onClick={() => setShowMistakes((prev) => !prev)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {showMistakes ? 'Hide' : 'Review'} missed questions ({mistakes.length})
          </button>

          {showMistakes && (
            <div className="space-y-3 mt-3">
              {mistakes.map((m) => {
                const question = result.questions.find((q) => q.id === m.questionId);
                return (
                  <Card key={m.questionId}>
                    <p className="font-medium">{question?.prompt}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.explanation}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 justify-center pt-4">
        <Link href={`/tracks/${result.trackId}`}>
          <Button className="px-6">Next Lesson →</Button>
        </Link>
        <Link href="/dashboard">
          <Button className="px-6 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
