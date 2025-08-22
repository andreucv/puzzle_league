import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateWithoutCreatorInputSchema } from './RecordCreateWithoutCreatorInputSchema';
import { RecordUncheckedCreateWithoutCreatorInputSchema } from './RecordUncheckedCreateWithoutCreatorInputSchema';
import { RecordCreateOrConnectWithoutCreatorInputSchema } from './RecordCreateOrConnectWithoutCreatorInputSchema';
import { RecordCreateManyCreatorInputEnvelopeSchema } from './RecordCreateManyCreatorInputEnvelopeSchema';
import { RecordWhereUniqueInputSchema } from './RecordWhereUniqueInputSchema';

export const RecordCreateNestedManyWithoutCreatorInputSchema: z.ZodType<Prisma.RecordCreateNestedManyWithoutCreatorInput> = z.object({
  create: z.union([ z.lazy(() => RecordCreateWithoutCreatorInputSchema),z.lazy(() => RecordCreateWithoutCreatorInputSchema).array(),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema),z.lazy(() => RecordUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecordCreateOrConnectWithoutCreatorInputSchema),z.lazy(() => RecordCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecordCreateManyCreatorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RecordWhereUniqueInputSchema),z.lazy(() => RecordWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RecordCreateNestedManyWithoutCreatorInputSchema;
