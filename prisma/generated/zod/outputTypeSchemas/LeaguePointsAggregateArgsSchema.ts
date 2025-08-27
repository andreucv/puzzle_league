import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsWhereInputSchema } from '../inputTypeSchemas/LeaguePointsWhereInputSchema'
import { LeaguePointsOrderByWithRelationInputSchema } from '../inputTypeSchemas/LeaguePointsOrderByWithRelationInputSchema'
import { LeaguePointsWhereUniqueInputSchema } from '../inputTypeSchemas/LeaguePointsWhereUniqueInputSchema'

export const LeaguePointsAggregateArgsSchema: z.ZodType<Prisma.LeaguePointsAggregateArgs> = z.object({
  where: LeaguePointsWhereInputSchema.optional(),
  orderBy: z.union([ LeaguePointsOrderByWithRelationInputSchema.array(),LeaguePointsOrderByWithRelationInputSchema ]).optional(),
  cursor: LeaguePointsWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default LeaguePointsAggregateArgsSchema;
