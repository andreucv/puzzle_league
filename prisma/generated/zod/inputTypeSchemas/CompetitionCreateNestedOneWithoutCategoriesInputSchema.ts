import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutCategoriesInputSchema } from './CompetitionCreateWithoutCategoriesInputSchema';
import { CompetitionUncheckedCreateWithoutCategoriesInputSchema } from './CompetitionUncheckedCreateWithoutCategoriesInputSchema';
import { CompetitionCreateOrConnectWithoutCategoriesInputSchema } from './CompetitionCreateOrConnectWithoutCategoriesInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';

export const CompetitionCreateNestedOneWithoutCategoriesInputSchema: z.ZodType<Prisma.CompetitionCreateNestedOneWithoutCategoriesInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional()
}).strict();

export default CompetitionCreateNestedOneWithoutCategoriesInputSchema;
