import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CategoryAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  maxPartySize: z.lazy(() => SortOrderSchema).optional(),
  maxParties: z.lazy(() => SortOrderSchema).optional(),
  competitionId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default CategoryAvgOrderByAggregateInputSchema;
