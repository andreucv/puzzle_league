import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const LeagueCountOutputTypeSelectSchema: z.ZodType<Prisma.LeagueCountOutputTypeSelect> = z.object({
  competitions: z.boolean().optional(),
  leaguePoints: z.boolean().optional(),
}).strict();

export default LeagueCountOutputTypeSelectSchema;
