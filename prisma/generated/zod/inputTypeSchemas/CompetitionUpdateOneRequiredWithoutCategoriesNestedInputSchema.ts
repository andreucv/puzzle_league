import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutCategoriesInputSchema } from './CompetitionCreateWithoutCategoriesInputSchema';
import { CompetitionUncheckedCreateWithoutCategoriesInputSchema } from './CompetitionUncheckedCreateWithoutCategoriesInputSchema';
import { CompetitionCreateOrConnectWithoutCategoriesInputSchema } from './CompetitionCreateOrConnectWithoutCategoriesInputSchema';
import { CompetitionUpsertWithoutCategoriesInputSchema } from './CompetitionUpsertWithoutCategoriesInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateToOneWithWhereWithoutCategoriesInputSchema } from './CompetitionUpdateToOneWithWhereWithoutCategoriesInputSchema';
import { CompetitionUpdateWithoutCategoriesInputSchema } from './CompetitionUpdateWithoutCategoriesInputSchema';
import { CompetitionUncheckedUpdateWithoutCategoriesInputSchema } from './CompetitionUncheckedUpdateWithoutCategoriesInputSchema';

export const CompetitionUpdateOneRequiredWithoutCategoriesNestedInputSchema: z.ZodType<Prisma.CompetitionUpdateOneRequiredWithoutCategoriesNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutCategoriesInputSchema).optional(),
  upsert: z.lazy(() => CompetitionUpsertWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CompetitionUpdateToOneWithWhereWithoutCategoriesInputSchema),z.lazy(() => CompetitionUpdateWithoutCategoriesInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutCategoriesInputSchema) ]).optional(),
}).strict();

export default CompetitionUpdateOneRequiredWithoutCategoriesNestedInputSchema;
