import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleWhereUniqueInputSchema } from './PuzzleWhereUniqueInputSchema';
import { PuzzleUpdateWithoutCategoriesInputSchema } from './PuzzleUpdateWithoutCategoriesInputSchema';
import { PuzzleUncheckedUpdateWithoutCategoriesInputSchema } from './PuzzleUncheckedUpdateWithoutCategoriesInputSchema';

export const PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleUpdateWithWhereUniqueWithoutCategoriesInput> = z.object({
  where: z.lazy(() => PuzzleWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PuzzleUpdateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedUpdateWithoutCategoriesInputSchema) ]),
}).strict();

export default PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema;
