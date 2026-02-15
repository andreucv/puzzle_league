import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';
import { CategoryUpdateManyMutationInputSchema } from './CategoryUpdateManyMutationInputSchema';
import { CategoryUncheckedUpdateManyWithoutPuzzlesInputSchema } from './CategoryUncheckedUpdateManyWithoutPuzzlesInputSchema';

export const CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutPuzzlesInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutPuzzlesInputSchema) ]),
}).strict();

export default CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema;
