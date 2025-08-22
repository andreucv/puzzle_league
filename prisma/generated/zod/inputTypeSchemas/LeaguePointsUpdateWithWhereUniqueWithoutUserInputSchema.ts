import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithoutUserInputSchema } from './LeaguePointsUpdateWithoutUserInputSchema';
import { LeaguePointsUncheckedUpdateWithoutUserInputSchema } from './LeaguePointsUncheckedUpdateWithoutUserInputSchema';

export const LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => LeaguePointsUpdateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema;
