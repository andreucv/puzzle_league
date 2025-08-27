import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionWhereInputSchema } from '../inputTypeSchemas/CompetitionWhereInputSchema'
import { CompetitionOrderByWithRelationInputSchema } from '../inputTypeSchemas/CompetitionOrderByWithRelationInputSchema'
import { CompetitionWhereUniqueInputSchema } from '../inputTypeSchemas/CompetitionWhereUniqueInputSchema'

export const CompetitionAggregateArgsSchema: z.ZodType<Prisma.CompetitionAggregateArgs> = z.object({
  where: CompetitionWhereInputSchema.optional(),
  orderBy: z.union([ CompetitionOrderByWithRelationInputSchema.array(),CompetitionOrderByWithRelationInputSchema ]).optional(),
  cursor: CompetitionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default CompetitionAggregateArgsSchema;
