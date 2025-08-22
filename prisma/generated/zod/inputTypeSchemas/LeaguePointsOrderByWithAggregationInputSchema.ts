import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { LeaguePointsCountOrderByAggregateInputSchema } from './LeaguePointsCountOrderByAggregateInputSchema';
import { LeaguePointsAvgOrderByAggregateInputSchema } from './LeaguePointsAvgOrderByAggregateInputSchema';
import { LeaguePointsMaxOrderByAggregateInputSchema } from './LeaguePointsMaxOrderByAggregateInputSchema';
import { LeaguePointsMinOrderByAggregateInputSchema } from './LeaguePointsMinOrderByAggregateInputSchema';
import { LeaguePointsSumOrderByAggregateInputSchema } from './LeaguePointsSumOrderByAggregateInputSchema';

export const LeaguePointsOrderByWithAggregationInputSchema: z.ZodType<Prisma.LeaguePointsOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  totalPoints: z.lazy(() => SortOrderSchema).optional(),
  leagueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => LeaguePointsCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => LeaguePointsAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => LeaguePointsMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => LeaguePointsMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => LeaguePointsSumOrderByAggregateInputSchema).optional()
}).strict();

export default LeaguePointsOrderByWithAggregationInputSchema;
