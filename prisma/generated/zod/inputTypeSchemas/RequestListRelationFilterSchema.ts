import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereInputSchema } from './RequestWhereInputSchema';

export const RequestListRelationFilterSchema: z.ZodType<Prisma.RequestListRelationFilter> = z.object({
  every: z.lazy(() => RequestWhereInputSchema).optional(),
  some: z.lazy(() => RequestWhereInputSchema).optional(),
  none: z.lazy(() => RequestWhereInputSchema).optional()
}).strict();

export default RequestListRelationFilterSchema;
