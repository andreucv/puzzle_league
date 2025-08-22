import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CompetitionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CompetitionAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default CompetitionAvgOrderByAggregateInputSchema;
