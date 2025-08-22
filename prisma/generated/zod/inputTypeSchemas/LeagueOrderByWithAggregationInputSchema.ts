import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { LeagueCountOrderByAggregateInputSchema } from './LeagueCountOrderByAggregateInputSchema';
import { LeagueMaxOrderByAggregateInputSchema } from './LeagueMaxOrderByAggregateInputSchema';
import { LeagueMinOrderByAggregateInputSchema } from './LeagueMinOrderByAggregateInputSchema';

export const LeagueOrderByWithAggregationInputSchema: z.ZodType<Prisma.LeagueOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => LeagueCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => LeagueMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => LeagueMinOrderByAggregateInputSchema).optional()
}).strict();

export default LeagueOrderByWithAggregationInputSchema;
