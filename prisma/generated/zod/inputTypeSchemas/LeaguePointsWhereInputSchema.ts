import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { LeagueScalarRelationFilterSchema } from './LeagueScalarRelationFilterSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const LeaguePointsWhereInputSchema: z.ZodType<Prisma.LeaguePointsWhereInput> = z.object({
  AND: z.union([ z.lazy(() => LeaguePointsWhereInputSchema),z.lazy(() => LeaguePointsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeaguePointsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeaguePointsWhereInputSchema),z.lazy(() => LeaguePointsWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  totalPoints: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  league: z.union([ z.lazy(() => LeagueScalarRelationFilterSchema),z.lazy(() => LeagueWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export default LeaguePointsWhereInputSchema;
