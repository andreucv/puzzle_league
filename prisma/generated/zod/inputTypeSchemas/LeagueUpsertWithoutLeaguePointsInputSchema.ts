import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueUpdateWithoutLeaguePointsInputSchema } from './LeagueUpdateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedUpdateWithoutLeaguePointsInputSchema } from './LeagueUncheckedUpdateWithoutLeaguePointsInputSchema';
import { LeagueCreateWithoutLeaguePointsInputSchema } from './LeagueCreateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedCreateWithoutLeaguePointsInputSchema } from './LeagueUncheckedCreateWithoutLeaguePointsInputSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';

export const LeagueUpsertWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueUpsertWithoutLeaguePointsInput> = z.object({
  update: z.union([ z.lazy(() => LeagueUpdateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutLeaguePointsInputSchema) ]),
  create: z.union([ z.lazy(() => LeagueCreateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutLeaguePointsInputSchema) ]),
  where: z.lazy(() => LeagueWhereInputSchema).optional()
}).strict();

export default LeagueUpsertWithoutLeaguePointsInputSchema;
