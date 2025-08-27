import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionUpdateWithoutCategoriesInputSchema } from './CompetitionUpdateWithoutCategoriesInputSchema';
import { CompetitionUncheckedUpdateWithoutCategoriesInputSchema } from './CompetitionUncheckedUpdateWithoutCategoriesInputSchema';
import { CompetitionCreateWithoutCategoriesInputSchema } from './CompetitionCreateWithoutCategoriesInputSchema';
import { CompetitionUncheckedCreateWithoutCategoriesInputSchema } from './CompetitionUncheckedCreateWithoutCategoriesInputSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionUpsertWithoutCategoriesInputSchema: z.ZodType<Prisma.CompetitionUpsertWithoutCategoriesInput> = z.object({
  update: z.union([ z.lazy(() => CompetitionUpdateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutCategoriesInputSchema) ]),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCategoriesInputSchema) ]),
  where: z.lazy(() => CompetitionWhereInputSchema).optional()
}).strict();

export default CompetitionUpsertWithoutCategoriesInputSchema;
