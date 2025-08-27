import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutRecordsInputSchema } from './UserCreateWithoutRecordsInputSchema';
import { UserUncheckedCreateWithoutRecordsInputSchema } from './UserUncheckedCreateWithoutRecordsInputSchema';

export const UserCreateOrConnectWithoutRecordsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRecordsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutRecordsInputSchema;
