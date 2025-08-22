import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateManyCategoryInputSchema } from './RecordCreateManyCategoryInputSchema';

export const RecordCreateManyCategoryInputEnvelopeSchema: z.ZodType<Prisma.RecordCreateManyCategoryInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RecordCreateManyCategoryInputSchema),z.lazy(() => RecordCreateManyCategoryInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RecordCreateManyCategoryInputEnvelopeSchema;
