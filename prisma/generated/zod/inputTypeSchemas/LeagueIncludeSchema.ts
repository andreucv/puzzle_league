import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionFindManyArgsSchema } from "../outputTypeSchemas/CompetitionFindManyArgsSchema"
import { LeaguePointsFindManyArgsSchema } from "../outputTypeSchemas/LeaguePointsFindManyArgsSchema"
import { LeagueCountOutputTypeArgsSchema } from "../outputTypeSchemas/LeagueCountOutputTypeArgsSchema"

export const LeagueIncludeSchema: z.ZodType<Prisma.LeagueInclude> = z.object({
  competitions: z.union([z.boolean(),z.lazy(() => CompetitionFindManyArgsSchema)]).optional(),
  leaguePoints: z.union([z.boolean(),z.lazy(() => LeaguePointsFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LeagueCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default LeagueIncludeSchema;
