import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const PuzzleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PuzzleOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default PuzzleOrderByRelationAggregateInputSchema;
