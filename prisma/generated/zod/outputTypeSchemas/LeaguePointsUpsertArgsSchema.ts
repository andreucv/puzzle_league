import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsIncludeSchema } from '../inputTypeSchemas/LeaguePointsIncludeSchema'
import { LeaguePointsWhereUniqueInputSchema } from '../inputTypeSchemas/LeaguePointsWhereUniqueInputSchema'
import { LeaguePointsCreateInputSchema } from '../inputTypeSchemas/LeaguePointsCreateInputSchema'
import { LeaguePointsUncheckedCreateInputSchema } from '../inputTypeSchemas/LeaguePointsUncheckedCreateInputSchema'
import { LeaguePointsUpdateInputSchema } from '../inputTypeSchemas/LeaguePointsUpdateInputSchema'
import { LeaguePointsUncheckedUpdateInputSchema } from '../inputTypeSchemas/LeaguePointsUncheckedUpdateInputSchema'
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

export const LeaguePointsUpsertArgsSchema: z.ZodType<Prisma.LeaguePointsUpsertArgs> = z.object({
  select: LeaguePointsSelectSchema.optional(),
  include: z.lazy(() => LeaguePointsIncludeSchema).optional(),
  where: LeaguePointsWhereUniqueInputSchema,
  create: z.union([ LeaguePointsCreateInputSchema,LeaguePointsUncheckedCreateInputSchema ]),
  update: z.union([ LeaguePointsUpdateInputSchema,LeaguePointsUncheckedUpdateInputSchema ]),
}).strict() ;

export default LeaguePointsUpsertArgsSchema;
