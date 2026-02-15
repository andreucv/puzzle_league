import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleCreateWithoutCategoriesInputSchema } from './PuzzleCreateWithoutCategoriesInputSchema';
import { PuzzleUncheckedCreateWithoutCategoriesInputSchema } from './PuzzleUncheckedCreateWithoutCategoriesInputSchema';
import { PuzzleCreateOrConnectWithoutCategoriesInputSchema } from './PuzzleCreateOrConnectWithoutCategoriesInputSchema';
import { PuzzleWhereUniqueInputSchema } from './PuzzleWhereUniqueInputSchema';

export const PuzzleUncheckedCreateNestedManyWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleUncheckedCreateNestedManyWithoutCategoriesInput> = z.object({
  create: z.union([ z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema).array(),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PuzzleCreateOrConnectWithoutCategoriesInputSchema),z.lazy(() => PuzzleCreateOrConnectWithoutCategoriesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PuzzleWhereUniqueInputSchema),z.lazy(() => PuzzleWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default PuzzleUncheckedCreateNestedManyWithoutCategoriesInputSchema;
