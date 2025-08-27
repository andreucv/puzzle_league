import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';
import { RecordUpdateManyMutationInputSchema } from './RecordUpdateManyMutationInputSchema';
import { RecordUncheckedUpdateManyWithoutUsersInputSchema } from './RecordUncheckedUpdateManyWithoutUsersInputSchema';

export const RecordUpdateManyWithWhereWithoutUsersInputSchema: z.ZodType<Prisma.RecordUpdateManyWithWhereWithoutUsersInput> = z.object({
  where: z.lazy(() => RecordScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateManyMutationInputSchema),z.lazy(() => RecordUncheckedUpdateManyWithoutUsersInputSchema) ]),
}).strict();

export default RecordUpdateManyWithWhereWithoutUsersInputSchema;
