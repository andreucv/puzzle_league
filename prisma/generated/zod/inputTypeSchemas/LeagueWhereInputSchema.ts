import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { CompetitionListRelationFilterSchema } from './CompetitionListRelationFilterSchema';
import { LeaguePointsListRelationFilterSchema } from './LeaguePointsListRelationFilterSchema';

export const LeagueWhereInputSchema: z.ZodType<Prisma.LeagueWhereInput> = z.object({
  AND: z.union([ z.lazy(() => LeagueWhereInputSchema),z.lazy(() => LeagueWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeagueWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeagueWhereInputSchema),z.lazy(() => LeagueWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  competitions: z.lazy(() => CompetitionListRelationFilterSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsListRelationFilterSchema).optional()
}).strict();

export default LeagueWhereInputSchema;
