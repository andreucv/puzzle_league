import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleWhereInputSchema } from './PuzzleWhereInputSchema';

export const PuzzleListRelationFilterSchema: z.ZodType<Prisma.PuzzleListRelationFilter> = z.object({
  every: z.lazy(() => PuzzleWhereInputSchema).optional(),
  some: z.lazy(() => PuzzleWhereInputSchema).optional(),
  none: z.lazy(() => PuzzleWhereInputSchema).optional()
}).strict();

export default PuzzleListRelationFilterSchema;
