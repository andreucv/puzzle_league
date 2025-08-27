import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsIncludeSchema } from '../inputTypeSchemas/LeaguePointsIncludeSchema'
import { LeaguePointsUpdateInputSchema } from '../inputTypeSchemas/LeaguePointsUpdateInputSchema'
import { LeaguePointsUncheckedUpdateInputSchema } from '../inputTypeSchemas/LeaguePointsUncheckedUpdateInputSchema'
import { LeaguePointsWhereUniqueInputSchema } from '../inputTypeSchemas/LeaguePointsWhereUniqueInputSchema'
import { LeagueArgsSchema } from "../outputTypeSchemas/LeagueArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const LeaguePointsSelectSchema: z.ZodType<Prisma.LeaguePointsSelect> = z.object({
  id: z.boolean().optional(),
  totalPoints: z.boolean().optional(),
  leagueId: z.boolean().optional(),
  userId: z.boolean().optional(),
  league: z.union([z.boolean(),z.lazy(() => LeagueArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const LeaguePointsUpdateArgsSchema: z.ZodType<Prisma.LeaguePointsUpdateArgs> = z.object({
  select: LeaguePointsSelectSchema.optional(),
  include: z.lazy(() => LeaguePointsIncludeSchema).optional(),
  data: z.union([ LeaguePointsUpdateInputSchema,LeaguePointsUncheckedUpdateInputSchema ]),
  where: LeaguePointsWhereUniqueInputSchema,
}).strict() ;

export default LeaguePointsUpdateArgsSchema;
