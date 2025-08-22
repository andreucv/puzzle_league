import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutUsersInputSchema } from './RecordUpdateWithoutUsersInputSchema';
import { RecordUncheckedUpdateWithoutUsersInputSchema } from './RecordUncheckedUpdateWithoutUsersInputSchema';

export const RecordUpdateWithWhereUniqueWithoutUsersInputSchema: z.ZodType<Prisma.RecordUpdateWithWhereUniqueWithoutUsersInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateWithoutUsersInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutUsersInputSchema) ]),
}).strict();

export default RecordUpdateWithWhereUniqueWithoutUsersInputSchema;
