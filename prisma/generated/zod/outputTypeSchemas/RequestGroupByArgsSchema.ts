import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestWhereInputSchema } from '../inputTypeSchemas/RequestWhereInputSchema'
import { RequestOrderByWithAggregationInputSchema } from '../inputTypeSchemas/RequestOrderByWithAggregationInputSchema'
import { RequestScalarFieldEnumSchema } from '../inputTypeSchemas/RequestScalarFieldEnumSchema'
import { RequestScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/RequestScalarWhereWithAggregatesInputSchema'

export const RequestGroupByArgsSchema: z.ZodType<Prisma.RequestGroupByArgs> = z.object({
  where: RequestWhereInputSchema.optional(),
  orderBy: z.union([ RequestOrderByWithAggregationInputSchema.array(),RequestOrderByWithAggregationInputSchema ]).optional(),
  by: RequestScalarFieldEnumSchema.array(),
  having: RequestScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RequestGroupByArgsSchema;
