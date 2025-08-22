import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRequestsInputSchema } from './UserCreateWithoutRequestsInputSchema';
import { UserUncheckedCreateWithoutRequestsInputSchema } from './UserUncheckedCreateWithoutRequestsInputSchema';
import { UserCreateOrConnectWithoutRequestsInputSchema } from './UserCreateOrConnectWithoutRequestsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutRequestsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutRequestsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRequestsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRequestsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutRequestsInputSchema;
