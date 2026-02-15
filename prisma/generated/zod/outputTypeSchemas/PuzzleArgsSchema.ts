import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleSelectSchema } from '../inputTypeSchemas/PuzzleSelectSchema';
import { PuzzleIncludeSchema } from '../inputTypeSchemas/PuzzleIncludeSchema';

export const PuzzleArgsSchema: z.ZodType<Prisma.PuzzleDefaultArgs> = z.object({
  select: z.lazy(() => PuzzleSelectSchema).optional(),
  include: z.lazy(() => PuzzleIncludeSchema).optional(),
}).strict();

export default PuzzleArgsSchema;
