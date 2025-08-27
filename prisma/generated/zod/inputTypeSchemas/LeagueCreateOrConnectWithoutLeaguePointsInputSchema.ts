import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';
import { LeagueCreateWithoutLeaguePointsInputSchema } from './LeagueCreateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedCreateWithoutLeaguePointsInputSchema } from './LeagueUncheckedCreateWithoutLeaguePointsInputSchema';

export const LeagueCreateOrConnectWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueCreateOrConnectWithoutLeaguePointsInput> = z.object({
  where: z.lazy(() => LeagueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LeagueCreateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutLeaguePointsInputSchema) ]),
}).strict();

export default LeagueCreateOrConnectWithoutLeaguePointsInputSchema;
