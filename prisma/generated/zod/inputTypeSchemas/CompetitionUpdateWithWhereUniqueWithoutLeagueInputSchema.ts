import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithoutLeagueInputSchema } from './CompetitionUpdateWithoutLeagueInputSchema';
import { CompetitionUncheckedUpdateWithoutLeagueInputSchema } from './CompetitionUncheckedUpdateWithoutLeagueInputSchema';

export const CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema: z.ZodType<Prisma.CompetitionUpdateWithWhereUniqueWithoutLeagueInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CompetitionUpdateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutLeagueInputSchema) ]),
}).strict();

export default CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema;
