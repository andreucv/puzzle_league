import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutPuzzlesInputSchema } from './CategoryCreateWithoutPuzzlesInputSchema';
import { CategoryUncheckedCreateWithoutPuzzlesInputSchema } from './CategoryUncheckedCreateWithoutPuzzlesInputSchema';
import { CategoryCreateOrConnectWithoutPuzzlesInputSchema } from './CategoryCreateOrConnectWithoutPuzzlesInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedManyWithoutPuzzlesInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutPuzzlesInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryCreateWithoutPuzzlesInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutPuzzlesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutPuzzlesInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutPuzzlesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CategoryCreateNestedManyWithoutPuzzlesInputSchema;
