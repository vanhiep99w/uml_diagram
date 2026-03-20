import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export function validateRegisterInput(data: unknown): {
  success: boolean;
  error?: unknown;
  data?: { email: string; password: string; name?: string };
} {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}
