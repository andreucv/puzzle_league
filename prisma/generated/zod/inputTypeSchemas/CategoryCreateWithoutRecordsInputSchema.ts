import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { CompetitionCreateNestedOneWithoutCategoriesInputSchema } from './CompetitionCreateNestedOneWithoutCategoriesInputSchema';

export const CategoryCreateWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryCreateWithoutRecordsInput> = z.object({
  name: z.string(),
  type: z.lazy(() => CategoryTypeSchema),
  maxPartySize: z.number().int().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().optional().nullable(),
  realEndTime: z.coerce.date().optional().nullable(),
  status: z.string().optional(),
  maxParties: z.number().int().optional().nullable(),
  competition: z.lazy(() => CompetitionCreateNestedOneWithoutCategoriesInputSchema)
}).strict();

export default CategoryCreateWithoutRecordsInputSchema;
