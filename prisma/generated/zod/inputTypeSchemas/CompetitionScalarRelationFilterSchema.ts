import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionScalarRelationFilterSchema: z.ZodType<Prisma.CompetitionScalarRelationFilter> = z.object({
  is: z.lazy(() => CompetitionWhereInputSchema).optional(),
  isNot: z.lazy(() => CompetitionWhereInputSchema).optional()
}).strict();

export default CompetitionScalarRelationFilterSchema;
