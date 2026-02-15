import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleWhereUniqueInputSchema } from './PuzzleWhereUniqueInputSchema';
import { PuzzleCreateWithoutCategoriesInputSchema } from './PuzzleCreateWithoutCategoriesInputSchema';
import { PuzzleUncheckedCreateWithoutCategoriesInputSchema } from './PuzzleUncheckedCreateWithoutCategoriesInputSchema';

export const PuzzleCreateOrConnectWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleCreateOrConnectWithoutCategoriesInput> = z.object({
  where: z.lazy(() => PuzzleWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema) ]),
}).strict();

export default PuzzleCreateOrConnectWithoutCategoriesInputSchema;
