import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionCreateWithoutCreatorInputSchema } from './CompetitionCreateWithoutCreatorInputSchema';
import { CompetitionUncheckedCreateWithoutCreatorInputSchema } from './CompetitionUncheckedCreateWithoutCreatorInputSchema';

export const CompetitionCreateOrConnectWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionCreateOrConnectWithoutCreatorInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema) ]),
}).strict();

export default CompetitionCreateOrConnectWithoutCreatorInputSchema;
