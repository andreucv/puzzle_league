import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CompetitionSumOrderByAggregateInputSchema: z.ZodType<Prisma.CompetitionSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default CompetitionSumOrderByAggregateInputSchema;
