import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutCompetitionInputSchema } from './CategoryCreateWithoutCompetitionInputSchema';
import { CategoryUncheckedCreateWithoutCompetitionInputSchema } from './CategoryUncheckedCreateWithoutCompetitionInputSchema';
import { CategoryCreateOrConnectWithoutCompetitionInputSchema } from './CategoryCreateOrConnectWithoutCompetitionInputSchema';
import { CategoryCreateManyCompetitionInputEnvelopeSchema } from './CategoryCreateManyCompetitionInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedManyWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutCompetitionInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryCreateWithoutCompetitionInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyCompetitionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CategoryCreateNestedManyWithoutCompetitionInputSchema;
