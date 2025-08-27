import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionFindManyArgsSchema } from "../outputTypeSchemas/CompetitionFindManyArgsSchema"
import { LeaguePointsFindManyArgsSchema } from "../outputTypeSchemas/LeaguePointsFindManyArgsSchema"
import { LeagueCountOutputTypeArgsSchema } from "../outputTypeSchemas/LeagueCountOutputTypeArgsSchema"

export const LeagueSelectSchema: z.ZodType<Prisma.LeagueSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  competitions: z.union([z.boolean(),z.lazy(() => CompetitionFindManyArgsSchema)]).optional(),
  leaguePoints: z.union([z.boolean(),z.lazy(() => LeaguePointsFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LeagueCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default LeagueSelectSchema;
