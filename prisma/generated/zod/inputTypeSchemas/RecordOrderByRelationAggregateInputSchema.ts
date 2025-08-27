import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RecordOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RecordOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RecordOrderByRelationAggregateInputSchema;
