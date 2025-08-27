import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithoutLeagueInputSchema } from './LeaguePointsUpdateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedUpdateWithoutLeagueInputSchema } from './LeaguePointsUncheckedUpdateWithoutLeagueInputSchema';

export const LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsUpdateWithWhereUniqueWithoutLeagueInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => LeaguePointsUpdateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateWithoutLeagueInputSchema) ]),
}).strict();

export default LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema;
