import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithoutLeagueInputSchema } from './LeaguePointsUpdateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedUpdateWithoutLeagueInputSchema } from './LeaguePointsUncheckedUpdateWithoutLeagueInputSchema';
import { LeaguePointsCreateWithoutLeagueInputSchema } from './LeaguePointsCreateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedCreateWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateWithoutLeagueInputSchema';

export const LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsUpsertWithWhereUniqueWithoutLeagueInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => LeaguePointsUpdateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateWithoutLeagueInputSchema) ]),
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema) ]),
}).strict();

export default LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema;
