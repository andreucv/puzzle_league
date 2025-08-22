import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutRecordsInputSchema } from './CategoryCreateWithoutRecordsInputSchema';
import { CategoryUncheckedCreateWithoutRecordsInputSchema } from './CategoryUncheckedCreateWithoutRecordsInputSchema';

export const CategoryCreateOrConnectWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutRecordsInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutRecordsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutRecordsInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutRecordsInputSchema;
