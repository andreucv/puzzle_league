import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const LeaguePointsOrderByRelationAggregateInputSchema: z.ZodType<Prisma.LeaguePointsOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default LeaguePointsOrderByRelationAggregateInputSchema;
