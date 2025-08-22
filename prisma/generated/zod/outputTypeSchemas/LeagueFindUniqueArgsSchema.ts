import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueIncludeSchema } from '../inputTypeSchemas/LeagueIncludeSchema'
import { LeagueWhereUniqueInputSchema } from '../inputTypeSchemas/LeagueWhereUniqueInputSchema'
import { CompetitionFindManyArgsSchema } from "../outputTypeSchemas/CompetitionFindManyArgsSchema"
import { LeaguePointsFindManyArgsSchema } from "../outputTypeSchemas/LeaguePointsFindManyArgsSchema"
import { LeagueCountOutputTypeArgsSchema } from "../outputTypeSchemas/LeagueCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const LeagueFindUniqueArgsSchema: z.ZodType<Prisma.LeagueFindUniqueArgs> = z.object({
  select: LeagueSelectSchema.optional(),
  include: z.lazy(() => LeagueIncludeSchema).optional(),
  where: LeagueWhereUniqueInputSchema,
}).strict() ;

export default LeagueFindUniqueArgsSchema;
