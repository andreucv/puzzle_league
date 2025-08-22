import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateManyCreatorInputSchema } from './CompetitionCreateManyCreatorInputSchema';

export const CompetitionCreateManyCreatorInputEnvelopeSchema: z.ZodType<Prisma.CompetitionCreateManyCreatorInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CompetitionCreateManyCreatorInputSchema),z.lazy(() => CompetitionCreateManyCreatorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default CompetitionCreateManyCreatorInputEnvelopeSchema;
