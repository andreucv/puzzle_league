import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutCreatorInputSchema } from './RecordCreateWithoutCreatorInputSchema';
import { RecordUncheckedCreateWithoutCreatorInputSchema } from './RecordUncheckedCreateWithoutCreatorInputSchema';
import { RecordCreateOrConnectWithoutCreatorInputSchema } from './RecordCreateOrConnectWithoutCreatorInputSchema';
import { RecordUpsertWithWhereUniqueWithoutCreatorInputSchema } from './RecordUpsertWithWhereUniqueWithoutCreatorInputSchema';
import { RecordCreateManyCreatorInputEnvelopeSchema } from './RecordCreateManyCreatorInputEnvelopeSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';
import { RecordUpdateWithWhereUniqueWithoutCreatorInputSchema } from './RecordUpdateWithWhereUniqueWithoutCreatorInputSchema';
import { RecordUpdateManyWithWhereWithoutCreatorInputSchema } from './RecordUpdateManyWithWhereWithoutCreatorInputSchema';
import { RecordScalarWhereInputSchema } from './RecordScalarWhereInputSchema';

export const RecordUpdateManyWithoutCreatorNestedInputSchema: z.ZodType<Prisma.RecordUpdateManyWithoutCreatorNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutCreatorInputSchema),z.lazy(() => RecordCreateWithoutCreatorInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutCreatorInputSchema),z.lazy(() => RecordCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RecordUpsertWithWhereUniqueWithoutCreatorInputSchema),z.lazy(() => RecordUpsertWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecordCreateManyCreatorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RecordUpdateWithWhereUniqueWithoutCreatorInputSchema),z.lazy(() => RecordUpdateWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RecordUpdateManyWithWhereWithoutCreatorInputSchema),z.lazy(() => RecordUpdateManyWithWhereWithoutCreatorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RecordScalarWhereInputSchema),z.lazy(() => RecordScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RecordUpdateManyWithoutCreatorNestedInputSchema;
