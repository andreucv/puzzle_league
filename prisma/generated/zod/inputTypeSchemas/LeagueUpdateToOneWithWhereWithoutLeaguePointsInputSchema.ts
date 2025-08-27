import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { LeagueUpdateWithoutLeaguePointsInputSchema } from './LeagueUpdateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedUpdateWithoutLeaguePointsInputSchema } from './LeagueUncheckedUpdateWithoutLeaguePointsInputSchema';

export const LeagueUpdateToOneWithWhereWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueUpdateToOneWithWhereWithoutLeaguePointsInput> = z.object({
  where: z.lazy(() => LeagueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => LeagueUpdateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutLeaguePointsInputSchema) ]),
}).strict();

export default LeagueUpdateToOneWithWhereWithoutLeaguePointsInputSchema;
