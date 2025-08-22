import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordCreateManyCreatorInputSchema } from './RecordCreateManyCreatorInputSchema';

export const RecordCreateManyCreatorInputEnvelopeSchema: z.ZodType<Prisma.RecordCreateManyCreatorInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RecordCreateManyCreatorInputSchema),z.lazy(() => RecordCreateManyCreatorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RecordCreateManyCreatorInputEnvelopeSchema;
