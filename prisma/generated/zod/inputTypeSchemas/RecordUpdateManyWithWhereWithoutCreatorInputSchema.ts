import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';
import { RecordUpdateManyMutationInputSchema } from './RecordUpdateManyMutationInputSchema';
import { RecordUncheckedUpdateManyWithoutCreatorInputSchema } from './RecordUncheckedUpdateManyWithoutCreatorInputSchema';

export const RecordUpdateManyWithWhereWithoutCreatorInputSchema: z.ZodType<Prisma.RecordUpdateManyWithWhereWithoutCreatorInput> = z.object({
  where: z.lazy(() => RecordScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateManyMutationInputSchema),z.lazy(() => RecordUncheckedUpdateManyWithoutCreatorInputSchema) ]),
}).strict();

export default RecordUpdateManyWithWhereWithoutCreatorInputSchema;
