import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';

export const LeagueScalarRelationFilterSchema: z.ZodType<Prisma.LeagueScalarRelationFilter> = z.object({
  is: z.lazy(() => LeagueWhereInputSchema).optional(),
  isNot: z.lazy(() => LeagueWhereInputSchema).optional()
}).strict();

export default LeagueScalarRelationFilterSchema;
