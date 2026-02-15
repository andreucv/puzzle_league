import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutPuzzlesInputSchema } from './CategoryUpdateWithoutPuzzlesInputSchema';
import { CategoryUncheckedUpdateWithoutPuzzlesInputSchema } from './CategoryUncheckedUpdateWithoutPuzzlesInputSchema';
import { CategoryCreateWithoutPuzzlesInputSchema } from './CategoryCreateWithoutPuzzlesInputSchema';
import { CategoryUncheckedCreateWithoutPuzzlesInputSchema } from './CategoryUncheckedCreateWithoutPuzzlesInputSchema';

export const CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutPuzzlesInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutPuzzlesInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema) ]),
}).strict();

export default CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema;
