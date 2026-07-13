import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/**
 * Validates the data required to create a new account.
 */
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .refine((value) => passwordRegex.test(value), {
      message: 'Password must contain at least one letter and one number',
    }),
});

/**
 * Validates the data required to sign in to an existing account.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().trim().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
