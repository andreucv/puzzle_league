import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const PuzzleSumOrderByAggregateInputSchema: z.ZodType<Prisma.PuzzleSumOrderByAggregateInput> = z.object({
  pieces: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default PuzzleSumOrderByAggregateInputSchema;
