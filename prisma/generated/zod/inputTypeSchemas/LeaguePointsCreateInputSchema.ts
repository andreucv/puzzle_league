import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateNestedOneWithoutLeaguePointsInputSchema } from './LeagueCreateNestedOneWithoutLeaguePointsInputSchema';
import { UserCreateNestedOneWithoutLeaguePointsInputSchema } from './UserCreateNestedOneWithoutLeaguePointsInputSchema';

export const LeaguePointsCreateInputSchema: z.ZodType<Prisma.LeaguePointsCreateInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  league: z.lazy(() => LeagueCreateNestedOneWithoutLeaguePointsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutLeaguePointsInputSchema)
}).strict();

export default LeaguePointsCreateInputSchema;
