import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';
import { RecordUpdateManyMutationInputSchema } from './RecordUpdateManyMutationInputSchema';
import { RecordUncheckedUpdateManyWithoutCategoryInputSchema } from './RecordUncheckedUpdateManyWithoutCategoryInputSchema';

export const RecordUpdateManyWithWhereWithoutCategoryInputSchema: z.ZodType<Prisma.RecordUpdateManyWithWhereWithoutCategoryInput> = z.object({
  where: z.lazy(() => RecordScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateManyMutationInputSchema),z.lazy(() => RecordUncheckedUpdateManyWithoutCategoryInputSchema) ]),
}).strict();

export default RecordUpdateManyWithWhereWithoutCategoryInputSchema;
