import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedRecordsInputSchema } from './UserCreateWithoutCreatedRecordsInputSchema';
import { UserUncheckedCreateWithoutCreatedRecordsInputSchema } from './UserUncheckedCreateWithoutCreatedRecordsInputSchema';
import { UserCreateOrConnectWithoutCreatedRecordsInputSchema } from './UserCreateOrConnectWithoutCreatedRecordsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutCreatedRecordsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedRecordsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedRecordsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedRecordsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutCreatedRecordsInputSchema;
