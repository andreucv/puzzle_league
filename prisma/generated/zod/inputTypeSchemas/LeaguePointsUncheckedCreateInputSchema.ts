import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsUncheckedCreateInputSchema: z.ZodType<Prisma.LeaguePointsUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  leagueId: z.string(),
  userId: z.string()
}).strict();

export default LeaguePointsUncheckedCreateInputSchema;
