import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsWhereInputSchema } from '../inputTypeSchemas/LeaguePointsWhereInputSchema'
import { LeaguePointsOrderByWithAggregationInputSchema } from '../inputTypeSchemas/LeaguePointsOrderByWithAggregationInputSchema'
import { LeaguePointsScalarFieldEnumSchema } from '../inputTypeSchemas/LeaguePointsScalarFieldEnumSchema'
import { LeaguePointsScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/LeaguePointsScalarWhereWithAggregatesInputSchema'

export const LeaguePointsGroupByArgsSchema: z.ZodType<Prisma.LeaguePointsGroupByArgs> = z.object({
  where: LeaguePointsWhereInputSchema.optional(),
  orderBy: z.union([ LeaguePointsOrderByWithAggregationInputSchema.array(),LeaguePointsOrderByWithAggregationInputSchema ]).optional(),
  by: LeaguePointsScalarFieldEnumSchema.array(),
  having: LeaguePointsScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default LeaguePointsGroupByArgsSchema;
