import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionWhereInputSchema } from '../inputTypeSchemas/CompetitionWhereInputSchema'
import { CompetitionOrderByWithAggregationInputSchema } from '../inputTypeSchemas/CompetitionOrderByWithAggregationInputSchema'
import { CompetitionScalarFieldEnumSchema } from '../inputTypeSchemas/CompetitionScalarFieldEnumSchema'
import { CompetitionScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/CompetitionScalarWhereWithAggregatesInputSchema'

export const CompetitionGroupByArgsSchema: z.ZodType<Prisma.CompetitionGroupByArgs> = z.object({
  where: CompetitionWhereInputSchema.optional(),
  orderBy: z.union([ CompetitionOrderByWithAggregationInputSchema.array(),CompetitionOrderByWithAggregationInputSchema ]).optional(),
  by: CompetitionScalarFieldEnumSchema.array(),
  having: CompetitionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default CompetitionGroupByArgsSchema;
