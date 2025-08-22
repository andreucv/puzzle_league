import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRecordsInputSchema } from './UserCreateWithoutRecordsInputSchema';
import { UserUncheckedCreateWithoutRecordsInputSchema } from './UserUncheckedCreateWithoutRecordsInputSchema';
import { UserCreateOrConnectWithoutRecordsInputSchema } from './UserCreateOrConnectWithoutRecordsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserUncheckedCreateNestedManyWithoutRecordsInputSchema: z.ZodType<Prisma.UserUncheckedCreateNestedManyWithoutRecordsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRecordsInputSchema),z.lazy(() => UserCreateWithoutRecordsInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutRecordsInputSchema),z.lazy(() => UserCreateOrConnectWithoutRecordsInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default UserUncheckedCreateNestedManyWithoutRecordsInputSchema;
