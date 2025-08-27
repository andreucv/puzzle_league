import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestWhereInputSchema } from '../inputTypeSchemas/RequestWhereInputSchema'
import { RequestOrderByWithRelationInputSchema } from '../inputTypeSchemas/RequestOrderByWithRelationInputSchema'
import { RequestWhereUniqueInputSchema } from '../inputTypeSchemas/RequestWhereUniqueInputSchema'

export const RequestAggregateArgsSchema: z.ZodType<Prisma.RequestAggregateArgs> = z.object({
  where: RequestWhereInputSchema.optional(),
  orderBy: z.union([ RequestOrderByWithRelationInputSchema.array(),RequestOrderByWithRelationInputSchema ]).optional(),
  cursor: RequestWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RequestAggregateArgsSchema;
