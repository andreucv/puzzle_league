import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleCountOutputTypeSelectSchema } from './PuzzleCountOutputTypeSelectSchema';

export const PuzzleCountOutputTypeArgsSchema: z.ZodType<Prisma.PuzzleCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PuzzleCountOutputTypeSelectSchema).nullish(),
}).strict();

export default PuzzleCountOutputTypeSelectSchema;
