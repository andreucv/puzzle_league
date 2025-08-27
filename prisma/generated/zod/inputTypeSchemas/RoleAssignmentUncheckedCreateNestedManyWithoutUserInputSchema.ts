import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateWithoutUserInputSchema } from './RoleAssignmentCreateWithoutUserInputSchema';
import { RoleAssignmentUncheckedCreateWithoutUserInputSchema } from './RoleAssignmentUncheckedCreateWithoutUserInputSchema';
import { RoleAssignmentCreateOrConnectWithoutUserInputSchema } from './RoleAssignmentCreateOrConnectWithoutUserInputSchema';
import { RoleAssignmentCreateManyUserInputEnvelopeSchema } from './RoleAssignmentCreateManyUserInputEnvelopeSchema';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';

export const RoleAssignmentUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RoleAssignmentUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema).array(),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RoleAssignmentCreateOrConnectWithoutUserInputSchema),z.lazy(() => RoleAssignmentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RoleAssignmentCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RoleAssignmentUncheckedCreateNestedManyWithoutUserInputSchema;
