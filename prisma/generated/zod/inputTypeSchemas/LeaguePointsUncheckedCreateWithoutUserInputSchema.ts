import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  leagueId: z.string()
}).strict();

export default LeaguePointsUncheckedCreateWithoutUserInputSchema;
