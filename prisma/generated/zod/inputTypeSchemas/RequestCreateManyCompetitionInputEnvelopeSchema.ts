import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateManyCompetitionInputSchema } from './RequestCreateManyCompetitionInputSchema';

export const RequestCreateManyCompetitionInputEnvelopeSchema: z.ZodType<Prisma.RequestCreateManyCompetitionInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RequestCreateManyCompetitionInputSchema),z.lazy(() => RequestCreateManyCompetitionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RequestCreateManyCompetitionInputEnvelopeSchema;
