import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutCategoryInputSchema } from './RecordUpdateWithoutCategoryInputSchema';
import { RecordUncheckedUpdateWithoutCategoryInputSchema } from './RecordUncheckedUpdateWithoutCategoryInputSchema';

export const RecordUpdateWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.RecordUpdateWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutCategoryInputSchema) ]),
}).strict();

export default RecordUpdateWithWhereUniqueWithoutCategoryInputSchema;
