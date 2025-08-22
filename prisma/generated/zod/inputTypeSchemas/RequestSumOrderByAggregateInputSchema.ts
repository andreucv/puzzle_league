import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RequestSumOrderByAggregateInputSchema: z.ZodType<Prisma.RequestSumOrderByAggregateInput> = z.object({
  competitionId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RequestSumOrderByAggregateInputSchema;
