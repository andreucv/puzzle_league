import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordCreateWithoutCategoryInputSchema } from './RecordCreateWithoutCategoryInputSchema';
import { RecordUncheckedCreateWithoutCategoryInputSchema } from './RecordUncheckedCreateWithoutCategoryInputSchema';

export const RecordCreateOrConnectWithoutCategoryInputSchema: z.ZodType<Prisma.RecordCreateOrConnectWithoutCategoryInput> = z.object({
  where: z.lazy(() => RecordWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RecordCreateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export default RecordCreateOrConnectWithoutCategoryInputSchema;
