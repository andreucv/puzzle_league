import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentWhereInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereInputSchema'
import { RoleAssignmentOrderByWithAggregationInputSchema } from '../inputTypeSchemas/RoleAssignmentOrderByWithAggregationInputSchema'
import { RoleAssignmentScalarFieldEnumSchema } from '../inputTypeSchemas/RoleAssignmentScalarFieldEnumSchema'
import { RoleAssignmentScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/RoleAssignmentScalarWhereWithAggregatesInputSchema'

export const RoleAssignmentGroupByArgsSchema: z.ZodType<Prisma.RoleAssignmentGroupByArgs> = z.object({
  where: RoleAssignmentWhereInputSchema.optional(),
  orderBy: z.union([ RoleAssignmentOrderByWithAggregationInputSchema.array(),RoleAssignmentOrderByWithAggregationInputSchema ]).optional(),
  by: RoleAssignmentScalarFieldEnumSchema.array(),
  having: RoleAssignmentScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RoleAssignmentGroupByArgsSchema;
