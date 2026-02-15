import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutPuzzlesInputSchema } from './CategoryUpdateWithoutPuzzlesInputSchema';
import { CategoryUncheckedUpdateWithoutPuzzlesInputSchema } from './CategoryUncheckedUpdateWithoutPuzzlesInputSchema';

export const CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutPuzzlesInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutPuzzlesInputSchema) ]),
}).strict();

export default CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema;
