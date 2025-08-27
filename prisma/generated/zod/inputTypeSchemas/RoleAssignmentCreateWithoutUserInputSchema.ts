import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema } from './CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema';

export const RoleAssignmentCreateWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentCreateWithoutUserInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  competition: z.lazy(() => CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema).optional()
}).strict();

export default RoleAssignmentCreateWithoutUserInputSchema;
