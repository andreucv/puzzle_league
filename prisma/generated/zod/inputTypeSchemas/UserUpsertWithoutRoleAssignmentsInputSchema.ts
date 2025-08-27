import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutRoleAssignmentsInputSchema } from './UserUpdateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './UserUncheckedUpdateWithoutRoleAssignmentsInputSchema';
import { UserCreateWithoutRoleAssignmentsInputSchema } from './UserCreateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedCreateWithoutRoleAssignmentsInputSchema } from './UserUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.UserUpsertWithoutRoleAssignmentsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRoleAssignmentsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutRoleAssignmentsInputSchema;
