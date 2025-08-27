import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';
import { CategoryUpdateManyMutationInputSchema } from './CategoryUpdateManyMutationInputSchema';
import { CategoryUncheckedUpdateManyWithoutCompetitionInputSchema } from './CategoryUncheckedUpdateManyWithoutCompetitionInputSchema';

export const CategoryUpdateManyWithWhereWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutCompetitionInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutCompetitionInputSchema) ]),
}).strict();

export default CategoryUpdateManyWithWhereWithoutCompetitionInputSchema;
