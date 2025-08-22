import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithoutCreatorInputSchema } from './CompetitionUpdateWithoutCreatorInputSchema';
import { CompetitionUncheckedUpdateWithoutCreatorInputSchema } from './CompetitionUncheckedUpdateWithoutCreatorInputSchema';
import { CompetitionCreateWithoutCreatorInputSchema } from './CompetitionCreateWithoutCreatorInputSchema';
import { CompetitionUncheckedCreateWithoutCreatorInputSchema } from './CompetitionUncheckedCreateWithoutCreatorInputSchema';

export const CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionUpsertWithWhereUniqueWithoutCreatorInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CompetitionUpdateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutCreatorInputSchema) ]),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCreatorInputSchema) ]),
}).strict();

export default CompetitionUpsertWithWhereUniqueWithoutCreatorInputSchema;
