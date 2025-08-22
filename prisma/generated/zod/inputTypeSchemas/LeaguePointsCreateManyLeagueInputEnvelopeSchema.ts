import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateManyLeagueInputSchema } from './LeaguePointsCreateManyLeagueInputSchema';

export const LeaguePointsCreateManyLeagueInputEnvelopeSchema: z.ZodType<Prisma.LeaguePointsCreateManyLeagueInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => LeaguePointsCreateManyLeagueInputSchema),z.lazy(() => LeaguePointsCreateManyLeagueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default LeaguePointsCreateManyLeagueInputEnvelopeSchema;
