import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateWithoutRecordsInputSchema } from './UserUpdateWithoutRecordsInputSchema';
import { UserUncheckedUpdateWithoutRecordsInputSchema } from './UserUncheckedUpdateWithoutRecordsInputSchema';
import { UserCreateWithoutRecordsInputSchema } from './UserCreateWithoutRecordsInputSchema';
import { UserUncheckedCreateWithoutRecordsInputSchema } from './UserUncheckedCreateWithoutRecordsInputSchema';

export const UserUpsertWithWhereUniqueWithoutRecordsInputSchema: z.ZodType<Prisma.UserUpsertWithWhereUniqueWithoutRecordsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserUpdateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRecordsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema) ]),
}).strict();

export default UserUpsertWithWhereUniqueWithoutRecordsInputSchema;
