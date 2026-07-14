import { z } from 'zod';

export const lessonCompleteSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number(),
        selectedOptionId: z.number(),
      }),
    )
    .min(1),
});
