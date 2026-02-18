import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumInscriptionStatusFilterSchema } from './NestedEnumInscriptionStatusFilterSchema';

export const NestedEnumInscriptionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumInscriptionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => InscriptionStatusSchema).optional(),
  in: z.lazy(() => InscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => InscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => InscriptionStatusSchema),z.lazy(() => NestedEnumInscriptionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumInscriptionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumInscriptionStatusFilterSchema).optional()
}).strict();

export default NestedEnumInscriptionStatusWithAggregatesFilterSchema;
