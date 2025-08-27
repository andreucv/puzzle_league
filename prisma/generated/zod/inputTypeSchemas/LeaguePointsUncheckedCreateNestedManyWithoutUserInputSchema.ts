import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateWithoutUserInputSchema } from './LeaguePointsCreateWithoutUserInputSchema';
import { LeaguePointsUncheckedCreateWithoutUserInputSchema } from './LeaguePointsUncheckedCreateWithoutUserInputSchema';
import { LeaguePointsCreateOrConnectWithoutUserInputSchema } from './LeaguePointsCreateOrConnectWithoutUserInputSchema';
import { LeaguePointsCreateManyUserInputEnvelopeSchema } from './LeaguePointsCreateManyUserInputEnvelopeSchema';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';

export const LeaguePointsUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsCreateWithoutUserInputSchema).array(),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LeaguePointsCreateOrConnectWithoutUserInputSchema),z.lazy(() => LeaguePointsCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LeaguePointsCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default LeaguePointsUncheckedCreateNestedManyWithoutUserInputSchema;
