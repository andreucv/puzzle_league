import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentIncludeSchema } from '../inputTypeSchemas/RoleAssignmentIncludeSchema'
import { RoleAssignmentWhereUniqueInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereUniqueInputSchema'
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

export const RoleAssignmentFindUniqueArgsSchema: z.ZodType<Prisma.RoleAssignmentFindUniqueArgs> = z.object({
  select: RoleAssignmentSelectSchema.optional(),
  include: z.lazy(() => RoleAssignmentIncludeSchema).optional(),
  where: RoleAssignmentWhereUniqueInputSchema,
}).strict() ;

export default RoleAssignmentFindUniqueArgsSchema;
