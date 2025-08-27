import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryUpdateWithoutRecordsInputSchema } from './CategoryUpdateWithoutRecordsInputSchema';
import { CategoryUncheckedUpdateWithoutRecordsInputSchema } from './CategoryUncheckedUpdateWithoutRecordsInputSchema';
import { CategoryCreateWithoutRecordsInputSchema } from './CategoryCreateWithoutRecordsInputSchema';
import { CategoryUncheckedCreateWithoutRecordsInputSchema } from './CategoryUncheckedCreateWithoutRecordsInputSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';

export const CategoryUpsertWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryUpsertWithoutRecordsInput> = z.object({
  update: z.union([ z.lazy(() => CategoryUpdateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutRecordsInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutRecordsInputSchema) ]),
  where: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export default CategoryUpsertWithoutRecordsInputSchema;
