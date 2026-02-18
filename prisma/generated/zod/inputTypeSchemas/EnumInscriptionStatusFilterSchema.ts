import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { NestedEnumInscriptionStatusFilterSchema } from './NestedEnumInscriptionStatusFilterSchema';

export const EnumInscriptionStatusFilterSchema: z.ZodType<Prisma.EnumInscriptionStatusFilter> = z.object({
  equals: z.lazy(() => InscriptionStatusSchema).optional(),
  in: z.lazy(() => InscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => InscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => InscriptionStatusSchema),z.lazy(() => NestedEnumInscriptionStatusFilterSchema) ]).optional(),
}).strict();

export default EnumInscriptionStatusFilterSchema;
