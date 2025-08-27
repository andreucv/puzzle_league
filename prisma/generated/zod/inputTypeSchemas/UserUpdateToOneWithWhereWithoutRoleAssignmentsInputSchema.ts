import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutRoleAssignmentsInputSchema } from './UserUpdateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './UserUncheckedUpdateWithoutRoleAssignmentsInputSchema';

export const UserUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutRoleAssignmentsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema;
