import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedRecordsInputSchema } from './UserCreateWithoutCreatedRecordsInputSchema';
import { UserUncheckedCreateWithoutCreatedRecordsInputSchema } from './UserUncheckedCreateWithoutCreatedRecordsInputSchema';
import { UserCreateOrConnectWithoutCreatedRecordsInputSchema } from './UserCreateOrConnectWithoutCreatedRecordsInputSchema';
import { UserUpsertWithoutCreatedRecordsInputSchema } from './UserUpsertWithoutCreatedRecordsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutCreatedRecordsInputSchema } from './UserUpdateToOneWithWhereWithoutCreatedRecordsInputSchema';
import { UserUpdateWithoutCreatedRecordsInputSchema } from './UserUpdateWithoutCreatedRecordsInputSchema';
import { UserUncheckedUpdateWithoutCreatedRecordsInputSchema } from './UserUncheckedUpdateWithoutCreatedRecordsInputSchema';

export const UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCreatedRecordsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedRecordsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedRecordsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedRecordsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedRecordsInputSchema),z.lazy(() => UserUpdateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedRecordsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema;
