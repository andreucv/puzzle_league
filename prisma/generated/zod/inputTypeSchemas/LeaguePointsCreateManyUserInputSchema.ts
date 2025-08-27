import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsCreateManyUserInputSchema: z.ZodType<Prisma.LeaguePointsCreateManyUserInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  leagueId: z.string()
}).strict();

export default LeaguePointsCreateManyUserInputSchema;
