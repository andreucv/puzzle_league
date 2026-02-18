import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';

export const CategoryCreateManyInputSchema: z.ZodType<Prisma.CategoryCreateManyInput> = z.object({
  id: z.number().int().optional(),
  description: z.string(),
  subname: z.string().optional().nullable(),
  type: z.lazy(() => CategoryTypeSchema),
  maxPartySize: z.number().int().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().optional().nullable(),
  realEndTime: z.coerce.date().optional().nullable(),
  status: z.string().optional(),
  maxParties: z.number().int().optional().nullable(),
  competitionId: z.number().int()
}).strict();

export default CategoryCreateManyInputSchema;
