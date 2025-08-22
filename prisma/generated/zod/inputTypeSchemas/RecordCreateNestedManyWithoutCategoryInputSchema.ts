import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutCategoryInputSchema } from './RecordCreateWithoutCategoryInputSchema';
import { RecordUncheckedCreateWithoutCategoryInputSchema } from './RecordUncheckedCreateWithoutCategoryInputSchema';
import { RecordCreateOrConnectWithoutCategoryInputSchema } from './RecordCreateOrConnectWithoutCategoryInputSchema';
import { RecordCreateManyCategoryInputEnvelopeSchema } from './RecordCreateManyCategoryInputEnvelopeSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';

export const RecordCreateNestedManyWithoutCategoryInputSchema: z.ZodType<Prisma.RecordCreateNestedManyWithoutCategoryInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutCategoryInputSchema),z.lazy(() => RecordCreateWithoutCategoryInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => RecordCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecordCreateManyCategoryInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RecordCreateNestedManyWithoutCategoryInputSchema;
