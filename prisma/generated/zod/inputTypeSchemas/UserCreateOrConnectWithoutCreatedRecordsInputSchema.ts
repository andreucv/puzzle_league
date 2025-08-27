import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutCreatedRecordsInputSchema } from './UserCreateWithoutCreatedRecordsInputSchema';
import { UserUncheckedCreateWithoutCreatedRecordsInputSchema } from './UserUncheckedCreateWithoutCreatedRecordsInputSchema';

export const UserCreateOrConnectWithoutCreatedRecordsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedRecordsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedRecordsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutCreatedRecordsInputSchema;
