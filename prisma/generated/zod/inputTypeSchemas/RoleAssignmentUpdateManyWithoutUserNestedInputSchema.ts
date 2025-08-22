import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateWithoutUserInputSchema } from './RoleAssignmentCreateWithoutUserInputSchema';
import { RoleAssignmentUncheckedCreateWithoutUserInputSchema } from './RoleAssignmentUncheckedCreateWithoutUserInputSchema';
import { RoleAssignmentCreateOrConnectWithoutUserInputSchema } from './RoleAssignmentCreateOrConnectWithoutUserInputSchema';
import { RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema } from './RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema';
import { RoleAssignmentCreateManyUserInputEnvelopeSchema } from './RoleAssignmentCreateManyUserInputEnvelopeSchema';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema } from './RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema';
import { RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema } from './RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema';
import { RoleAssignmentScalarWhereInputSchema } from './RoleAssignmentScalarWhereInputSchema';

export const RoleAssignmentUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentCreateWithoutUserInputSchema).array(),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RoleAssignmentCreateOrConnectWithoutUserInputSchema),z.lazy(() => RoleAssignmentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => RoleAssignmentUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RoleAssignmentCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => RoleAssignmentUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => RoleAssignmentUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RoleAssignmentScalarWhereInputSchema),z.lazy(() => RoleAssignmentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RoleAssignmentUpdateManyWithoutUserNestedInputSchema;
