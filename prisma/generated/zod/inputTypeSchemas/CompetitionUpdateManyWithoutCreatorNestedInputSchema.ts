import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutCreatorInputSchema } from './CompetitionCreateWithoutCreatorInputSchema';
import { CompetitionUncheckedCreateWithoutCreatorInputSchema } from './CompetitionUncheckedCreateWithoutCreatorInputSchema';
import { CompetitionCreateOrConnectWithoutCreatorInputSchema } from './CompetitionCreateOrConnectWithoutCreatorInputSchema';
import { CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema } from './CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema';
import { CompetitionCreateManyCreatorInputEnvelopeSchema } from './CompetitionCreateManyCreatorInputEnvelopeSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema } from './CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema';
import { CompetitionUpdateManyWithWhereWithoutCreatorInputSchema } from './CompetitionUpdateManyWithWhereWithoutCreatorInputSchema';
import { CompetitionScalarWhereInputSchema } from './CompetitionScalarWhereInputSchema';

export const CompetitionUpdateManyWithoutCreatorNestedInputSchema: z.ZodType<Prisma.CompetitionUpdateManyWithoutCreatorNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionCreateWithoutCreatorInputSchema).array(),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompetitionCreateOrConnectWithoutCreatorInputSchema),z.lazy(() => CompetitionCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema),z.lazy(() => CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompetitionCreateManyCreatorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema),z.lazy(() => CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CompetitionUpdateManyWithWhereWithoutCreatorInputSchema),z.lazy(() => CompetitionUpdateManyWithWhereWithoutCreatorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CompetitionScalarWhereInputSchema),z.lazy(() => CompetitionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CompetitionUpdateManyWithoutCreatorNestedInputSchema;
