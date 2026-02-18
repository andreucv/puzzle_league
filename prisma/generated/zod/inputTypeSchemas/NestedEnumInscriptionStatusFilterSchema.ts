import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';

export const NestedEnumInscriptionStatusFilterSchema: z.ZodType<Prisma.NestedEnumInscriptionStatusFilter> = z.object({
  equals: z.lazy(() => InscriptionStatusSchema).optional(),
  in: z.lazy(() => InscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => InscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => InscriptionStatusSchema),z.lazy(() => NestedEnumInscriptionStatusFilterSchema) ]).optional(),
}).strict();

export default NestedEnumInscriptionStatusFilterSchema;
