import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueWhereInputSchema } from '../inputTypeSchemas/LeagueWhereInputSchema'
import { LeagueOrderByWithAggregationInputSchema } from '../inputTypeSchemas/LeagueOrderByWithAggregationInputSchema'
import { LeagueScalarFieldEnumSchema } from '../inputTypeSchemas/LeagueScalarFieldEnumSchema'
import { LeagueScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/LeagueScalarWhereWithAggregatesInputSchema'

export const LeagueGroupByArgsSchema: z.ZodType<Prisma.LeagueGroupByArgs> = z.object({
  where: LeagueWhereInputSchema.optional(),
  orderBy: z.union([ LeagueOrderByWithAggregationInputSchema.array(),LeagueOrderByWithAggregationInputSchema ]).optional(),
  by: LeagueScalarFieldEnumSchema.array(),
  having: LeagueScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default LeagueGroupByArgsSchema;
