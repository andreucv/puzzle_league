import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RecordSumOrderByAggregateInputSchema: z.ZodType<Prisma.RecordSumOrderByAggregateInput> = z.object({
  tableNumber: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RecordSumOrderByAggregateInputSchema;
