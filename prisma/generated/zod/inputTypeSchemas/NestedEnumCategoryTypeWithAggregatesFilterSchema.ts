import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumCategoryTypeFilterSchema } from './NestedEnumCategoryTypeFilterSchema';

export const NestedEnumCategoryTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCategoryTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional()
}).strict();

export default NestedEnumCategoryTypeWithAggregatesFilterSchema;
