import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentScalarWhereInputSchema } from './RoleAssignmentScalarWhereInputSchema';
import { RoleAssignmentUpdateManyMutationInputSchema } from './RoleAssignmentUpdateManyMutationInputSchema';
import { RoleAssignmentUncheckedUpdateManyWithoutUserInputSchema } from './RoleAssignmentUncheckedUpdateManyWithoutUserInputSchema';

export const RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => RoleAssignmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RoleAssignmentUpdateManyMutationInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema;
