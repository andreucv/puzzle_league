import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutCreatorInputSchema } from './CompetitionCreateWithoutCreatorInputSchema';
import { CompetitionUncheckedCreateWithoutCreatorInputSchema } from './CompetitionUncheckedCreateWithoutCreatorInputSchema';
import { CompetitionCreateOrConnectWithoutCreatorInputSchema } from './CompetitionCreateOrConnectWithoutCreatorInputSchema';
import { CompetitionCreateManyCreatorInputEnvelopeSchema } from './CompetitionCreateManyCreatorInputEnvelopeSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';

export const CompetitionCreateNestedManyWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionCreateNestedManyWithoutCreatorInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionCreateWithoutCreatorInputSchema).array(),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompetitionCreateOrConnectWithoutCreatorInputSchema),z.lazy(() => CompetitionCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompetitionCreateManyCreatorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CompetitionCreateNestedManyWithoutCreatorInputSchema;
