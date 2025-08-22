import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutLeaguePointsInputSchema } from './UserCreateNestedOneWithoutLeaguePointsInputSchema';

export const LeaguePointsCreateWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsCreateWithoutLeagueInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutLeaguePointsInputSchema)
}).strict();

export default LeaguePointsCreateWithoutLeagueInputSchema;
