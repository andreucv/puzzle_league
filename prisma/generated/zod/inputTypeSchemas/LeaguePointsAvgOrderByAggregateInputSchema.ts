import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const LeaguePointsAvgOrderByAggregateInputSchema: z.ZodType<Prisma.LeaguePointsAvgOrderByAggregateInput> = z.object({
  totalPoints: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default LeaguePointsAvgOrderByAggregateInputSchema;
