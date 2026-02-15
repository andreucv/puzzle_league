import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const PuzzleCountOutputTypeSelectSchema: z.ZodType<Prisma.PuzzleCountOutputTypeSelect> = z.object({
  categories: z.boolean().optional(),
}).strict();

export default PuzzleCountOutputTypeSelectSchema;
