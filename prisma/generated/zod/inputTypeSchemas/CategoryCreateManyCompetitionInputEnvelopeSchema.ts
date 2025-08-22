import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateManyCompetitionInputSchema } from './CategoryCreateManyCompetitionInputSchema';

export const CategoryCreateManyCompetitionInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyCompetitionInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CategoryCreateManyCompetitionInputSchema),z.lazy(() => CategoryCreateManyCompetitionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default CategoryCreateManyCompetitionInputEnvelopeSchema;
