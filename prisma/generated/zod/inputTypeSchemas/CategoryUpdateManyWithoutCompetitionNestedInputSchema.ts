import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutCompetitionInputSchema } from './CategoryCreateWithoutCompetitionInputSchema';
import { CategoryUncheckedCreateWithoutCompetitionInputSchema } from './CategoryUncheckedCreateWithoutCompetitionInputSchema';
import { CategoryCreateOrConnectWithoutCompetitionInputSchema } from './CategoryCreateOrConnectWithoutCompetitionInputSchema';
import { CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema } from './CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema';
import { CategoryCreateManyCompetitionInputEnvelopeSchema } from './CategoryCreateManyCompetitionInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema } from './CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema';
import { CategoryUpdateManyWithWhereWithoutCompetitionInputSchema } from './CategoryUpdateManyWithWhereWithoutCompetitionInputSchema';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';

export const CategoryUpdateManyWithoutCompetitionNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutCompetitionNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryCreateWithoutCompetitionInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyCompetitionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutCompetitionInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutCompetitionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CategoryUpdateManyWithoutCompetitionNestedInputSchema;
