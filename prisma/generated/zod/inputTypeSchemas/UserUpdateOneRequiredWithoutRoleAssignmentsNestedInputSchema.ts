import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRoleAssignmentsInputSchema } from './UserCreateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedCreateWithoutRoleAssignmentsInputSchema } from './UserUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { UserCreateOrConnectWithoutRoleAssignmentsInputSchema } from './UserCreateOrConnectWithoutRoleAssignmentsInputSchema';
import { UserUpsertWithoutRoleAssignmentsInputSchema } from './UserUpsertWithoutRoleAssignmentsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema } from './UserUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema';
import { UserUpdateWithoutRoleAssignmentsInputSchema } from './UserUpdateWithoutRoleAssignmentsInputSchema';
import { UserUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './UserUncheckedUpdateWithoutRoleAssignmentsInputSchema';

export const UserUpdateOneRequiredWithoutRoleAssignmentsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutRoleAssignmentsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRoleAssignmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRoleAssignmentsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutRoleAssignmentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutRoleAssignmentsNestedInputSchema;
