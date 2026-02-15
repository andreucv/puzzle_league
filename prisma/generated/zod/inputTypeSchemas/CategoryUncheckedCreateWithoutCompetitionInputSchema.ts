import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { RecordUncheckedCreateNestedManyWithoutCategoryInputSchema } from './RecordUncheckedCreateNestedManyWithoutCategoryInputSchema';
import { PuzzleUncheckedCreateNestedManyWithoutCategoriesInputSchema } from './PuzzleUncheckedCreateNestedManyWithoutCategoriesInputSchema';

export const CategoryUncheckedCreateWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutCompetitionInput> = z.object({
  id: z.number().int().optional(),
  description: z.string(),
  type: z.lazy(() => CategoryTypeSchema),
  maxPartySize: z.number().int().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().optional().nullable(),
  realEndTime: z.coerce.date().optional().nullable(),
  status: z.string().optional(),
  maxParties: z.number().int().optional().nullable(),
  records: z.lazy(() => RecordUncheckedCreateNestedManyWithoutCategoryInputSchema).optional(),
  puzzles: z.lazy(() => PuzzleUncheckedCreateNestedManyWithoutCategoriesInputSchema).optional()
}).strict();

export default CategoryUncheckedCreateWithoutCompetitionInputSchema;
