import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateWithoutLeaguePointsInputSchema } from './LeagueCreateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedCreateWithoutLeaguePointsInputSchema } from './LeagueUncheckedCreateWithoutLeaguePointsInputSchema';
import { LeagueCreateOrConnectWithoutLeaguePointsInputSchema } from './LeagueCreateOrConnectWithoutLeaguePointsInputSchema';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';

export const LeagueCreateNestedOneWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueCreateNestedOneWithoutLeaguePointsInput> = z.object({
  create: z.union([ z.lazy(() => LeagueCreateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutLeaguePointsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LeagueCreateOrConnectWithoutLeaguePointsInputSchema).optional(),
  connect: z.lazy(() => LeagueWhereUniqueInputSchema).optional()
}).strict();

export default LeagueCreateNestedOneWithoutLeaguePointsInputSchema;
