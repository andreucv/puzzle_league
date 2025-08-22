import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRequestsInputSchema } from './UserCreateWithoutRequestsInputSchema';
import { UserUncheckedCreateWithoutRequestsInputSchema } from './UserUncheckedCreateWithoutRequestsInputSchema';
import { UserCreateOrConnectWithoutRequestsInputSchema } from './UserCreateOrConnectWithoutRequestsInputSchema';
import { UserUpsertWithoutRequestsInputSchema } from './UserUpsertWithoutRequestsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutRequestsInputSchema } from './UserUpdateToOneWithWhereWithoutRequestsInputSchema';
import { UserUpdateWithoutRequestsInputSchema } from './UserUpdateWithoutRequestsInputSchema';
import { UserUncheckedUpdateWithoutRequestsInputSchema } from './UserUncheckedUpdateWithoutRequestsInputSchema';

export const UserUpdateOneRequiredWithoutRequestsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutRequestsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRequestsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRequestsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutRequestsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutRequestsInputSchema),z.lazy(() => UserUpdateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRequestsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutRequestsNestedInputSchema;
