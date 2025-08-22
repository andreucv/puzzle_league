import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordWhereInputSchema } from '../inputTypeSchemas/RecordWhereInputSchema'
import { RecordOrderByWithRelationInputSchema } from '../inputTypeSchemas/RecordOrderByWithRelationInputSchema'
import { RecordWhereUniqueInputSchema } from '../inputTypeSchemas/RecordWhereUniqueInputSchema'

export const RecordAggregateArgsSchema: z.ZodType<Prisma.RecordAggregateArgs> = z.object({
  where: RecordWhereInputSchema.optional(),
  orderBy: z.union([ RecordOrderByWithRelationInputSchema.array(),RecordOrderByWithRelationInputSchema ]).optional(),
  cursor: RecordWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RecordAggregateArgsSchema;
