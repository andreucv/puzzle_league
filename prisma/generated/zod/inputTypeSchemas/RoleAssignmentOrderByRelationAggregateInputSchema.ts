import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RoleAssignmentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RoleAssignmentOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default RoleAssignmentOrderByRelationAggregateInputSchema;
