import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';

export const NestedEnumCompetitionStatusFilterSchema: z.ZodType<Prisma.NestedEnumCompetitionStatusFilter> = z.object({
  equals: z.lazy(() => CompetitionStatusSchema).optional(),
  in: z.lazy(() => CompetitionStatusSchema).array().optional(),
  notIn: z.lazy(() => CompetitionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => CompetitionStatusSchema),z.lazy(() => NestedEnumCompetitionStatusFilterSchema) ]).optional(),
}).strict();

export default NestedEnumCompetitionStatusFilterSchema;
