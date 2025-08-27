import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueArgsSchema } from "../outputTypeSchemas/LeagueArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"

export const LeaguePointsSelectSchema: z.ZodType<Prisma.LeaguePointsSelect> = z.object({
  id: z.boolean().optional(),
  totalPoints: z.boolean().optional(),
  leagueId: z.boolean().optional(),
  userId: z.boolean().optional(),
  league: z.union([z.boolean(),z.lazy(() => LeagueArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export default LeaguePointsSelectSchema;
