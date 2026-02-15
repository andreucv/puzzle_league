import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleScalarWhereInputSchema } from './PuzzleScalarWhereInputSchema';
import { PuzzleUpdateManyMutationInputSchema } from './PuzzleUpdateManyMutationInputSchema';
import { PuzzleUncheckedUpdateManyWithoutCategoriesInputSchema } from './PuzzleUncheckedUpdateManyWithoutCategoriesInputSchema';

export const PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleUpdateManyWithWhereWithoutCategoriesInput> = z.object({
  where: z.lazy(() => PuzzleScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PuzzleUpdateManyMutationInputSchema),z.lazy(() => PuzzleUncheckedUpdateManyWithoutCategoriesInputSchema) ]),
}).strict();

export default PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema;
