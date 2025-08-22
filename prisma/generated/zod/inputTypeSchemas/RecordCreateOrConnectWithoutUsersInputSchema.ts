import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordCreateWithoutUsersInputSchema } from './RecordCreateWithoutUsersInputSchema';
import { RecordUncheckedCreateWithoutUsersInputSchema } from './RecordUncheckedCreateWithoutUsersInputSchema';

export const RecordCreateOrConnectWithoutUsersInputSchema: z.ZodType<Prisma.RecordCreateOrConnectWithoutUsersInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RecordCreateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema) ]),
}).strict();

export default RecordCreateOrConnectWithoutUsersInputSchema;
