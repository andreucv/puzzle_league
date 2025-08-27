import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentScalarWhereInputSchema } from './RoleAssignmentScalarWhereInputSchema';
import { RoleAssignmentUpdateManyMutationInputSchema } from './RoleAssignmentUpdateManyMutationInputSchema';
import { RoleAssignmentUncheckedUpdateManyWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedUpdateManyWithoutCompetitionInputSchema';

export const RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateManyWithWhereWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RoleAssignmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RoleAssignmentUpdateManyMutationInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateManyWithoutCompetitionInputSchema) ]),
}).strict();

export default RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema;
