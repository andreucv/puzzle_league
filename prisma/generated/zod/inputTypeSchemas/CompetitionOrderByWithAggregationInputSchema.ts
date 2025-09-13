import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CompetitionCountOrderByAggregateInputSchema } from './CompetitionCountOrderByAggregateInputSchema';
import { CompetitionAvgOrderByAggregateInputSchema } from './CompetitionAvgOrderByAggregateInputSchema';
import { CompetitionMaxOrderByAggregateInputSchema } from './CompetitionMaxOrderByAggregateInputSchema';
import { CompetitionMinOrderByAggregateInputSchema } from './CompetitionMinOrderByAggregateInputSchema';
import { CompetitionSumOrderByAggregateInputSchema } from './CompetitionSumOrderByAggregateInputSchema';

export const CompetitionOrderByWithAggregationInputSchema: z.ZodType<Prisma.CompetitionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  location: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  image_cld_id: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  leagueId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  creatorId: z.lazy(() => SortOrderSchema).optional(),
  registrationOpen: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CompetitionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CompetitionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CompetitionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CompetitionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CompetitionSumOrderByAggregateInputSchema).optional()
}).strict();

export default CompetitionOrderByWithAggregationInputSchema;
