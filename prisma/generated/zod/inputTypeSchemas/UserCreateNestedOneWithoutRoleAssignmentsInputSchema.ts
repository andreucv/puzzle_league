import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRoleAssignmentsInputSchema } from './UserCreateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedCreateWithoutRoleAssignmentsInputSchema } from './UserUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { UserCreateOrConnectWithoutRoleAssignmentsInputSchema } from './UserCreateOrConnectWithoutRoleAssignmentsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutRoleAssignmentsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRoleAssignmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRoleAssignmentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutRoleAssignmentsInputSchema;
