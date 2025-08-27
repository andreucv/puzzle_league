import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentUpdateManyMutationInputSchema } from '../inputTypeSchemas/RoleAssignmentUpdateManyMutationInputSchema'
import { RoleAssignmentUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/RoleAssignmentUncheckedUpdateManyInputSchema'
import { RoleAssignmentWhereInputSchema } from '../inputTypeSchemas/RoleAssignmentWhereInputSchema'

export const RoleAssignmentUpdateManyArgsSchema: z.ZodType<Prisma.RoleAssignmentUpdateManyArgs> = z.object({
  data: z.union([ RoleAssignmentUpdateManyMutationInputSchema,RoleAssignmentUncheckedUpdateManyInputSchema ]),
  where: RoleAssignmentWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RoleAssignmentUpdateManyArgsSchema;
