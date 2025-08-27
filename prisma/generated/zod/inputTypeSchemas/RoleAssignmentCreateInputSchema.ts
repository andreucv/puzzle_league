import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { UserCreateNestedOneWithoutRoleAssignmentsInputSchema } from './UserCreateNestedOneWithoutRoleAssignmentsInputSchema';
import { CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema } from './CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema';

export const RoleAssignmentCreateInputSchema: z.ZodType<Prisma.RoleAssignmentCreateInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRoleAssignmentsInputSchema),
  competition: z.lazy(() => CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema).optional()
}).strict();

export default RoleAssignmentCreateInputSchema;
