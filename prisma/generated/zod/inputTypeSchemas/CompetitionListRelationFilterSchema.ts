import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionListRelationFilterSchema: z.ZodType<Prisma.CompetitionListRelationFilter> = z.object({
  every: z.lazy(() => CompetitionWhereInputSchema).optional(),
  some: z.lazy(() => CompetitionWhereInputSchema).optional(),
  none: z.lazy(() => CompetitionWhereInputSchema).optional()
}).strict();

export default CompetitionListRelationFilterSchema;
