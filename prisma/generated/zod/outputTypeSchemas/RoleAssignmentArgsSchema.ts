import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentSelectSchema } from '../inputTypeSchemas/RoleAssignmentSelectSchema';
import { RoleAssignmentIncludeSchema } from '../inputTypeSchemas/RoleAssignmentIncludeSchema';

export const RoleAssignmentArgsSchema: z.ZodType<Prisma.RoleAssignmentDefaultArgs> = z.object({
  select: z.lazy(() => RoleAssignmentSelectSchema).optional(),
  include: z.lazy(() => RoleAssignmentIncludeSchema).optional(),
}).strict();

export default RoleAssignmentArgsSchema;
