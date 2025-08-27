import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { RoleAssignmentCountOrderByAggregateInputSchema } from './RoleAssignmentCountOrderByAggregateInputSchema';
import { RoleAssignmentAvgOrderByAggregateInputSchema } from './RoleAssignmentAvgOrderByAggregateInputSchema';
import { RoleAssignmentMaxOrderByAggregateInputSchema } from './RoleAssignmentMaxOrderByAggregateInputSchema';
import { RoleAssignmentMinOrderByAggregateInputSchema } from './RoleAssignmentMinOrderByAggregateInputSchema';
import { RoleAssignmentSumOrderByAggregateInputSchema } from './RoleAssignmentSumOrderByAggregateInputSchema';

export const RoleAssignmentOrderByWithAggregationInputSchema: z.ZodType<Prisma.RoleAssignmentOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  competitionId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RoleAssignmentCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RoleAssignmentAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RoleAssignmentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RoleAssignmentMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RoleAssignmentSumOrderByAggregateInputSchema).optional()
}).strict();

export default RoleAssignmentOrderByWithAggregationInputSchema;
