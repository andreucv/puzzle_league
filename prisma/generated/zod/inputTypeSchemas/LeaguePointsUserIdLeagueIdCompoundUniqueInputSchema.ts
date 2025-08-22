import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema: z.ZodType<Prisma.LeaguePointsUserIdLeagueIdCompoundUniqueInput> = z.object({
  userId: z.string(),
  leagueId: z.string()
}).strict();

export default LeaguePointsUserIdLeagueIdCompoundUniqueInputSchema;
