import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithoutCreatorInputSchema } from './CompetitionUpdateWithoutCreatorInputSchema';
import { CompetitionUncheckedUpdateWithoutCreatorInputSchema } from './CompetitionUncheckedUpdateWithoutCreatorInputSchema';

export const CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionUpdateWithWhereUniqueWithoutCreatorInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CompetitionUpdateWithoutCreatorInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutCreatorInputSchema) ]),
}).strict();

export default CompetitionUpdateWithWhereUniqueWithoutCreatorInputSchema;
