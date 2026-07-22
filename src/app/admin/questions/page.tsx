'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Track = { id: number; title: string };
type Lesson = { id: number; title: string };
type Question = { id: number; prompt: string; type: string };

async function fetchTracks(): Promise<Track[]> {
  const response = await fetch('/api/v1/admin/tracks');
  const result = (await response.json()) as { data?: { tracks: Track[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load tracks');
  return result.data?.tracks ?? [];
}

async function fetchLessonsForTrack(trackId: number): Promise<Lesson[]> {
  const response = await fetch(`/api/v1/tracks/${trackId}`);
  const result = (await response.json()) as { data?: { lessons: Lesson[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load lessons');
  return result.data?.lessons ?? [];
}

async function fetchQuestionsForLesson(lessonId: number): Promise<Question[]> {
  const response = await fetch(`/api/v1/lessons/${lessonId}`);
  const result = (await response.json()) as { data?: { questions: Question[] }; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load questions');
  return result.data?.questions ?? [];
}

export default function AdminQuestionsPage() {
  const queryClient = useQueryClient();
  const { data: tracks, isError: tracksIsError } = useQuery({ queryKey: ['admin-tracks'], queryFn: fetchTracks });
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const { data: lessons, isError: lessonsIsError } = useQuery({
    queryKey: ['admin-lessons', selectedTrackId],
    queryFn: () => fetchLessonsForTrack(selectedTrackId!),
    enabled: selectedTrackId !== null,
  });

  const { data: questions, isError: questionsIsError } = useQuery({
    queryKey: ['admin-questions', selectedLessonId],
    queryFn: () => fetchQuestionsForLesson(selectedLessonId!),
    enabled: selectedLessonId !== null,
  });

  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [sourceCitation, setSourceCitation] = useState('');
  const [options, setOptions] = useState([
    { label: '', is_correct: true },
    { label: '', is_correct: false },
    { label: '', is_correct: false },
    { label: '', is_correct: false },
  ]);

  function updateOptionLabel(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, label: value } : opt)));
  }

  function setCorrectOption(index: number) {
    setOptions((prev) => prev.map((opt, i) => ({ ...opt, is_correct: i === index })));
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: selectedLessonId,
          type: 'mcq',
          prompt,
          explanation,
          source_citation: sourceCitation || undefined,
          options,
        }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create question');
    },
    onSuccess: () => {
      setPrompt('');
      setExplanation('');
      setSourceCitation('');
      setOptions([
        { label: '', is_correct: true },
        { label: '', is_correct: false },
        { label: '', is_correct: false },
        { label: '', is_correct: false },
      ]);
      queryClient.invalidateQueries({ queryKey: ['admin-questions', selectedLessonId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/v1/admin/questions/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-questions', selectedLessonId] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Questions</h1>

      {tracksIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load tracks. Try refreshing the page.</p>
      )}
      {lessonsIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load lessons. Try refreshing the page.</p>
      )}
      {questionsIsError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load questions. Try refreshing the page.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="track-select" className="text-sm text-gray-500 dark:text-gray-400">Track</label>
          <select
            id="track-select"
            className="block w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={selectedTrackId ?? ''}
            onChange={(e) => {
              setSelectedTrackId(Number(e.target.value));
              setSelectedLessonId(null);
            }}
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
          <div>
            <label htmlFor="lesson-select" className="text-sm text-gray-500 dark:text-gray-400">Lesson</label>
            <select
              id="lesson-select"
              className="block w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              value={selectedLessonId ?? ''}
              onChange={(e) => setSelectedLessonId(Number(e.target.value))}
            >
              <option value="" disabled>
                Choose a lesson...
              </option>
              {lessons?.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedLessonId !== null && (
        <>
          <Card>
            <h2 className="font-semibold mb-3">Add New Question</h2>
            <div className="space-y-2">
              <Input aria-label="Prompt" placeholder="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <Input
                aria-label="Explanation"
                placeholder="Explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
              <Input
                aria-label="Source citation (optional)"
                placeholder="Source citation (optional)"
                value={sourceCitation}
                onChange={(e) => setSourceCitation(e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Options (select the correct one):</p>
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    aria-label={`Mark option ${index + 1} as correct`}
                    checked={opt.is_correct}
                    onChange={() => setCorrectOption(index)}
                  />
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={opt.label}
                    onChange={(e) => updateOptionLabel(index, e.target.value)}
                  />
                </div>
              ))}
              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  !prompt || !explanation || options.some((o) => !o.label) || createMutation.isPending
                }
              >
                {createMutation.isPending ? 'Adding...' : '+ Add Question'}
              </Button>
              {createMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">{(createMutation.error as Error).message}</p>
              )}
            </div>
          </Card>

          <div className="space-y-2">
            {questions?.map((question) => (
              <Card key={question.id} className="flex items-center justify-between">
                <p className="font-medium">
                  {question.prompt} <span className="text-xs text-gray-400 dark:text-gray-500">#{question.id}</span>
                </p>
                <Button
                  onClick={() => deleteMutation.mutate(question.id)}
                  className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 text-sm px-3 py-1"
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
