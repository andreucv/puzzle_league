import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentIncludeSchema } from '../inputTypeSchemas/RoleAssignmentIncludeSchema'
import { RoleAssignmentWhereInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereInputSchema'
import { RoleAssignmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/RoleAssignmentOrderByWithRelationInputSchema'
import { RoleAssignmentWhereUniqueInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereUniqueInputSchema'
import { RoleAssignmentScalarFieldEnumSchema } from '../inputTypeSchemas/RoleAssignmentScalarFieldEnumSchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const RoleAssignmentSelectSchema: z.ZodType<Prisma.RoleAssignmentSelect> = z.object({
  id: z.boolean().optional(),
  role: z.boolean().optional(),
  userId: z.boolean().optional(),
  competitionId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
}).strict()

export const RoleAssignmentFindFirstArgsSchema: z.ZodType<Prisma.RoleAssignmentFindFirstArgs> = z.object({
  select: RoleAssignmentSelectSchema.optional(),
  include: z.lazy(() => RoleAssignmentIncludeSchema).optional(),
  where: RoleAssignmentWhereInputSchema.optional(),
  orderBy: z.union([ RoleAssignmentOrderByWithRelationInputSchema.array(),RoleAssignmentOrderByWithRelationInputSchema ]).optional(),
  cursor: RoleAssignmentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RoleAssignmentScalarFieldEnumSchema,RoleAssignmentScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default RoleAssignmentFindFirstArgsSchema;
