import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutCompetitionInputSchema } from './CategoryUpdateWithoutCompetitionInputSchema';
import { CategoryUncheckedUpdateWithoutCompetitionInputSchema } from './CategoryUncheckedUpdateWithoutCompetitionInputSchema';

export const CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutCompetitionInputSchema) ]),
}).strict();

export default CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema;
