import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateManyUserInputSchema } from './LeaguePointsCreateManyUserInputSchema';

export const LeaguePointsCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.LeaguePointsCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => LeaguePointsCreateManyUserInputSchema),z.lazy(() => LeaguePointsCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default LeaguePointsCreateManyUserInputEnvelopeSchema;
