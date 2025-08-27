import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithoutCreatorInputSchema } from './RecordUpdateWithoutCreatorInputSchema';
import { RecordUncheckedUpdateWithoutCreatorInputSchema } from './RecordUncheckedUpdateWithoutCreatorInputSchema';

export const RecordUpdateWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.RecordUpdateWithWhereUniqueWithoutCreatorInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RecordUpdateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedUpdateWithoutCreatorInputSchema) ]),
}).strict();

export default RecordUpdateWithWhereUniqueWithoutCreatorInputSchema;
