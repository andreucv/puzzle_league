import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { NestedEnumCategoryTypeFilterSchema } from './NestedEnumCategoryTypeFilterSchema';

export const EnumCategoryTypeFilterSchema: z.ZodType<Prisma.EnumCategoryTypeFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeFilterSchema) ]).optional(),
}).strict();

export default EnumCategoryTypeFilterSchema;
