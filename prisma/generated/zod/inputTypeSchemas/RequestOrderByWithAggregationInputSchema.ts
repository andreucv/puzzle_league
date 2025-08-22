import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { RequestCountOrderByAggregateInputSchema } from './RequestCountOrderByAggregateInputSchema';
import { RequestAvgOrderByAggregateInputSchema } from './RequestAvgOrderByAggregateInputSchema';
import { RequestMaxOrderByAggregateInputSchema } from './RequestMaxOrderByAggregateInputSchema';
import { RequestMinOrderByAggregateInputSchema } from './RequestMinOrderByAggregateInputSchema';
import { RequestSumOrderByAggregateInputSchema } from './RequestSumOrderByAggregateInputSchema';

export const RequestOrderByWithAggregationInputSchema: z.ZodType<Prisma.RequestOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  competitionId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  reason: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  additionalInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => RequestCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RequestAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RequestMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RequestMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RequestSumOrderByAggregateInputSchema).optional()
}).strict();

export default RequestOrderByWithAggregationInputSchema;
