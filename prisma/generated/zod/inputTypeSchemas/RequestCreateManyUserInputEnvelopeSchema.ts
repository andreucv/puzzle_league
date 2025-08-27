import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateManyUserInputSchema } from './RequestCreateManyUserInputSchema';

export const RequestCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.RequestCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RequestCreateManyUserInputSchema),z.lazy(() => RequestCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RequestCreateManyUserInputEnvelopeSchema;
