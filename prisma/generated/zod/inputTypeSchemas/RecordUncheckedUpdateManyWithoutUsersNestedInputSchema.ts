import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutUsersInputSchema } from './RecordCreateWithoutUsersInputSchema';
import { RecordUncheckedCreateWithoutUsersInputSchema } from './RecordUncheckedCreateWithoutUsersInputSchema';
import { RecordCreateOrConnectWithoutUsersInputSchema } from './RecordCreateOrConnectWithoutUsersInputSchema';
import { RecordUpsertWithWhereUniqueWithoutUsersInputSchema } from './RecordUpsertWithWhereUniqueWithoutUsersInputSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithWhereUniqueWithoutUsersInputSchema } from './RecordUpdateWithWhereUniqueWithoutUsersInputSchema';
import { RecordUpdateManyWithWhereWithoutUsersInputSchema } from './RecordUpdateManyWithWhereWithoutUsersInputSchema';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';

export const RecordUncheckedUpdateManyWithoutUsersNestedInputSchema: z.ZodType<Prisma.RecordUncheckedUpdateManyWithoutUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutUsersInputSchema),z.lazy(() => RecordCreateWithoutUsersInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutUsersInputSchema),z.lazy(() => RecordCreateOrConnectWithoutUsersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RecordUpsertWithWhereUniqueWithoutUsersInputSchema),z.lazy(() => RecordUpsertWithWhereUniqueWithoutUsersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RecordUpdateWithWhereUniqueWithoutUsersInputSchema),z.lazy(() => RecordUpdateWithWhereUniqueWithoutUsersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RecordUpdateManyWithWhereWithoutUsersInputSchema),z.lazy(() => RecordUpdateManyWithWhereWithoutUsersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RecordScalarWhereInputSchema),z.lazy(() => RecordScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RecordUncheckedUpdateManyWithoutUsersNestedInputSchema;
