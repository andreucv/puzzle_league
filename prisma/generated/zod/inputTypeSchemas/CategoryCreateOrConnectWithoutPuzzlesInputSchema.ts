import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutPuzzlesInputSchema } from './CategoryCreateWithoutPuzzlesInputSchema';
import { CategoryUncheckedCreateWithoutPuzzlesInputSchema } from './CategoryUncheckedCreateWithoutPuzzlesInputSchema';

export const CategoryCreateOrConnectWithoutPuzzlesInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutPuzzlesInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutPuzzlesInputSchema;
