import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentWhereInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereInputSchema'

export const RoleAssignmentDeleteManyArgsSchema: z.ZodType<Prisma.RoleAssignmentDeleteManyArgs> = z.object({
  where: RoleAssignmentWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RoleAssignmentDeleteManyArgsSchema;
