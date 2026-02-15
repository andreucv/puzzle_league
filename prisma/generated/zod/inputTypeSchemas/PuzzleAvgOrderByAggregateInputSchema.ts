import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const PuzzleAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PuzzleAvgOrderByAggregateInput> = z.object({
  pieces: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default PuzzleAvgOrderByAggregateInputSchema;
