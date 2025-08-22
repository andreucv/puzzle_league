import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RecordAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RecordAvgOrderByAggregateInput> = z.object({
  tableNumber: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RecordAvgOrderByAggregateInputSchema;
