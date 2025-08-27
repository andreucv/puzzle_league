import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateManyLeagueInputSchema } from './CompetitionCreateManyLeagueInputSchema';

export const CompetitionCreateManyLeagueInputEnvelopeSchema: z.ZodType<Prisma.CompetitionCreateManyLeagueInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CompetitionCreateManyLeagueInputSchema),z.lazy(() => CompetitionCreateManyLeagueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default CompetitionCreateManyLeagueInputEnvelopeSchema;
