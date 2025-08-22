import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithoutUserInputSchema } from './LeaguePointsUpdateWithoutUserInputSchema';
import { LeaguePointsUncheckedUpdateWithoutUserInputSchema } from './LeaguePointsUncheckedUpdateWithoutUserInputSchema';
import { LeaguePointsCreateWithoutUserInputSchema } from './LeaguePointsCreateWithoutUserInputSchema';
import { LeaguePointsUncheckedCreateWithoutUserInputSchema } from './LeaguePointsUncheckedCreateWithoutUserInputSchema';

export const LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => LeaguePointsUpdateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema;
