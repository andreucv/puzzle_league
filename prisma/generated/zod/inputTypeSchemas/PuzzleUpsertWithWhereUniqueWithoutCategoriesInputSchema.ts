import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleWhereUniqueInputSchema } from './PuzzleWhereUniqueInputSchema';
import { PuzzleUpdateWithoutCategoriesInputSchema } from './PuzzleUpdateWithoutCategoriesInputSchema';
import { PuzzleUncheckedUpdateWithoutCategoriesInputSchema } from './PuzzleUncheckedUpdateWithoutCategoriesInputSchema';
import { PuzzleCreateWithoutCategoriesInputSchema } from './PuzzleCreateWithoutCategoriesInputSchema';
import { PuzzleUncheckedCreateWithoutCategoriesInputSchema } from './PuzzleUncheckedCreateWithoutCategoriesInputSchema';

export const PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleUpsertWithWhereUniqueWithoutCategoriesInput> = z.object({
  where: z.lazy(() => PuzzleWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PuzzleUpdateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedUpdateWithoutCategoriesInputSchema) ]),
  create: z.union([ z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema) ]),
}).strict();

export default PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema;
