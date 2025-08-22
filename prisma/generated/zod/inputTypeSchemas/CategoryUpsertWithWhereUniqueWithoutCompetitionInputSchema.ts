import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutCompetitionInputSchema } from './CategoryUpdateWithoutCompetitionInputSchema';
import { CategoryUncheckedUpdateWithoutCompetitionInputSchema } from './CategoryUncheckedUpdateWithoutCompetitionInputSchema';
import { CategoryCreateWithoutCompetitionInputSchema } from './CategoryCreateWithoutCompetitionInputSchema';
import { CategoryUncheckedCreateWithoutCompetitionInputSchema } from './CategoryUncheckedCreateWithoutCompetitionInputSchema';

export const CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutCompetitionInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema;
