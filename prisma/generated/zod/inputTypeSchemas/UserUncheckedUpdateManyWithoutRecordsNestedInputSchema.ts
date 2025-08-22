import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutRecordsInputSchema } from './UserCreateWithoutRecordsInputSchema';
import { UserUncheckedCreateWithoutRecordsInputSchema } from './UserUncheckedCreateWithoutRecordsInputSchema';
import { UserCreateOrConnectWithoutRecordsInputSchema } from './UserCreateOrConnectWithoutRecordsInputSchema';
import { UserUpsertWithWhereUniqueWithoutRecordsInputSchema } from './UserUpsertWithWhereUniqueWithoutRecordsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateWithWhereUniqueWithoutRecordsInputSchema } from './UserUpdateWithWhereUniqueWithoutRecordsInputSchema';
import { UserUpdateManyWithWhereWithoutRecordsInputSchema } from './UserUpdateManyWithWhereWithoutRecordsInputSchema';
import { UserScalarWhereInputSchema } from './UserScalarWhereInputSchema';

export const UserUncheckedUpdateManyWithoutRecordsNestedInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutRecordsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutRecordsInputSchema),z.lazy(() => UserCreateWithoutRecordsInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRecordsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutRecordsInputSchema),z.lazy(() => UserCreateOrConnectWithoutRecordsInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutRecordsInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutRecordsInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutRecordsInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutRecordsInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutRecordsInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutRecordsInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default UserUncheckedUpdateManyWithoutRecordsNestedInputSchema;
