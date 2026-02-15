import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleCreateWithoutCategoriesInputSchema } from './PuzzleCreateWithoutCategoriesInputSchema';
import { PuzzleUncheckedCreateWithoutCategoriesInputSchema } from './PuzzleUncheckedCreateWithoutCategoriesInputSchema';
import { PuzzleCreateOrConnectWithoutCategoriesInputSchema } from './PuzzleCreateOrConnectWithoutCategoriesInputSchema';
import { PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema } from './PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema';
import { PuzzleWhereUniqueInputSchema } from './PuzzleWhereUniqueInputSchema';
import { PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema } from './PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema';
import { PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema } from './PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema';
import { PuzzleScalarWhereInputSchema } from './PuzzleScalarWhereInputSchema';

export const PuzzleUpdateManyWithoutCategoriesNestedInputSchema: z.ZodType<Prisma.PuzzleUpdateManyWithoutCategoriesNestedInput> = z.object({
  create: z.union([ z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleCreateWithoutCategoriesInputSchema).array(),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema),z.lazy(() => PuzzleUncheckedCreateWithoutCategoriesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PuzzleCreateOrConnectWithoutCategoriesInputSchema),z.lazy(() => PuzzleCreateOrConnectWithoutCategoriesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema),z.lazy(() => PuzzleUpsertWithWhereUniqueWithoutCategoriesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => PuzzleWhereUniqueInputSchema),z.lazy(() => PuzzleWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PuzzleWhereUniqueInputSchema),z.lazy(() => PuzzleWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PuzzleWhereUniqueInputSchema),z.lazy(() => PuzzleWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PuzzleWhereUniqueInputSchema),z.lazy(() => PuzzleWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema),z.lazy(() => PuzzleUpdateWithWhereUniqueWithoutCategoriesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema),z.lazy(() => PuzzleUpdateManyWithWhereWithoutCategoriesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PuzzleScalarWhereInputSchema),z.lazy(() => PuzzleScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default PuzzleUpdateManyWithoutCategoriesNestedInputSchema;
