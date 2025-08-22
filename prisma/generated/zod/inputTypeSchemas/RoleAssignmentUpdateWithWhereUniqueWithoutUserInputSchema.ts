import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithoutUserInputSchema } from './RoleAssignmentUpdateWithoutUserInputSchema';
import { RoleAssignmentUncheckedUpdateWithoutUserInputSchema } from './RoleAssignmentUncheckedUpdateWithoutUserInputSchema';

export const RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RoleAssignmentUpdateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema;
