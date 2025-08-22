import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutRecordsInputSchema } from './CategoryCreateWithoutRecordsInputSchema';
import { CategoryUncheckedCreateWithoutRecordsInputSchema } from './CategoryUncheckedCreateWithoutRecordsInputSchema';
import { CategoryCreateOrConnectWithoutRecordsInputSchema } from './CategoryCreateOrConnectWithoutRecordsInputSchema';
import { CategoryUpsertWithoutRecordsInputSchema } from './CategoryUpsertWithoutRecordsInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateToOneWithWhereWithoutRecordsInputSchema } from './CategoryUpdateToOneWithWhereWithoutRecordsInputSchema';
import { CategoryUpdateWithoutRecordsInputSchema } from './CategoryUpdateWithoutRecordsInputSchema';
import { CategoryUncheckedUpdateWithoutRecordsInputSchema } from './CategoryUncheckedUpdateWithoutRecordsInputSchema';

export const CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema: z.ZodType<Prisma.CategoryUpdateOneRequiredWithoutRecordsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutRecordsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutRecordsInputSchema).optional(),
  upsert: z.lazy(() => CategoryUpsertWithoutRecordsInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateToOneWithWhereWithoutRecordsInputSchema),z.lazy(() => CategoryUpdateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutRecordsInputSchema) ]).optional(),
}).strict();

export default CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema;
