import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithoutUserInputSchema } from './RoleAssignmentUpdateWithoutUserInputSchema';
import { RoleAssignmentUncheckedUpdateWithoutUserInputSchema } from './RoleAssignmentUncheckedUpdateWithoutUserInputSchema';
import { RoleAssignmentCreateWithoutUserInputSchema } from './RoleAssignmentCreateWithoutUserInputSchema';
import { RoleAssignmentUncheckedCreateWithoutUserInputSchema } from './RoleAssignmentUncheckedCreateWithoutUserInputSchema';

export const RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RoleAssignmentUpdateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema;
