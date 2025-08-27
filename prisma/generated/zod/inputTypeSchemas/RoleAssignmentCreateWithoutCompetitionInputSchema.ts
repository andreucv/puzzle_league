import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { UserCreateNestedOneWithoutRoleAssignmentsInputSchema } from './UserCreateNestedOneWithoutRoleAssignmentsInputSchema';

export const RoleAssignmentCreateWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentCreateWithoutCompetitionInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRoleAssignmentsInputSchema)
}).strict();

export default RoleAssignmentCreateWithoutCompetitionInputSchema;
