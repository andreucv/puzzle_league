import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionCreateWithoutCategoriesInputSchema } from './CompetitionCreateWithoutCategoriesInputSchema';
import { CompetitionUncheckedCreateWithoutCategoriesInputSchema } from './CompetitionUncheckedCreateWithoutCategoriesInputSchema';

export const CompetitionCreateOrConnectWithoutCategoriesInputSchema: z.ZodType<Prisma.CompetitionCreateOrConnectWithoutCategoriesInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCategoriesInputSchema) ]),
}).strict();

export default CompetitionCreateOrConnectWithoutCategoriesInputSchema;
