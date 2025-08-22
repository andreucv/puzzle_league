import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutRequestsInputSchema } from './UserCreateWithoutRequestsInputSchema';
import { UserUncheckedCreateWithoutRequestsInputSchema } from './UserUncheckedCreateWithoutRequestsInputSchema';

export const UserCreateOrConnectWithoutRequestsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRequestsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRequestsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutRequestsInputSchema;
