import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereInputSchema } from './RoleAssignmentWhereInputSchema';

export const RoleAssignmentListRelationFilterSchema: z.ZodType<Prisma.RoleAssignmentListRelationFilter> = z.object({
  every: z.lazy(() => RoleAssignmentWhereInputSchema).optional(),
  some: z.lazy(() => RoleAssignmentWhereInputSchema).optional(),
  none: z.lazy(() => RoleAssignmentWhereInputSchema).optional()
}).strict();

export default RoleAssignmentListRelationFilterSchema;
