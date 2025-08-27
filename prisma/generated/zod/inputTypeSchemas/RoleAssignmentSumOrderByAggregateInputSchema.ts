import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RoleAssignmentSumOrderByAggregateInputSchema: z.ZodType<Prisma.RoleAssignmentSumOrderByAggregateInput> = z.object({
  competitionId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RoleAssignmentSumOrderByAggregateInputSchema;
