import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutRecordsInputSchema } from './CategoryCreateWithoutRecordsInputSchema';
import { CategoryUncheckedCreateWithoutRecordsInputSchema } from './CategoryUncheckedCreateWithoutRecordsInputSchema';
import { CategoryCreateOrConnectWithoutRecordsInputSchema } from './CategoryCreateOrConnectWithoutRecordsInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedOneWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryCreateNestedOneWithoutRecordsInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutRecordsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutRecordsInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional()
}).strict();

export default CategoryCreateNestedOneWithoutRecordsInputSchema;
