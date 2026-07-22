'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Option = { id: number; label: string };
type Question = { id: number; type: string; prompt: string; options: Option[] };
type Lesson = { id: number; track_id: number; title: string; xp_reward: number; mastery_threshold: number };

type CompleteResult = {
  score: number;
  xpEarned: number;
  newTotalXp: number;
  mastered: boolean;
  leveledUp: boolean;
  correctAnswers: { questionId: number; correctOptionId: number | null; explanation: string }[];
};

async function fetchLesson(lessonId: string): Promise<{ lesson: Lesson; questions: Question[] }> {
  const response = await fetch(`/api/v1/lessons/${lessonId}`);
  const result = (await response.json()) as {
    data?: { lesson: Lesson; questions: Question[] };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Failed to load lesson');
  }

  return result.data!;
}

async function submitLesson(
  lessonId: string,
  answers: { questionId: number; selectedOptionId: number }[],
): Promise<CompleteResult> {
  const response = await fetch(`/api/v1/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  const result = (await response.json()) as { data?: CompleteResult; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Failed to submit lesson');
  }

  return result.data!;
}

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLesson(lessonId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      submitLesson(
        lessonId,
        Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId,
        })),
      ),
    onSuccess: (result) => {
      const correctCount = result.correctAnswers.filter(
        (c) => c.correctOptionId === answers[c.questionId],
      ).length;

      sessionStorage.setItem(
        `lesson-result-${lessonId}`,
        JSON.stringify({
          ...result,
          questions: data?.questions.map((q) => ({ id: q.id, prompt: q.prompt })) ?? [],
          answers,
          trackId: data?.lesson.track_id,
          totalQuestions: data?.questions.length ?? 0,
          correctCount,
        }),
      );

      router.push(`/lesson/${lessonId}/results`);
    },
  });

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading lesson...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-red-600 dark:text-red-400">{(error as Error).message}</p>
      </main>
    );
  }

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;

  function selectOption(optionId: number) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  }

  function goNext() {
    if (isLastQuestion) {
      mutation.mutate();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Question {currentIndex + 1} of {questions.length}
      </p>
      <h1 className="text-xl font-semibold">{currentQuestion?.prompt}</h1>
      <div className="space-y-3" role="radiogroup" aria-label="Answer options">
        {currentQuestion?.options.map((option) => (
          <Card
            key={option.id}
            role="radio"
            aria-checked={selectedOptionId === option.id}
            tabIndex={0}
            onClick={() => selectOption(option.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(option.id);
              }
            }}
            className={`cursor-pointer border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              selectedOptionId === option.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-transparent'
            }`}
          >
            {option.label}
          </Card>
        ))}
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">{(mutation.error as Error).message}</p>
      )}
      <Button
        onClick={goNext}
        disabled={!selectedOptionId || mutation.isPending}
        className="w-full"
      >
        {mutation.isPending ? 'Submitting...' : isLastQuestion ? 'See Results' : 'Next Question'}
      </Button>
    </main>
  );
}
