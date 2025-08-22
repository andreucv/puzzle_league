import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsScalarWhereInputSchema } from './LeaguePointsScalarWhereInputSchema';
import { LeaguePointsUpdateManyMutationInputSchema } from './LeaguePointsUpdateManyMutationInputSchema';
import { LeaguePointsUncheckedUpdateManyWithoutLeagueInputSchema } from './LeaguePointsUncheckedUpdateManyWithoutLeagueInputSchema';

export const LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsUpdateManyWithWhereWithoutLeagueInput> = z.object({
  where: z.lazy(() => LeaguePointsScalarWhereInputSchema),
  data: z.union([ z.lazy(() => LeaguePointsUpdateManyMutationInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateManyWithoutLeagueInputSchema) ]),
}).strict();

export default LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema;
