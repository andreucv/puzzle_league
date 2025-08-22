import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsCreateManyLeagueInputSchema: z.ZodType<Prisma.LeaguePointsCreateManyLeagueInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  userId: z.string()
}).strict();

export default LeaguePointsCreateManyLeagueInputSchema;
