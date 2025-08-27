import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutUsersInputSchema } from './RecordUpdateWithoutUsersInputSchema';
import { RecordUncheckedUpdateWithoutUsersInputSchema } from './RecordUncheckedUpdateWithoutUsersInputSchema';
import { RecordCreateWithoutUsersInputSchema } from './RecordCreateWithoutUsersInputSchema';
import { RecordUncheckedCreateWithoutUsersInputSchema } from './RecordUncheckedCreateWithoutUsersInputSchema';

export const RecordUpsertWithWhereUniqueWithoutUsersInputSchema: z.ZodType<Prisma.RecordUpsertWithWhereUniqueWithoutUsersInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RecordUpdateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutUsersInputSchema) ]),
  create: z.union([ z.lazy(() => RecordCreateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedCreateWithoutUsersInputSchema) ]),
}).strict();

export default RecordUpsertWithWhereUniqueWithoutUsersInputSchema;
