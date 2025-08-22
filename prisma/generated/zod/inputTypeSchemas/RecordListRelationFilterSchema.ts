import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RecordWhereInputSchema } from './RecordWhereInputSchema';

export const RecordListRelationFilterSchema: z.ZodType<Prisma.RecordListRelationFilter> = z.object({
  every: z.lazy(() => RecordWhereInputSchema).optional(),
  some: z.lazy(() => RecordWhereInputSchema).optional(),
  none: z.lazy(() => RecordWhereInputSchema).optional()
}).strict();

export default RecordListRelationFilterSchema;
