import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordCreateWithoutCreatorInputSchema } from './RecordCreateWithoutCreatorInputSchema';
import { RecordUncheckedCreateWithoutCreatorInputSchema } from './RecordUncheckedCreateWithoutCreatorInputSchema';

export const RecordCreateOrConnectWithoutCreatorInputSchema: z.ZodType<Prisma.RecordCreateOrConnectWithoutCreatorInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RecordCreateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema) ]),
}).strict();

export default RecordCreateOrConnectWithoutCreatorInputSchema;
