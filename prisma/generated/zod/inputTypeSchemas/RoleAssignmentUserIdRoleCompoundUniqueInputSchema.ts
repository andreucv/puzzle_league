import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';

export const RoleAssignmentUserIdRoleCompoundUniqueInputSchema: z.ZodType<Prisma.RoleAssignmentUserIdRoleCompoundUniqueInput> = z.object({
  userId: z.string(),
  role: z.lazy(() => RoleSchema)
}).strict();

export default RoleAssignmentUserIdRoleCompoundUniqueInputSchema;
