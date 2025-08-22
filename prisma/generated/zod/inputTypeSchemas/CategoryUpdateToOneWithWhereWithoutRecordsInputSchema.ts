import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { CategoryUpdateWithoutRecordsInputSchema } from './CategoryUpdateWithoutRecordsInputSchema';
import { CategoryUncheckedUpdateWithoutRecordsInputSchema } from './CategoryUncheckedUpdateWithoutRecordsInputSchema';

export const CategoryUpdateToOneWithWhereWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryUpdateToOneWithWhereWithoutRecordsInput> = z.object({
  where: z.lazy(() => CategoryWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutRecordsInputSchema) ]),
}).strict();

export default CategoryUpdateToOneWithWhereWithoutRecordsInputSchema;
