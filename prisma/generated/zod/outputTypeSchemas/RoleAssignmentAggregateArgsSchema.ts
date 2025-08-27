import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentWhereInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereInputSchema'
import { RoleAssignmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/RoleAssignmentOrderByWithRelationInputSchema'
import { RoleAssignmentWhereUniqueInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereUniqueInputSchema'

export const RoleAssignmentAggregateArgsSchema: z.ZodType<Prisma.RoleAssignmentAggregateArgs> = z.object({
  where: RoleAssignmentWhereInputSchema.optional(),
  orderBy: z.union([ RoleAssignmentOrderByWithRelationInputSchema.array(),RoleAssignmentOrderByWithRelationInputSchema ]).optional(),
  cursor: RoleAssignmentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default RoleAssignmentAggregateArgsSchema;
