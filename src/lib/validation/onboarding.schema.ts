import { z } from 'zod';

export const onboardingSchema = z.object({
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});
