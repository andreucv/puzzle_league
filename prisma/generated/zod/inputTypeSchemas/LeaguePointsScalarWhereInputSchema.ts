import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';

export const LeaguePointsScalarWhereInputSchema: z.ZodType<Prisma.LeaguePointsScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => LeaguePointsScalarWhereInputSchema),z.lazy(() => LeaguePointsScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LeaguePointsScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LeaguePointsScalarWhereInputSchema),z.lazy(() => LeaguePointsScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  totalPoints: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export default LeaguePointsScalarWhereInputSchema;
