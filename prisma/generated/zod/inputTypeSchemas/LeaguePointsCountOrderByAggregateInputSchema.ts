import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const LeaguePointsCountOrderByAggregateInputSchema: z.ZodType<Prisma.LeaguePointsCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  totalPoints: z.lazy(() => SortOrderSchema).optional(),
  leagueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default LeaguePointsCountOrderByAggregateInputSchema;
