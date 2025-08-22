import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { IntWithAggregatesFilterSchema } from './IntWithAggregatesFilterSchema';

export const LeaguePointsScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.LeaguePointsScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => LeaguePointsScalarWhereWithAggregatesInputSchema),z.lazy(() => LeaguePointsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeaguePointsScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeaguePointsScalarWhereWithAggregatesInputSchema),z.lazy(() => LeaguePointsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  totalPoints: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export default LeaguePointsScalarWhereWithAggregatesInputSchema;
