import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutPuzzlesInputSchema } from './CategoryCreateWithoutPuzzlesInputSchema';
import { CategoryUncheckedCreateWithoutPuzzlesInputSchema } from './CategoryUncheckedCreateWithoutPuzzlesInputSchema';
import { CategoryCreateOrConnectWithoutPuzzlesInputSchema } from './CategoryCreateOrConnectWithoutPuzzlesInputSchema';
import { CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema } from './CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema } from './CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema';
import { CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema } from './CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';

export const CategoryUpdateManyWithoutPuzzlesNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutPuzzlesNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutPuzzlesInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutPuzzlesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutPuzzlesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutPuzzlesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutPuzzlesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CategoryUpdateManyWithoutPuzzlesNestedInputSchema;
