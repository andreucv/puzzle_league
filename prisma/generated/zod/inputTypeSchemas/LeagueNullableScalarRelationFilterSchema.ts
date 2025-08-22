import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';

export const LeagueNullableScalarRelationFilterSchema: z.ZodType<Prisma.LeagueNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => LeagueWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => LeagueWhereInputSchema).optional().nullable()
}).strict();

export default LeagueNullableScalarRelationFilterSchema;
