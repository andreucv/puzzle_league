import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutCompetitionInputSchema } from './CategoryCreateWithoutCompetitionInputSchema';
import { CategoryUncheckedCreateWithoutCompetitionInputSchema } from './CategoryUncheckedCreateWithoutCompetitionInputSchema';

export const CategoryCreateOrConnectWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutCompetitionInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutCompetitionInputSchema;
