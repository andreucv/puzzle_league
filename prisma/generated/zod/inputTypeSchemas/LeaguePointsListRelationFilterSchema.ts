import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsWhereInputSchema } from './LeaguePointsWhereInputSchema';

export const LeaguePointsListRelationFilterSchema: z.ZodType<Prisma.LeaguePointsListRelationFilter> = z.object({
  every: z.lazy(() => LeaguePointsWhereInputSchema).optional(),
  some: z.lazy(() => LeaguePointsWhereInputSchema).optional(),
  none: z.lazy(() => LeaguePointsWhereInputSchema).optional()
}).strict();

export default LeaguePointsListRelationFilterSchema;
