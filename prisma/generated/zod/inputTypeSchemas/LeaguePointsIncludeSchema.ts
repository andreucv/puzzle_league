import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueArgsSchema } from "../outputTypeSchemas/LeagueArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"

export const LeaguePointsIncludeSchema: z.ZodType<Prisma.LeaguePointsInclude> = z.object({
  league: z.union([z.boolean(),z.lazy(() => LeagueArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export default LeaguePointsIncludeSchema;
