import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { RecordCountOrderByAggregateInputSchema } from './RecordCountOrderByAggregateInputSchema';
import { RecordAvgOrderByAggregateInputSchema } from './RecordAvgOrderByAggregateInputSchema';
import { RecordMaxOrderByAggregateInputSchema } from './RecordMaxOrderByAggregateInputSchema';
import { RecordMinOrderByAggregateInputSchema } from './RecordMinOrderByAggregateInputSchema';
import { RecordSumOrderByAggregateInputSchema } from './RecordSumOrderByAggregateInputSchema';

export const RecordOrderByWithAggregationInputSchema: z.ZodType<Prisma.RecordOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  finishTime: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  tableNumber: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional(),
  creatorId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RecordCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RecordAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RecordMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RecordMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RecordSumOrderByAggregateInputSchema).optional()
}).strict();

export default RecordOrderByWithAggregationInputSchema;
