import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutCategoryInputSchema } from './RecordUpdateWithoutCategoryInputSchema';
import { RecordUncheckedUpdateWithoutCategoryInputSchema } from './RecordUncheckedUpdateWithoutCategoryInputSchema';
import { RecordCreateWithoutCategoryInputSchema } from './RecordCreateWithoutCategoryInputSchema';
import { RecordUncheckedCreateWithoutCategoryInputSchema } from './RecordUncheckedCreateWithoutCategoryInputSchema';

export const RecordUpsertWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.RecordUpsertWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RecordUpdateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutCategoryInputSchema) ]),
  create: z.union([ z.lazy(() => RecordCreateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export default RecordUpsertWithWhereUniqueWithoutCategoryInputSchema;
