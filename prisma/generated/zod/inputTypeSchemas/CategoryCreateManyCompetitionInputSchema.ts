import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';

export const CategoryCreateManyCompetitionInputSchema: z.ZodType<Prisma.CategoryCreateManyCompetitionInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  type: z.lazy(() => CategoryTypeSchema),
  maxPartySize: z.number().int().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().optional().nullable(),
  realEndTime: z.coerce.date().optional().nullable(),
  status: z.string().optional(),
  maxParties: z.number().int().optional().nullable()
}).strict();

export default CategoryCreateManyCompetitionInputSchema;
