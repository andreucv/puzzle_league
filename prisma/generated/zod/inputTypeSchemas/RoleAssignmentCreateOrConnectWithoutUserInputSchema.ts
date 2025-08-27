import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentCreateWithoutUserInputSchema } from './RoleAssignmentCreateWithoutUserInputSchema';
import { RoleAssignmentUncheckedCreateWithoutUserInputSchema } from './RoleAssignmentUncheckedCreateWithoutUserInputSchema';

export const RoleAssignmentCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default RoleAssignmentCreateOrConnectWithoutUserInputSchema;
