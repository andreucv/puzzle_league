import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsIncludeSchema } from '../inputTypeSchemas/LeaguePointsIncludeSchema'
import { LeaguePointsWhereInputSchema } from '../inputTypeSchemas/LeaguePointsWhereInputSchema'
import { LeaguePointsOrderByWithRelationInputSchema } from '../inputTypeSchemas/LeaguePointsOrderByWithRelationInputSchema'
import { LeaguePointsWhereUniqueInputSchema } from '../inputTypeSchemas/LeaguePointsWhereUniqueInputSchema'
import { LeaguePointsScalarFieldEnumSchema } from '../inputTypeSchemas/LeaguePointsScalarFieldEnumSchema'
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

export const LeaguePointsFindFirstArgsSchema: z.ZodType<Prisma.LeaguePointsFindFirstArgs> = z.object({
  select: LeaguePointsSelectSchema.optional(),
  include: z.lazy(() => LeaguePointsIncludeSchema).optional(),
  where: LeaguePointsWhereInputSchema.optional(),
  orderBy: z.union([ LeaguePointsOrderByWithRelationInputSchema.array(),LeaguePointsOrderByWithRelationInputSchema ]).optional(),
  cursor: LeaguePointsWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LeaguePointsScalarFieldEnumSchema,LeaguePointsScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default LeaguePointsFindFirstArgsSchema;
