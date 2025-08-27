import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateWithoutLeagueInputSchema } from './LeaguePointsCreateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedCreateWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateWithoutLeagueInputSchema';
import { LeaguePointsCreateOrConnectWithoutLeagueInputSchema } from './LeaguePointsCreateOrConnectWithoutLeagueInputSchema';
import { LeaguePointsCreateManyLeagueInputEnvelopeSchema } from './LeaguePointsCreateManyLeagueInputEnvelopeSchema';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';

export const LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsUncheckedCreateNestedManyWithoutLeagueInput> = z.object({
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema).array(),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LeaguePointsCreateOrConnectWithoutLeagueInputSchema),z.lazy(() => LeaguePointsCreateOrConnectWithoutLeagueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LeaguePointsCreateManyLeagueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema;
