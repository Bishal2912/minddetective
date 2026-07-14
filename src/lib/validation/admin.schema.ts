import { z } from 'zod';

export const trackSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order_index: z.number().default(0),
  is_published: z.boolean().default(false),
});

export const lessonSchema = z.object({
  track_id: z.number(),
  title: z.string().min(1),
  order_index: z.number().default(0),
  xp_reward: z.number().default(10),
  mastery_threshold: z.number().min(0).max(100).default(70),
});

export const questionSchema = z.object({
  lesson_id: z.number(),
  type: z.enum(['mcq', 'scenario', 'rank']),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  source_citation: z.string().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        is_correct: z.boolean(),
      }),
    )
    .min(2),
});
