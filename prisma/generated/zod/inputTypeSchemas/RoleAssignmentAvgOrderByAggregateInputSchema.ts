import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RoleAssignmentAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RoleAssignmentAvgOrderByAggregateInput> = z.object({
  competitionId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RoleAssignmentAvgOrderByAggregateInputSchema;
