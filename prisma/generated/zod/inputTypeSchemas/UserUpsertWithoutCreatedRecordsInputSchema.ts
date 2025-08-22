import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutCreatedRecordsInputSchema } from './UserUpdateWithoutCreatedRecordsInputSchema';
import { UserUncheckedUpdateWithoutCreatedRecordsInputSchema } from './UserUncheckedUpdateWithoutCreatedRecordsInputSchema';
import { UserCreateWithoutCreatedRecordsInputSchema } from './UserCreateWithoutCreatedRecordsInputSchema';
import { UserUncheckedCreateWithoutCreatedRecordsInputSchema } from './UserUncheckedCreateWithoutCreatedRecordsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutCreatedRecordsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedRecordsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedRecordsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedRecordsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutCreatedRecordsInputSchema;
