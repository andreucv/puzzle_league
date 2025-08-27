import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { CompetitionListRelationFilterSchema } from './CompetitionListRelationFilterSchema';
import { LeaguePointsListRelationFilterSchema } from './LeaguePointsListRelationFilterSchema';

export const LeagueWhereUniqueInputSchema: z.ZodType<Prisma.LeagueWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => LeagueWhereInputSchema),z.lazy(() => LeagueWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeagueWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeagueWhereInputSchema),z.lazy(() => LeagueWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  competitions: z.lazy(() => CompetitionListRelationFilterSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsListRelationFilterSchema).optional()
}).strict());

export default LeagueWhereUniqueInputSchema;
