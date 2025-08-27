import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestStatusSchema } from './RequestStatusSchema';

export const NestedEnumRequestStatusFilterSchema: z.ZodType<Prisma.NestedEnumRequestStatusFilter> = z.object({
  equals: z.lazy(() => RequestStatusSchema).optional(),
  in: z.lazy(() => RequestStatusSchema).array().optional(),
  notIn: z.lazy(() => RequestStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => RequestStatusSchema),z.lazy(() => NestedEnumRequestStatusFilterSchema) ]).optional(),
}).strict();

export default NestedEnumRequestStatusFilterSchema;
