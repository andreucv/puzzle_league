import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutUsersInputSchema } from './RecordCreateWithoutUsersInputSchema';
import { RecordUncheckedCreateWithoutUsersInputSchema } from './RecordUncheckedCreateWithoutUsersInputSchema';
import { RecordCreateOrConnectWithoutUsersInputSchema } from './RecordCreateOrConnectWithoutUsersInputSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';

export const RecordCreateNestedManyWithoutUsersInputSchema: z.ZodType<Prisma.RecordCreateNestedManyWithoutUsersInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutUsersInputSchema),z.lazy(() => RecordCreateWithoutUsersInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutUsersInputSchema),z.lazy(() => RecordCreateOrConnectWithoutUsersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RecordCreateNestedManyWithoutUsersInputSchema;
