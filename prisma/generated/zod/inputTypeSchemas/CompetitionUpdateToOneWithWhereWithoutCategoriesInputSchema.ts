import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { CompetitionUpdateWithoutCategoriesInputSchema } from './CompetitionUpdateWithoutCategoriesInputSchema';
import { CompetitionUncheckedUpdateWithoutCategoriesInputSchema } from './CompetitionUncheckedUpdateWithoutCategoriesInputSchema';

export const CompetitionUpdateToOneWithWhereWithoutCategoriesInputSchema: z.ZodType<Prisma.CompetitionUpdateToOneWithWhereWithoutCategoriesInput> = z.object({
  where: z.lazy(() => CompetitionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CompetitionUpdateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutCategoriesInputSchema) ]),
}).strict();

export default CompetitionUpdateToOneWithWhereWithoutCategoriesInputSchema;
