import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const LeaguePointsSumOrderByAggregateInputSchema: z.ZodType<Prisma.LeaguePointsSumOrderByAggregateInput> = z.object({
  totalPoints: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default LeaguePointsSumOrderByAggregateInputSchema;
