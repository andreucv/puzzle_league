import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordWhereInputSchema } from '../inputTypeSchemas/RecordWhereInputSchema'
import { RecordOrderByWithAggregationInputSchema } from '../inputTypeSchemas/RecordOrderByWithAggregationInputSchema'
import { RecordScalarFieldEnumSchema } from '../inputTypeSchemas/RecordScalarFieldEnumSchema'
import { RecordScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/RecordScalarWhereWithAggregatesInputSchema'

export const RecordGroupByArgsSchema: z.ZodType<Prisma.RecordGroupByArgs> = z.object({
  where: RecordWhereInputSchema.optional(),
  orderBy: z.union([ RecordOrderByWithAggregationInputSchema.array(),RecordOrderByWithAggregationInputSchema ]).optional(),
  by: RecordScalarFieldEnumSchema.array(),
  having: RecordScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RecordGroupByArgsSchema;
