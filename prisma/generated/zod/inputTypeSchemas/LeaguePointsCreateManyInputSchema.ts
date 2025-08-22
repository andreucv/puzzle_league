import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsCreateManyInputSchema: z.ZodType<Prisma.LeaguePointsCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  leagueId: z.string(),
  userId: z.string()
}).strict();

export default LeaguePointsCreateManyInputSchema;
