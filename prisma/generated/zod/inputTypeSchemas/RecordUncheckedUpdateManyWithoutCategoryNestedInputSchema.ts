import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutCategoryInputSchema } from './RecordCreateWithoutCategoryInputSchema';
import { RecordUncheckedCreateWithoutCategoryInputSchema } from './RecordUncheckedCreateWithoutCategoryInputSchema';
import { RecordCreateOrConnectWithoutCategoryInputSchema } from './RecordCreateOrConnectWithoutCategoryInputSchema';
import { RecordUpsertWithWhereUniqueWithoutCategoryInputSchema } from './RecordUpsertWithWhereUniqueWithoutCategoryInputSchema';
import { RecordCreateManyCategoryInputEnvelopeSchema } from './RecordCreateManyCategoryInputEnvelopeSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithWhereUniqueWithoutCategoryInputSchema } from './RecordUpdateWithWhereUniqueWithoutCategoryInputSchema';
import { RecordUpdateManyWithWhereWithoutCategoryInputSchema } from './RecordUpdateManyWithWhereWithoutCategoryInputSchema';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';

export const RecordUncheckedUpdateManyWithoutCategoryNestedInputSchema: z.ZodType<Prisma.RecordUncheckedUpdateManyWithoutCategoryNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutCategoryInputSchema),z.lazy(() => RecordCreateWithoutCategoryInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => RecordCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RecordUpsertWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => RecordUpsertWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecordCreateManyCategoryInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RecordUpdateWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => RecordUpdateWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RecordUpdateManyWithWhereWithoutCategoryInputSchema),z.lazy(() => RecordUpdateManyWithWhereWithoutCategoryInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RecordScalarWhereInputSchema),z.lazy(() => RecordScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RecordUncheckedUpdateManyWithoutCategoryNestedInputSchema;
