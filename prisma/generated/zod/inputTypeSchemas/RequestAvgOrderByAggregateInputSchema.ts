import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RequestAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RequestAvgOrderByAggregateInput> = z.object({
  competitionId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RequestAvgOrderByAggregateInputSchema;
