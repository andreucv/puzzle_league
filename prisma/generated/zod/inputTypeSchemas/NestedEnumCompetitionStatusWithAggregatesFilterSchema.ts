import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumCompetitionStatusFilterSchema } from './NestedEnumCompetitionStatusFilterSchema';

export const NestedEnumCompetitionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCompetitionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CompetitionStatusSchema).optional(),
  in: z.lazy(() => CompetitionStatusSchema).array().optional(),
  notIn: z.lazy(() => CompetitionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => CompetitionStatusSchema),z.lazy(() => NestedEnumCompetitionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCompetitionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCompetitionStatusFilterSchema).optional()
}).strict();

export default NestedEnumCompetitionStatusWithAggregatesFilterSchema;
