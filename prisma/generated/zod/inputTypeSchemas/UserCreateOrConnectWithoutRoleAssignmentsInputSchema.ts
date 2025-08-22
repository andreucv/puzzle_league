import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutRoleAssignmentsInputSchema } from './UserCreateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedCreateWithoutRoleAssignmentsInputSchema } from './UserUncheckedCreateWithoutRoleAssignmentsInputSchema';

export const UserCreateOrConnectWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRoleAssignmentsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRoleAssignmentsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutRoleAssignmentsInputSchema;
