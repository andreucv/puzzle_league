import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueWhereInputSchema } from '../inputTypeSchemas/LeagueWhereInputSchema'
import { LeagueOrderByWithRelationInputSchema } from '../inputTypeSchemas/LeagueOrderByWithRelationInputSchema'
import { LeagueWhereUniqueInputSchema } from '../inputTypeSchemas/LeagueWhereUniqueInputSchema'

export const LeagueAggregateArgsSchema: z.ZodType<Prisma.LeagueAggregateArgs> = z.object({
  where: LeagueWhereInputSchema.optional(),
  orderBy: z.union([ LeagueOrderByWithRelationInputSchema.array(),LeagueOrderByWithRelationInputSchema ]).optional(),
  cursor: LeagueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default LeagueAggregateArgsSchema;
