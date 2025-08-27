import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsCreateWithoutUserInputSchema } from './LeaguePointsCreateWithoutUserInputSchema';
import { LeaguePointsUncheckedCreateWithoutUserInputSchema } from './LeaguePointsUncheckedCreateWithoutUserInputSchema';

export const LeaguePointsCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => LeaguePointsWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default LeaguePointsCreateOrConnectWithoutUserInputSchema;
