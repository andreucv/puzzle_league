import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentCreateWithoutCompetitionInputSchema } from './RoleAssignmentCreateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema';

export const RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentCreateOrConnectWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema;
