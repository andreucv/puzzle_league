import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsCreateWithoutLeagueInputSchema } from './LeaguePointsCreateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedCreateWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateWithoutLeagueInputSchema';

export const LeaguePointsCreateOrConnectWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsCreateOrConnectWithoutLeagueInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema) ]),
}).strict();

export default LeaguePointsCreateOrConnectWithoutLeagueInputSchema;
