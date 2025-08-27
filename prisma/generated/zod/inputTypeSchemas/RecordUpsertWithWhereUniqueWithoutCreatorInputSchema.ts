import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutCreatorInputSchema } from './RecordUpdateWithoutCreatorInputSchema';
import { RecordUncheckedUpdateWithoutCreatorInputSchema } from './RecordUncheckedUpdateWithoutCreatorInputSchema';
import { RecordCreateWithoutCreatorInputSchema } from './RecordCreateWithoutCreatorInputSchema';
import { RecordUncheckedCreateWithoutCreatorInputSchema } from './RecordUncheckedCreateWithoutCreatorInputSchema';

export const RecordUpsertWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.RecordUpsertWithWhereUniqueWithoutCreatorInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RecordUpdateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutCreatorInputSchema) ]),
  create: z.union([ z.lazy(() => RecordCreateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema) ]),
}).strict();

export default RecordUpsertWithWhereUniqueWithoutCreatorInputSchema;
