import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema } from './LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema';
import { LeaguePointsWhereInputSchema } from './LeaguePointsWhereInputSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { LeagueScalarRelationFilterSchema } from './LeagueScalarRelationFilterSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const LeaguePointsWhereUniqueInputSchema: z.ZodType<Prisma.LeaguePointsWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    userId_leagueId: z.lazy(() => LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    userId_leagueId: z.lazy(() => LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  userId_leagueId: z.lazy(() => LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => LeaguePointsWhereInputSchema),z.lazy(() => LeaguePointsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeaguePointsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeaguePointsWhereInputSchema),z.lazy(() => LeaguePointsWhereInputSchema).array() ]).optional(),
  totalPoints: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  league: z.union([ z.lazy(() => LeagueScalarRelationFilterSchema),z.lazy(() => LeagueWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export default LeaguePointsWhereUniqueInputSchema;
