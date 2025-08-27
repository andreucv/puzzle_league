import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RoleAssignmentCreateManyInputSchema } from '../inputTypeSchemas/RoleAssignmentCreateManyInputSchema'

export const RoleAssignmentCreateManyArgsSchema: z.ZodType<Prisma.RoleAssignmentCreateManyArgs> = z.object({
  data: z.union([ RoleAssignmentCreateManyInputSchema,RoleAssignmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default RoleAssignmentCreateManyArgsSchema;
